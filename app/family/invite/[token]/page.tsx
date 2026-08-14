import { redirect } from "next/navigation";
import { InvitationAcceptance } from "@/components/invitation-acceptance";
import { hashInvitationToken } from "@/lib/family-invitations";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function FamilyInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) redirect("/login?error=invalid-invitation");
  const admin = createSupabaseAdmin();
  const { data: invitation } = await admin.from("family_members").select("user_id,email,status,invite_expires_at").eq("invite_token_hash", hashInvitationToken(token)).maybeSingle();
  if (!invitation) return <InvitationShell title="Invitation unavailable" body="This invitation is invalid, expired, or has been replaced."/>;
  const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", invitation.user_id).maybeSingle();
  const supabase = await createSupabaseServer();
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/family/invite/${token}`)}`);
  return <InvitationAcceptance token={token} inviterName={profile?.full_name ?? "Your family member"} invitedEmail={invitation.email} signedInEmail={user.email ?? ""} expired={!invitation.invite_expires_at || new Date(invitation.invite_expires_at) <= new Date()} accepted={invitation.status === "accepted"}/>;
}
function InvitationShell({ title, body }: { title: string; body: string }) { return <main className="min-h-screen bg-[#f4f2ec] p-6 text-[#182019]"><section className="mx-auto mt-24 max-w-xl border border-black/20 bg-[#faf9f5] p-8"><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">LifeLens Family Circle</p><h1 className="mt-5 text-3xl font-medium">{title}</h1><p className="mt-4 text-sm leading-6 text-black/55">{body}</p></section></main>; }

