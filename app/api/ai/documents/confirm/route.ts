import { NextRequest, NextResponse } from "next/server";
import { confirmMedicationSchema, documentExtractionSchema } from "@/lib/ai/document-extraction";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = confirmMedicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the medication name, dosage, and schedule." }, { status: 400 });

  const { data: extraction } = await supabase.from("document_extractions").select("id,output,confirmed_items").eq("id", parsed.data.extractionId).eq("user_id", user.id).maybeSingle();
  const checked = documentExtractionSchema.safeParse(extraction?.output);
  if (!extraction || !checked.success || !checked.data.medications[parsed.data.medicationIndex]) {
    return NextResponse.json({ error: "The extraction is no longer available." }, { status: 404 });
  }
  if ((extraction.confirmed_items ?? []).includes(parsed.data.medicationIndex)) {
    return NextResponse.json({ error: "This medication has already been added." }, { status: 409 });
  }

  const medication = parsed.data.medication;
  const { data: record, error } = await supabase.from("medications").insert({
    user_id: user.id,
    name: medication.name,
    dosage: medication.dosage,
    schedule: medication.schedule,
    reason: medication.reason || null,
    prescriber: medication.prescriber || null,
    refill_date: medication.refillDate || null,
    expiration_date: medication.expirationDate || null,
    source_extraction_id: extraction.id,
    source_item_index: parsed.data.medicationIndex,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This medication has already been added." : "The reviewed medication could not be saved." }, { status: error.code === "23505" ? 409 : 500 });

  const confirmedItems = [...(extraction.confirmed_items ?? []), parsed.data.medicationIndex];
  await supabase.from("document_extractions").update({ confirmed_items: confirmedItems, confirmed_at: new Date().toISOString() }).eq("id", extraction.id).eq("user_id", user.id);
  return NextResponse.json({ record }, { status: 201 });
}
