import Link from "next/link";
import { redirect } from "next/navigation";
import { SimplePage } from "@/components/simple-page";
import { BillingPlans } from "@/components/billing-plans";
import { AccountControls } from "@/components/account-controls";
import { createSupabaseServer } from "@/lib/supabase/server";
import { activePlan } from "@/lib/entitlements";

export default async function Settings(){
  const supabase=await createSupabaseServer();if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const {data:subscription}=await supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id",user.id).maybeSingle();
  const plan=activePlan(subscription);
  return <SimplePage eyebrow="Account" title="Settings" description="Billing, privacy, data controls, and account security."><section className="border border-black/20 bg-[#faf9f5] p-5"><h2 className="font-semibold">Plan</h2><p className="mt-2 text-sm text-black/50">Current access: {plan}. Paid access lasts 30 days and does not renew automatically.</p><BillingPlans currentPlan={plan}/></section><section className="mt-6 grid gap-3 border border-black/20 bg-[#faf9f5] p-5 sm:grid-cols-2"><Link href="/notifications" className="border border-black/15 p-4 text-sm font-semibold">Notifications →</Link><Link href="/family" className="border border-black/15 p-4 text-sm font-semibold">Family permissions →</Link><Link href="/privacy" className="border border-black/15 p-4 text-sm font-semibold">Privacy Policy →</Link><Link href="/terms" className="border border-black/15 p-4 text-sm font-semibold">Terms of Service →</Link></section><AccountControls/></SimplePage>;
}
