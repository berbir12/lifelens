import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const TABLES = ["profiles","medications","appointments","check_ins","family_members","timeline_events","documents","memories","family_checkins","user_notifications","emergency_profiles","doctor_questions","habits","habit_logs","medical_expenses","family_history","health_capsules","subscriptions"] as const;

export async function GET(){
  const supabase=await createSupabaseServer();
  if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const entries=await Promise.all(TABLES.map(async table=>{
    const ownerColumn=table==="family_checkins"?"owner_id":"user_id";
    const {data,error}=await supabase.from(table).select("*").eq(ownerColumn,user.id);
    return [table,error?{error:error.message}:data??[]] as const;
  }));
  const body=JSON.stringify({exportedAt:new Date().toISOString(),account:{id:user.id,email:user.email},data:Object.fromEntries(entries)},null,2);
  return new NextResponse(body,{headers:{"content-type":"application/json; charset=utf-8","content-disposition":`attachment; filename="lifelens-export-${new Date().toISOString().slice(0,10)}.json"`,"cache-control":"no-store"}});
}
