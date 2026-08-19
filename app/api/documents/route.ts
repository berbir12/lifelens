import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {documentSchema} from "@/lib/validation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {safeFilename,storageAdmin} from "@/lib/storage";
import {activePlan,PLAN_LIMITS} from "@/lib/entitlements";

async function context(){const supabase=await createSupabaseServer();if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user?{supabase,user}:null}

export async function GET(req:NextRequest){
  const ctx=await context();
  if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const documentId=req.nextUrl.searchParams.get("id");
  if(documentId){
    const parsed=z.string().uuid().safeParse(documentId);if(!parsed.success)return NextResponse.json({error:"Invalid document"},{status:400});
    const {data,error}=await ctx.supabase.from("documents").select("storage_key").eq("id",parsed.data).eq("user_id",ctx.user.id).maybeSingle();
    if(error||!data)return NextResponse.json({error:"Document not found"},{status:404});
    const {data:signed,error:signedError}=await storageAdmin().createSignedUrl(data.storage_key,60);
    if(signedError)return NextResponse.json({error:"Could not open document"},{status:503});
    return NextResponse.json({url:signed.signedUrl});
  }
  const folder=req.nextUrl.searchParams.get("folder"),unfiled=req.nextUrl.searchParams.get("unfiled")==="true";
  let query=ctx.supabase.from("documents").select("id,name,mime_type,status,created_at,folder_id").eq("user_id",ctx.user.id);
  if(folder){const parsed=z.string().uuid().safeParse(folder);if(!parsed.success)return NextResponse.json({error:"Invalid folder"},{status:400});query=query.eq("folder_id",parsed.data)}else if(unfiled)query=query.is("folder_id",null);
  const [{data,error},{data:folders}]=await Promise.all([query.order("created_at",{ascending:false}).limit(100),ctx.supabase.from("vault_folders").select("id,name,color").eq("user_id",ctx.user.id).order("name")]);
  if(error)return NextResponse.json({error:"Could not load documents"},{status:500});
  return NextResponse.json({records:(data??[]).map(x=>({id:x.id,name:x.name,mimeType:x.mime_type,status:x.status,createdAt:x.created_at,folderId:x.folder_id})),folders:folders??[]});
}

export async function POST(req:NextRequest){
  const ctx=await context();
  if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=documentSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Unsupported or invalid file"},{status:400});
  const [{data:subscription},{count}]=await Promise.all([
    ctx.supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id",ctx.user.id).maybeSingle(),
    ctx.supabase.from("documents").select("id",{count:"exact",head:true}).eq("user_id",ctx.user.id),
  ]);
  const plan=activePlan(subscription);
  if((count??0)>=PLAN_LIMITS[plan].documents)return NextResponse.json({error:`${plan} includes up to ${PLAN_LIMITS[plan].documents} stored documents.`},{status:403});

  const id=crypto.randomUUID(),path=`${ctx.user.id}/${id}/${safeFilename(parsed.data.name)}`;
  let token:string;
  try{
    const {data,error}=await storageAdmin().createSignedUploadUrl(path);
    if(error)throw error;
    token=data.token;
  }catch(cause){
    const message=cause instanceof Error?cause.message:"unknown";
    console.error("documents.signed_upload_failed",{code:message});
    if(message==="STORAGE_NOT_CONFIGURED")return NextResponse.json({error:"Supabase Storage is not configured on the server."},{status:503});
    if(/bucket.*not found|not found.*bucket/i.test(message))return NextResponse.json({error:"The private medical-documents storage bucket is missing."},{status:503});
    return NextResponse.json({error:"Supabase could not prepare the secure upload."},{status:503});
  }

  const {error:insertError}=await ctx.supabase.from("documents").insert({id,user_id:ctx.user.id,name:parsed.data.name,mime_type:parsed.data.mimeType,storage_key:path,size_bytes:parsed.data.size,status:"UPLOADING"});
  if(insertError){console.error("documents.record_create_failed",{code:insertError.code});return NextResponse.json({error:"The document record could not be created."},{status:500})}
  return NextResponse.json({id,path,token},{status:201});
}

export async function PATCH(req:NextRequest){
  const ctx=await context();
  if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(180).optional(),folderId:z.string().uuid().nullable().optional()}).safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid document"},{status:400});
  const update:Record<string,unknown>={};if(parsed.data.name!==undefined)update.name=parsed.data.name;if(parsed.data.folderId!==undefined){if(parsed.data.folderId){const {data:folder}=await ctx.supabase.from("vault_folders").select("id").eq("id",parsed.data.folderId).eq("user_id",ctx.user.id).maybeSingle();if(!folder)return NextResponse.json({error:"Folder not found"},{status:404})}update.folder_id=parsed.data.folderId}if(parsed.data.name===undefined&&parsed.data.folderId===undefined)update.status="STORED";
  const {error}=await ctx.supabase.from("documents").update(update).eq("id",parsed.data.id).eq("user_id",ctx.user.id);
  if(error)return NextResponse.json({error:"Could not finish upload"},{status:500});
  return NextResponse.json({ok:true});
}

export async function DELETE(req:NextRequest){
  const ctx=await context();if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=z.object({id:z.string().uuid()}).safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid document"},{status:400});
  const {data}=await ctx.supabase.from("documents").select("storage_key").eq("id",parsed.data.id).eq("user_id",ctx.user.id).maybeSingle();if(!data)return NextResponse.json({error:"Document not found"},{status:404});
  const {error:storageError}=await storageAdmin().remove([data.storage_key]);if(storageError)return NextResponse.json({error:"Could not remove the stored file"},{status:503});
  const {error}=await ctx.supabase.from("documents").delete().eq("id",parsed.data.id).eq("user_id",ctx.user.id);if(error)return NextResponse.json({error:"Could not delete document"},{status:500});
  return NextResponse.json({ok:true});
}
