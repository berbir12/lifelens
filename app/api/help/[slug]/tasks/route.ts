import {NextRequest,NextResponse} from "next/server";
import {helpSlugSchema,helpTaskSchema} from "@/lib/help-circle";
import {createSupabasePublic} from "@/lib/supabase/public";

export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)return NextResponse.json({error:"Board not found"},{status:404});
  const parsed=helpTaskSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Check the task details."},{status:400});
  const supabase=createSupabasePublic();if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data,error}=await supabase.rpc("public_add_help_task",{board_slug:slug,task_title:parsed.data.title,task_details:parsed.data.details||null,task_due_at:parsed.data.dueAt?new Date(parsed.data.dueAt).toISOString():null});
  if(error)return NextResponse.json({error:"This board is unavailable."},{status:404});return NextResponse.json({id:data},{status:201});
}
