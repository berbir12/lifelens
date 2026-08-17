import {NextRequest,NextResponse} from "next/server";
import {helpSlugSchema,helpUpdateSchema} from "@/lib/help-circle";
import {createSupabasePublic} from "@/lib/supabase/public";

export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)return NextResponse.json({error:"Board not found"},{status:404});
  const parsed=helpUpdateSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter your name and an update."},{status:400});
  const supabase=createSupabasePublic();if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data,error}=await supabase.rpc("public_add_help_update",{board_slug:slug,helper_name:parsed.data.name,update_body:parsed.data.body});
  if(error)return NextResponse.json({error:"This board is unavailable."},{status:404});return NextResponse.json({id:data},{status:201});
}
