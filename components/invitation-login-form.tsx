"use client";
import {useState} from "react";
import {createSupabaseBrowser,supabaseBrowserConfig} from "@/lib/supabase/client";

export function InvitationLoginForm({next}:{next:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function login(){
    const client=createSupabaseBrowser();
    if(!client){setError("Supabase has not been configured.");return}
    setBusy(true);setError("");
    const {error:oauthError}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,queryParams:{access_type:"offline",prompt:"consent"}}});
    if(oauthError){setError("Google sign-in could not be started.");setBusy(false)}
  }
  return <main className="min-h-screen bg-[#f4f2ec] p-6 text-[#182019]"><section className="mx-auto mt-24 max-w-xl border border-black/20 bg-[#faf9f5] p-8"><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">LifeLens Family Circle</p><h1 className="mt-5 text-3xl font-medium">Sign in to review your invitation</h1><p className="mt-4 text-sm leading-6 text-black/55">Use the Google account whose email address received this invitation.</p><button onClick={()=>void login()} disabled={busy||!supabaseBrowserConfig()} className="mt-7 bg-[#23392c] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Opening Google…":"Continue with Google"}</button>{error?<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>:null}</section></main>;
}
