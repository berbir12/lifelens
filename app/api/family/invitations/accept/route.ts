import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashInvitationToken } from "@/lib/family-invitations";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in with the invited email address." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation." }, { status: 400 });
  const admin = createSupabaseAdmin();
  const { data: invitation } = await admin.from("family_members").select("id,email,status,invite_expires_at").eq("invite_token_hash", hashInvitationToken(parsed.data.token)).maybeSingle();
  if (!invitation) return NextResponse.json({ error: "This invitation is invalid or has been replaced." }, { status: 404 });
  if (invitation.status === "accepted") return NextResponse.json({ ok: true, alreadyAccepted: true });
  if (!invitation.invite_expires_at || new Date(invitation.invite_expires_at) <= new Date()) return NextResponse.json({ error: "This invitation has expired. Ask your family member to send another one." }, { status: 410 });
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) return NextResponse.json({ error: `Sign in as ${invitation.email} to accept this invitation.` }, { status: 403 });
  const { data, error } = await admin.from("family_members").update({ member_user_id: user.id, status: "accepted", accepted_at: new Date().toISOString(), invite_token_hash: null }).eq("id", invitation.id).eq("status", "invited").select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "The invitation could not be accepted." }, { status: 409 });
  return NextResponse.json({ ok: true });
}

