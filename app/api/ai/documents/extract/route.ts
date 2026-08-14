import { APICallError, generateText, Output } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AI_PROMPT_VERSION, documentExtractionSchema, extractionInstructions } from "@/lib/ai/document-extraction";
import { geminiConfig, geminiModel } from "@/lib/ai/gemini";
import { activePlan, PLAN_LIMITS } from "@/lib/entitlements";
import { storageAdmin } from "@/lib/storage";
import { createSupabaseServer } from "@/lib/supabase/server";

const requestSchema = z.object({ documentId: z.string().uuid() });
const SUPPORTED = new Set(["application/pdf", "image/jpeg", "image/png"]);
export const maxDuration=60;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.AI_DOCUMENT_REVIEW_ENABLED !== "true") return NextResponse.json({ error: "AI document review is not enabled." }, { status: 503 });
  if (!geminiConfig()) return NextResponse.json({ error: "AI document review is not configured yet." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });

  const [{ data: document }, { data: subscription }, { count }] = await Promise.all([
    supabase.from("documents").select("id,name,mime_type,storage_key,size_bytes,status").eq("id", parsed.data.documentId).eq("user_id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (document.status !== "STORED") return NextResponse.json({ error: "Wait for the upload to finish first." }, { status: 409 });
  if (!SUPPORTED.has(document.mime_type)) return NextResponse.json({ error: "AI review currently supports PDF, PNG, and JPEG files." }, { status: 415 });
  if (Number(document.size_bytes) > 10 * 1024 * 1024) return NextResponse.json({ error: "AI review currently supports files up to 10 MB." }, { status: 413 });

  const plan = activePlan(subscription);
  if ((count ?? 0) >= PLAN_LIMITS[plan].aiRequestsPerDay) {
    return NextResponse.json({ error: `Your ${plan.toLowerCase()} plan includes ${PLAN_LIMITS[plan].aiRequestsPerDay} AI document reviews per day.` }, { status: 429 });
  }

  const requestId = crypto.randomUUID();
  const { error: requestInsertError } = await supabase.from("ai_requests").insert({
    id: requestId, user_id: user.id, feature: "document_medication_extraction", status: "PROCESSING",
  });
  if (requestInsertError) return NextResponse.json({ error: "AI review tables are missing. Apply the latest Supabase migration." }, { status: 503 });

  try {
    const { data: blob, error: downloadError } = await storageAdmin().download(document.storage_key);
    if (downloadError || !blob) throw new Error("DOCUMENT_DOWNLOAD_FAILED");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const { model, modelId } = geminiModel();
    const result = await generateText({
      model,
      output: Output.object({
        name: "LifeLensMedicationExtraction",
        description: "Facts transcribed from a user-provided health document for user review.",
        schema: documentExtractionSchema,
      }),
      messages: [{
        role: "user",
        content: [
          { type: "text", text: extractionInstructions() },
          { type: "file", data: bytes, mediaType: document.mime_type, filename: document.name },
        ],
      }],
      abortSignal: AbortSignal.timeout(55_000),
    });
    const extraction = result.output;
    const extractionId = crypto.randomUUID();
    const { error: saveError } = await supabase.from("document_extractions").insert({
      id: extractionId,
      user_id: user.id,
      document_id: document.id,
      model: modelId,
      prompt_version: AI_PROMPT_VERSION,
      output: extraction,
    });
    if (saveError) throw new Error("EXTRACTION_SAVE_FAILED");
    await supabase.from("ai_requests").update({
      status: "SUCCEEDED",
      model: modelId,
      input_tokens: result.usage.inputTokens ?? 0,
      output_tokens: result.usage.outputTokens ?? 0,
      completed_at: new Date().toISOString(),
    }).eq("id", requestId).eq("user_id", user.id);
    return NextResponse.json({ extractionId, extraction });
  } catch (cause) {
    const failure=classifyFailure(cause);
    await supabase.from("ai_requests").update({status:"FAILED",error_code:failure.code,completed_at:new Date().toISOString()}).eq("id",requestId).eq("user_id",user.id);
    console.error("ai.document_extraction_failed",{requestId,code:failure.code,providerStatus:failure.providerStatus});
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
}

function classifyFailure(cause:unknown):{code:string;message:string;status:number;providerStatus?:number}{
  if(cause instanceof Error&&cause.message==="DOCUMENT_DOWNLOAD_FAILED")return {code:"DOCUMENT_DOWNLOAD_FAILED",message:"The stored document could not be downloaded. Upload it again and retry.",status:502};
  if(cause instanceof Error&&cause.message==="EXTRACTION_SAVE_FAILED")return {code:"EXTRACTION_SAVE_FAILED",message:"The review completed, but its draft could not be saved.",status:500};
  if(cause instanceof Error&&(cause.name==="TimeoutError"||cause.name==="AbortError"))return {code:"AI_TIMEOUT",message:"The AI review took too long. Try a smaller document or try again.",status:504};
  if(APICallError.isInstance(cause)){
    const providerStatus=cause.statusCode;
    if(providerStatus===401||providerStatus===403)return {code:"AI_AUTH_FAILED",message:"Gemini authentication failed. Check the GEMINI_API_KEY server variable.",status:503,providerStatus};
    if(providerStatus===404)return {code:"AI_MODEL_UNAVAILABLE",message:"The configured Gemini model is unavailable. Check GEMINI_MODEL.",status:503,providerStatus};
    if(providerStatus===429)return {code:"AI_QUOTA_EXCEEDED",message:"The free Gemini quota is currently exhausted. Try again after the quota resets.",status:429,providerStatus};
    if(providerStatus===400)return {code:"AI_DOCUMENT_REJECTED",message:"Gemini could not process this document. Try a smaller PDF, PNG, or JPEG.",status:422,providerStatus};
    return {code:"AI_PROVIDER_ERROR",message:"Gemini could not review this document right now. Try again shortly.",status:502,providerStatus};
  }
  return {code:"AI_REVIEW_FAILED",message:"This document could not be reviewed. Nothing was saved to your health record.",status:502};
}
