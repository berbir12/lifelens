import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {documentSchema} from "@/lib/validation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {safeFilename,storageAdmin} from "@/lib/storage";
import {activePlan,PLAN_LIMITS} from "@/lib/entitlements";

async function context(){const supabase=await createSupabaseServer();if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user?{supabase,user}:null}

export async function GET(){
  const ctx=await context();
  if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data,error}=await ctx.supabase.from("documents").select("id,name,mime_type,status,created_at").eq("user_id",ctx.user.id).order("created_at",{ascending:false}).limit(50);
  if(error)return NextResponse.json({error:"Could not load documents"},{status:500});
  return NextResponse.json({records:(data??[]).map(x=>({id:x.id,name:x.name,mimeType:x.mime_type,status:x.status,createdAt:x.created_at}))});
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
  const parsed=z.object({id:z.string().uuid()}).safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid document"},{status:400});
  const {error}=await ctx.supabase.from("documents").update({status:"STORED"}).eq("id",parsed.data.id).eq("user_id",ctx.user.id);
  if(error)return NextResponse.json({error:"Could not finish upload"},{status:500});
  return NextResponse.json({ok:true});
}
