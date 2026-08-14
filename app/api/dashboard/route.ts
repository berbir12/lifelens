import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { activePlan, PLAN_LIMITS } from "@/lib/entitlements";
import { emailConfigured, sendFamilyInvitation } from "@/lib/email/family-invitation";
import { createInvitationToken, invitationExpiry } from "@/lib/family-invitations";
import { createSupabaseServer } from "@/lib/supabase/server";

const input = z.discriminatedUnion("type", [
  z.object({ type: z.literal("medication"), name: z.string().trim().min(1).max(120), dosage: z.string().trim().min(1).max(120), schedule: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal("appointment"), title: z.string().trim().min(1).max(160), provider: z.string().trim().max(160).optional(), startsAt: z.string().datetime(), location: z.string().trim().max(200).optional() }),
  z.object({ type: z.literal("check_in"), transcript: z.string().trim().min(1).max(10000) }),
  z.object({ type: z.literal("family"), email: z.string().email().max(254), canViewTimeline: z.boolean().default(false) }),
]);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the information you entered." }, { status: 400 });
  const payload = parsed.data;
  if (payload.type === "family") return inviteFamilyMember(supabase, user, payload);

  let table: "medications" | "appointments" | "check_ins";
  let row: Record<string, unknown> = { user_id: user.id };
  if (payload.type === "medication") { table = "medications"; row = { ...row, name: payload.name, dosage: payload.dosage, schedule: payload.schedule }; }
  else if (payload.type === "appointment") { table = "appointments"; row = { ...row, title: payload.title, provider: payload.provider || null, starts_at: payload.startsAt, location: payload.location || null }; }
  else {
    table = "check_ins"; row = { ...row, transcript: payload.transcript };
    const { error: eventError } = await supabase.from("timeline_events").insert({ user_id: user.id, category: "Check-in", title: "Personal check-in", description: payload.transcript, source: "Manual check-in" });
    if (eventError) return NextResponse.json({ error: "Could not save the check-in." }, { status: 500 });
  }
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error("dashboard.create_failed", { table, code: error.code }); return NextResponse.json({ error: error.code === "23505" ? "That entry already exists." : "Could not save this information." }, { status: 500 }); }
  return NextResponse.json({ record: data }, { status: 201 });
}

async function inviteFamilyMember(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }, payload: { email: string; canViewTimeline: boolean }) {
  if (!emailConfigured()) return NextResponse.json({ error: "Family invitation email is not configured yet." }, { status: 503 });
  const email = payload.email.toLowerCase();
  if (email === user.email?.toLowerCase()) return NextResponse.json({ error: "Invite someone other than yourself." }, { status: 400 });
  const [{ data: subscription }, { data: existing }, { count }] = await Promise.all([
    supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle(),
    supabase.from("family_members").select("id,status").eq("user_id", user.id).eq("email", email).maybeSingle(),
    supabase.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  if (existing?.status === "accepted") return NextResponse.json({ error: "This person is already in your Family Circle." }, { status: 409 });
  const plan = activePlan(subscription);
  if (!existing && (count ?? 0) >= PLAN_LIMITS[plan].familyMembers) return NextResponse.json({ error: `${plan} includes up to ${PLAN_LIMITS[plan].familyMembers} family member${PLAN_LIMITS[plan].familyMembers === 1 ? "" : "s"}.` }, { status: 403 });

  const invitationId = existing?.id ?? crypto.randomUUID(), { token, hash } = createInvitationToken();
  const row = { id: invitationId, user_id: user.id, email, can_view_timeline: payload.canViewTimeline, status: "invited", invite_token_hash: hash, invite_expires_at: invitationExpiry(), email_sent_at: null, email_delivery_id: null };
  const save = existing ? await supabase.from("family_members").update(row).eq("id", invitationId).eq("user_id", user.id).select("id").single() : await supabase.from("family_members").insert(row).select("id").single();
  if (save.error) return NextResponse.json({ error: save.error.code === "42703" ? "Apply the latest family invitation migration in Supabase." : "Could not create the invitation." }, { status: 500 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) return NextResponse.json({ error: "The production application URL is not configured." }, { status: 503 });
  const inviterName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "A family member");
  try {
    const deliveryId = await sendFamilyInvitation({ to: email, inviterName, acceptUrl: `${appUrl}/family/invite/${token}`, invitationId: `${invitationId}-${hash.slice(0, 12)}` });
    await supabase.from("family_members").update({ email_sent_at: new Date().toISOString(), email_delivery_id: deliveryId }).eq("id", invitationId).eq("user_id", user.id);
    return NextResponse.json({ record: { id: invitationId, email, status: "invited" }, emailSent: true }, { status: 201 });
  } catch (cause) {
    console.error("family.invitation_email_failed", { invitationId, code: cause instanceof Error ? cause.message : "unknown" });
    return NextResponse.json({ error: "The invitation was created, but the email could not be sent. Try inviting this address again." }, { status: 502 });
  }
}
