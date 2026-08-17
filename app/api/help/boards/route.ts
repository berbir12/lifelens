import {NextRequest,NextResponse} from "next/server";
import {createHelpSlug,helpBoardSchema} from "@/lib/help-circle";
import {createSupabaseServer} from "@/lib/supabase/server";

async function context(){const supabase=await createSupabaseServer();if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user?{supabase,user}:null}

export async function GET(){
  const ctx=await context();if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data,error}=await ctx.supabase.from("help_boards").select("id,slug,circle_label,archived_at,created_at").eq("owner_id",ctx.user.id).order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"Could not load help boards."},{status:500});
  return NextResponse.json({boards:(data??[]).map(x=>({id:x.id,slug:x.slug,label:x.circle_label,archivedAt:x.archived_at,createdAt:x.created_at}))});
}

export async function POST(req:NextRequest){
  const ctx=await context();if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=helpBoardSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a board name of 80 characters or fewer."},{status:400});
  const {data,error}=await ctx.supabase.from("help_boards").insert({owner_id:ctx.user.id,slug:createHelpSlug(),circle_label:parsed.data.label}).select("id,slug,circle_label,created_at").single();
  if(error)return NextResponse.json({error:"Could not create the help board."},{status:500});
  return NextResponse.json({board:{id:data.id,slug:data.slug,label:data.circle_label,archivedAt:null,createdAt:data.created_at}},{status:201});
}
