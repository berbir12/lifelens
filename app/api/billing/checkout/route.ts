import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {initializeChapaTransaction,planAmount} from "@/lib/billing";
import {initializeDodoCheckout} from "@/lib/dodo-billing";
import {createSupabaseAdmin} from "@/lib/supabase/admin";
import {createSupabaseServer} from "@/lib/supabase/server";

export async function POST(request:NextRequest){
  const supabase=await createSupabaseServer();if(!supabase)return NextResponse.json({error:"Supabase is not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=z.object({plan:z.enum(["PLUS","FAMILY"]),provider:z.enum(["chapa","dodo"]).default("chapa"),interval:z.enum(["monthly","annual"]).default("monthly")}).safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid plan, billing interval, or payment provider"},{status:400});
  const name=String(user.user_metadata?.full_name??user.user_metadata?.name??user.email?.split("@")[0]??"LifeLens Member");
  try{
    if(parsed.data.provider==="dodo"){
      if(!user.email)return NextResponse.json({error:"Add an email address before starting a subscription."},{status:400});
      return NextResponse.json({url:await initializeDodoCheckout({plan:parsed.data.plan,interval:parsed.data.interval,userId:user.id,email:user.email,name})});
    }
    const reference=`lifelens-${crypto.randomUUID()}`,amount=planAmount(parsed.data.plan);
    const {error}=await createSupabaseAdmin().from("checkout_attempts").insert({user_id:user.id,plan:parsed.data.plan,reference,amount,currency:"USD"});if(error)throw new Error(`SUPABASE_${error.code}`);
    return NextResponse.json({url:await initializeChapaTransaction({plan:parsed.data.plan,reference,email:user.email??null,name})});
  }catch(error){const detail=error instanceof Error?error.message:"unknown";console.error(JSON.stringify({level:"error",message:"billing_checkout_failed",provider:parsed.data.provider,detail}));const message=detail==="CHAPA_NOT_CONFIGURED"?"Chapa checkout is not configured.":detail==="DODO_NOT_CONFIGURED"||detail==="DODO_PRODUCT_NOT_CONFIGURED"?"International subscriptions are not configured.":"Checkout could not be started.";return NextResponse.json({error:message},{status:503})}
}
