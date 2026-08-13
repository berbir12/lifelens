import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { createSupabaseServer } from "@/lib/supabase/server";
export default async function Onboarding(){const supabase=await createSupabaseServer();if(!supabase)redirect("/login");const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const {data:profile}=await supabase.from("profiles").select("user_id").eq("user_id",user.id).maybeSingle();if(profile)redirect("/dashboard");return <OnboardingForm/>}
