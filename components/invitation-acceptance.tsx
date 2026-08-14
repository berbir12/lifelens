"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationAcceptance({ token, inviterName, invitedEmail, signedInEmail, expired, accepted }: { token: string; inviterName: string; invitedEmail: string; signedInEmail: string; expired: boolean; accepted: boolean }) {
  const router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const wrongAccount = invitedEmail.toLowerCase() !== signedInEmail.toLowerCase();
  async function accept() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/family/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "The invitation could not be accepted."); router.replace("/family"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The invitation could not be accepted."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#f4f2ec] p-6 text-[#182019]"><section className="mx-auto mt-20 max-w-xl border border-black/20 bg-[#faf9f5] p-8"><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">LifeLens Family Circle</p><h1 className="mt-5 text-3xl font-medium">{inviterName} invited you</h1><p className="mt-4 text-sm leading-6 text-black/55">Accepting lets you join their care circle. You will only see information they explicitly share, and you can leave later.</p><div className="mt-6 border border-black/15 bg-white p-4 text-sm"><b>Invited account</b><p className="mt-1 text-black/50">{invitedEmail}</p></div>{wrongAccount ? <p role="alert" className="mt-4 bg-red-50 p-4 text-sm text-red-800">You are signed in as {signedInEmail}. Sign out and use {invitedEmail}.</p> : null}{expired ? <p className="mt-4 text-sm text-red-700">This invitation has expired.</p> : null}{accepted ? <a href="/family" className="mt-6 inline-block bg-[#23392c] px-5 py-3 text-sm font-semibold text-white">Open Family Circle</a> : <button onClick={() => void accept()} disabled={busy || wrongAccount || expired} className="mt-6 bg-[#23392c] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Accepting…" : "Accept invitation"}</button>}{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</section></main>;
}
