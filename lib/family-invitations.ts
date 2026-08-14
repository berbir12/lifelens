import { createHash, randomBytes } from "node:crypto";

export const FAMILY_INVITE_DAYS = 7;
export function createInvitationToken() { const token = randomBytes(32).toString("base64url"); return { token, hash: hashInvitationToken(token) }; }
export function hashInvitationToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function invitationExpiry() { return new Date(Date.now() + FAMILY_INVITE_DAYS * 86_400_000).toISOString(); }
export function safeReturnPath(value: string | null | undefined, fallback = "/dashboard") { return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback; }
