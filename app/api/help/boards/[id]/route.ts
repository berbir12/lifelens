import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {createSupabaseServer} from "@/lib/supabase/server";

async function owner(){const supabase=await createSupabaseServer();if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user?{supabase,user}:null}
const actionSchema=z.object({action:z.enum(["archive","restore"])});

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const ctx=await owner();if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return NextResponse.json({error:"Invalid board"},{status:400});
  const parsed=actionSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid action"},{status:400});
  const {error}=await ctx.supabase.from("help_boards").update({archived_at:parsed.data.action==="archive"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",id).eq("owner_id",ctx.user.id);
  if(error)return NextResponse.json({error:"Could not update the board."},{status:500});return NextResponse.json({ok:true});
}

export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const ctx=await owner();if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return NextResponse.json({error:"Invalid board"},{status:400});
  const {error}=await ctx.supabase.from("help_boards").delete().eq("id",id).eq("owner_id",ctx.user.id);
  if(error)return NextResponse.json({error:"Could not delete the board."},{status:500});return NextResponse.json({ok:true});
}
