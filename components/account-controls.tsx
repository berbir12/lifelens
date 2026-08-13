"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountControls(){
  const router=useRouter();
  const [confirmation,setConfirmation]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function remove(){
    setBusy(true);setError("");
    const response=await fetch("/api/account",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({confirmation})});
    if(!response.ok){const body=await response.json().catch(()=>null);setError(body?.error??"Account deletion failed.");setBusy(false);return}
    router.replace("/");router.refresh();
  }
  return <section className="mt-8 border border-red-900/30 bg-red-50 p-5"><h2 className="font-semibold text-red-950">Data and account</h2><p className="mt-2 text-sm leading-6 text-red-950/65">Download your structured record at any time. Account deletion permanently removes your Supabase account and database records.</p><div className="mt-4 flex flex-wrap gap-3"><a href="/api/account/export" className="border border-black/25 bg-white px-4 py-3 text-sm font-semibold">Download record export</a></div><label className="mt-7 block text-sm font-semibold text-red-950">Type DELETE to permanently delete your account<input value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-2 h-11 w-full max-w-sm border border-red-900/30 bg-white px-3"/></label><button type="button" onClick={()=>void remove()} disabled={busy||confirmation!=="DELETE"} className="mt-3 bg-red-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy?"Deleting…":"Delete my account"}</button>{error?<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>:null}</section>
}
