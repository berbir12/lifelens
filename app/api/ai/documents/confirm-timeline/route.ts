import {NextRequest,NextResponse} from "next/server";
import {confirmTimelineSchema,documentExtractionSchema} from "@/lib/ai/document-extraction";
import {createSupabaseServer} from "@/lib/supabase/server";

export async function POST(request:NextRequest){
  const supabase=await createSupabaseServer();
  if(!supabase)return NextResponse.json({error:"Supabase is not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=confirmTimelineSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Review the timeline title, description, and date."},{status:400});
  const {data:extraction}=await supabase.from("document_extractions").select("id,output,timeline_event_id").eq("id",parsed.data.extractionId).eq("user_id",user.id).maybeSingle();
  const checked=documentExtractionSchema.safeParse(extraction?.output);
  if(!extraction||!checked.success)return NextResponse.json({error:"The document review is no longer available."},{status:404});
  if(extraction.timeline_event_id)return NextResponse.json({error:"This document has already been added to the timeline."},{status:409});
  const {data:event,error}=await supabase.from("timeline_events").insert({user_id:user.id,category:"Health",title:parsed.data.title,description:parsed.data.description,occurred_at:`${parsed.data.occurredOn}T12:00:00.000Z`,source:"AI-reviewed document",source_extraction_id:extraction.id}).select("id").single();
  if(error)return NextResponse.json({error:error.code==="23505"?"This document has already been added to the timeline.":"The timeline entry could not be saved."},{status:error.code==="23505"?409:500});
  await supabase.from("document_extractions").update({timeline_event_id:event.id,confirmed_at:new Date().toISOString()}).eq("id",extraction.id).eq("user_id",user.id);
  return NextResponse.json({record:event},{status:201});
}
