import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { planAmount, validChapaWebhook } from "@/lib/billing";

describe("Chapa billing", () => {
  afterEach(() => delete process.env.CHAPA_WEBHOOK_SECRET);

  it("uses the advertised monthly USD prices", () => {
    expect(planAmount("PLUS")).toBe("8.00");
    expect(planAmount("FAMILY")).toBe("14.00");
  });

  it("accepts a valid payload signature", () => {
    process.env.CHAPA_WEBHOOK_SECRET = "test-secret";
    const body = JSON.stringify({ event: "charge.success", tx_ref: "ref-1" });
    const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
    expect(validChapaWebhook(body, [signature])).toBe(true);
  });

  it("rejects missing and invalid signatures", () => {
    process.env.CHAPA_WEBHOOK_SECRET = "test-secret";
    expect(validChapaWebhook("{}", [null, "bad"])).toBe(false);
  });
});
