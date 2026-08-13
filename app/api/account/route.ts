import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(request:NextRequest){
  const supabase=await createSupabaseServer();
  if(!supabase)return NextResponse.json({error:"Not configured"},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=z.object({confirmation:z.literal("DELETE")}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Type DELETE to confirm."},{status:400});
  const admin=createSupabaseAdmin();
  const bucket=process.env.SUPABASE_STORAGE_BUCKET??"medical-documents";
  const {data:folders}=await admin.storage.from(bucket).list(user.id,{limit:1000});
  if(folders?.length){
    const nested=await Promise.all(folders.map(folder=>admin.storage.from(bucket).list(`${user.id}/${folder.name}`,{limit:1000})));
    const paths=nested.flatMap((result,index)=>(result.data??[]).map(file=>`${user.id}/${folders[index].name}/${file.name}`));
    if(paths.length)await admin.storage.from(bucket).remove(paths);
  }
  const {error}=await admin.auth.admin.deleteUser(user.id);
  if(error){console.error(JSON.stringify({level:"error",message:"account_delete_failed",code:error.status}));return NextResponse.json({error:"Account deletion failed. Contact support."},{status:500})}
  return NextResponse.json({ok:true});
}
