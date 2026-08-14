import "server-only";
import { Resend } from "resend";

type InvitationEmail = { to: string; inviterName: string; acceptUrl: string; invitationId: string };
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!); }
export function emailConfigured() { return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.LIFELENS_EMAIL_FROM?.trim()); }
export async function sendFamilyInvitation(input: InvitationEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim(), from = process.env.LIFELENS_EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");
  const inviter = escapeHtml(input.inviterName), link = escapeHtml(input.acceptUrl), resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from, to: input.to, subject: `${input.inviterName} invited you to their LifeLens Family Circle`,
    text: `${input.inviterName} invited you to join their LifeLens Family Circle. Accept within 7 days: ${input.acceptUrl}\n\nOnly accept if you recognize this person. LifeLens will not share their health information until you accept.`,
    html: `<div style="background:#f4f2ec;padding:32px 16px;font-family:Arial,sans-serif;color:#182019"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #d8d4ca;padding:32px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#60715e">LifeLens Family Circle</p><h1 style="font-size:28px;line-height:1.2">${inviter} invited you</h1><p style="font-size:16px;line-height:1.6">Join their private Family Circle to contribute check-ins and view only the information they choose to share.</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#23392c;color:#fff;text-decoration:none;padding:13px 20px;font-weight:700">Review invitation</a></p><p style="font-size:13px;line-height:1.5;color:#6b6b66">This invitation expires in 7 days. Only accept if you recognize ${inviter}. No health information is included in this email.</p></div></div>`,
  }, { idempotencyKey: `family-invite-${input.invitationId}` });
  if (result.error || !result.data?.id) throw new Error(result.error?.name ?? "EMAIL_SEND_FAILED");
  return result.data.id;
}

