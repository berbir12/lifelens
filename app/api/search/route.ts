import {NextRequest,NextResponse} from "next/server";
import {searchSchema} from "@/lib/validation";
import {createSupabaseServer} from "@/lib/supabase/server";

type SearchResult={id:string;title:string;description:string;category:string;occurred_at:string;source:string|null;href:string};

export async function GET(req:NextRequest){
  const parsed=searchSchema.safeParse({query:req.nextUrl.searchParams.get("q")??""});
  if(!parsed.success)return NextResponse.json({error:"Enter at least two characters"},{status:400});
  const supabase=await createSupabaseServer();if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const safe=parsed.data.query.replace(/[%_,()]/g," ").trim(),like=`%${safe}%`;
  const [timeline,medications,appointments,checkIns,documents,memories]=await Promise.all([
    supabase.from("timeline_events").select("id,title,description,category,occurred_at,source").eq("user_id",user.id).or(`title.ilike.${like},description.ilike.${like},category.ilike.${like},source.ilike.${like}`).limit(30),
    supabase.from("medications").select("id,name,dosage,schedule,reason,prescriber,created_at").eq("user_id",user.id).or(`name.ilike.${like},dosage.ilike.${like},schedule.ilike.${like},reason.ilike.${like},prescriber.ilike.${like}`).limit(20),
    supabase.from("appointments").select("id,title,provider,location,notes,starts_at").eq("user_id",user.id).or(`title.ilike.${like},provider.ilike.${like},location.ilike.${like},notes.ilike.${like}`).limit(20),
    supabase.from("check_ins").select("id,transcript,recorded_at").eq("user_id",user.id).ilike("transcript",like).limit(20),
    supabase.from("documents").select("id,name,status,created_at").eq("user_id",user.id).ilike("name",like).limit(20),
    supabase.from("memories").select("id,caption,mood,memory_date").eq("user_id",user.id).or(`caption.ilike.${like},mood.ilike.${like}`).limit(20),
  ]);
  const failed=[timeline,medications,appointments,checkIns,documents,memories].find(result=>result.error);
  if(failed?.error){console.error("search.query_failed",{code:failed.error.code});return NextResponse.json({error:"Search failed"},{status:500})}
  const results:SearchResult[]=[
    ...(timeline.data??[]).map(x=>({id:`timeline:${x.id}`,title:x.title,description:x.description,category:x.category,occurred_at:x.occurred_at,source:x.source,href:"/story"})),
    ...(medications.data??[]).map(x=>({id:`medication:${x.id}`,title:x.name,description:[x.dosage,x.schedule,x.reason,x.prescriber].filter(Boolean).join(" · "),category:"Medication",occurred_at:x.created_at,source:"Medicine Cabinet",href:"/medications"})),
    ...(appointments.data??[]).map(x=>({id:`appointment:${x.id}`,title:x.title,description:[x.provider,x.location,x.notes].filter(Boolean).join(" · "),category:"Appointment",occurred_at:x.starts_at,source:"Appointments",href:"/dashboard"})),
    ...(checkIns.data??[]).map(x=>({id:`check-in:${x.id}`,title:"Personal check-in",description:x.transcript,category:"Check-in",occurred_at:x.recorded_at,source:"Check-ins",href:"/story"})),
    ...(documents.data??[]).map(x=>({id:`document:${x.id}`,title:x.name,description:`Stored document · ${x.status}`,category:"Document",occurred_at:x.created_at,source:"Health documents",href:"/documents"})),
    ...(memories.data??[]).map(x=>({id:`memory:${x.id}`,title:x.mood||"Memory",description:x.caption,category:"Memory",occurred_at:`${x.memory_date}T12:00:00Z`,source:"Memories",href:"/memories"})),
  ].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)).slice(0,60);
  return NextResponse.json({query:parsed.data.query,results,nextCursor:null});
}
