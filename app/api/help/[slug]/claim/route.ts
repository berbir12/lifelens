import {NextRequest,NextResponse} from "next/server";
import {helpClaimSchema,helpSlugSchema} from "@/lib/help-circle";
import {createSupabasePublic} from "@/lib/supabase/public";

export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)return NextResponse.json({error:"Board not found"},{status:404});
  const parsed=helpClaimSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter your name."},{status:400});
  const supabase=createSupabasePublic();if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data,error}=await supabase.rpc("public_claim_help_task",{board_slug:slug,task_uuid:parsed.data.taskId,helper_name:parsed.data.name});
  if(error)return NextResponse.json({error:"Could not claim this task."},{status:400});if(!data)return NextResponse.json({error:"Someone else just claimed this task."},{status:409});return NextResponse.json({ok:true});
}
