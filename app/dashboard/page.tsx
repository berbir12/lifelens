import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { currentUser } from "@/lib/current-user";
import { createSupabaseServer } from "@/lib/supabase/server";
import { activePlan } from "@/lib/entitlements";

export default async function Page(){
  const authUser=await currentUser();if(!authUser)redirect("/login");
  const supabase=await createSupabaseServer();if(!supabase)redirect("/login");
  const [profile,medications,appointments,checkIns,family,timeline,subscription]=await Promise.all([
    supabase.from("profiles").select("full_name,goals,conditions,preferred_language,timezone").eq("user_id",authUser.id).maybeSingle(),
    supabase.from("medications").select("id,name,dosage,schedule,active").eq("user_id",authUser.id).order("created_at",{ascending:false}).limit(5),
    supabase.from("appointments").select("id,title,provider,starts_at,location").eq("user_id",authUser.id).gte("starts_at",new Date().toISOString()).order("starts_at").limit(3),
    supabase.from("check_ins").select("id,transcript,recorded_at").eq("user_id",authUser.id).order("recorded_at",{ascending:false}).limit(4),
    supabase.from("family_members").select("id,email,status,can_view_timeline").eq("user_id",authUser.id).order("created_at",{ascending:false}).limit(5),
    supabase.from("timeline_events").select("id,category,title,description,occurred_at,source").eq("user_id",authUser.id).order("occurred_at",{ascending:false}).limit(6),
    supabase.from("subscriptions").select("provider,plan,status,current_period_end").eq("user_id",authUser.id).maybeSingle(),
  ]);
  const plan=activePlan(subscription.data);
  const normalizedSubscription=subscription.data?{...subscription.data,plan,status:plan==="PERSONAL"?"EXPIRED":subscription.data.status,current_period_end:plan==="PERSONAL"?null:subscription.data.current_period_end}:null;
  return <Dashboard user={{...authUser,name:profile.data?.full_name??authUser.name,hasProfile:Boolean(profile.data)}} profile={profile.data} medications={medications.data??[]} appointments={appointments.data??[]} checkIns={checkIns.data??[]} family={family.data??[]} timeline={timeline.data??[]} subscription={normalizedSubscription}/>;
}
