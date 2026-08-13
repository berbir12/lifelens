import { createHmac, timingSafeEqual } from "node:crypto";

export type PaidPlan = "PLUS" | "FAMILY";

const CHAPA_API = "https://api.chapa.co/v1";
const prices: Record<PaidPlan, string> = { PLUS: "8.00", FAMILY: "14.00" };

export function planAmount(plan: PaidPlan) {
  return prices[plan];
}

export function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("APP_URL_NOT_CONFIGURED");
  return new URL(value).origin;
}

export async function initializeChapaTransaction(input: {
  plan: PaidPlan;
  reference: string;
  email: string | null;
  name: string;
}) {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new Error("CHAPA_NOT_CONFIGURED");
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const origin = appUrl();
  const response = await fetch(`${CHAPA_API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      amount: planAmount(input.plan),
      currency: "USD",
      email: input.email ?? undefined,
      first_name: firstName || "LifeLens",
      last_name: rest.join(" ") || "Member",
      tx_ref: input.reference,
      callback_url: `${origin}/api/billing/chapa/callback`,
      return_url: `${origin}/billing/return?tx_ref=${encodeURIComponent(input.reference)}`,
      customization: {
        title: `LifeLens ${input.plan === "PLUS" ? "Plus" : "Family"}`,
        description: "30-day LifeLens plan access",
      },
      meta: { plan: input.plan },
    }),
  });
  const body = (await response.json().catch(() => null)) as
    | { status?: string; message?: string; data?: { checkout_url?: string } }
    | null;
  const checkoutUrl = body?.data?.checkout_url;
  if (!response.ok || body?.status !== "success" || !checkoutUrl) {
    console.error("chapa.initialize_failed", { status: response.status, message: body?.message });
    throw new Error("CHAPA_INITIALIZE_FAILED");
  }
  return checkoutUrl;
}

export type ChapaVerification = {
  status?: string;
  data?: { status?: string; amount?: number | string; currency?: string; tx_ref?: string; mode?: string };
};

export async function verifyChapaTransaction(reference: string) {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new Error("CHAPA_NOT_CONFIGURED");
  const response = await fetch(`${CHAPA_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as ChapaVerification | null;
  if (!response.ok || body?.status !== "success" || !body.data) return null;
  return body.data;
}

function safeHexEqual(left: string, right: string) {
  if (!/^[a-f\d]+$/i.test(left) || !/^[a-f\d]+$/i.test(right)) return false;
  const a = Buffer.from(left, "hex"), b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validChapaWebhook(rawBody: string, signatures: Array<string | null>) {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) return false;
  const payloadHash = createHmac("sha256", secret).update(rawBody).digest("hex");
  const secretHash = createHmac("sha256", secret).update(secret).digest("hex");
  return signatures.some(signature =>
    Boolean(signature && (safeHexEqual(signature, payloadHash) || safeHexEqual(signature, secretHash))),
  );
}
