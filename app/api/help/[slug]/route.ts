import {NextResponse} from "next/server";
import {helpSlugSchema} from "@/lib/help-circle";
import {createSupabasePublic} from "@/lib/supabase/public";

export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(!helpSlugSchema.safeParse(slug).success)return NextResponse.json({error:"Board not found"},{status:404});
  const supabase=createSupabasePublic();if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data,error}=await supabase.rpc("public_help_board",{board_slug:slug});
  if(error||!data)return NextResponse.json({error:"Board not found"},{status:404});
  return NextResponse.json({board:data},{headers:{"Cache-Control":"no-store"}});
}
