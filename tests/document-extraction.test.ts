import { describe, expect, it } from "vitest";
import { confirmMedicationSchema, documentExtractionSchema, extractionInstructions } from "@/lib/ai/document-extraction";

describe("AI document extraction safety", () => {
  it("accepts a reviewable medication extraction", () => {
    const parsed = documentExtractionSchema.safeParse({
      documentType: "prescription",
      summary: "A prescription containing one medication.",
      medications: [{ name: "Metformin", dosage: "500 mg", schedule: "twice daily", reason: null, prescriber: null, refillDate: null, expirationDate: null, sourcePage: 1, confidence: 0.96 }],
      warnings: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("requires confirmed dosage and schedule before saving", () => {
    expect(confirmMedicationSchema.safeParse({ extractionId: crypto.randomUUID(), medicationIndex: 0, medication: { name: "Metformin", dosage: "", schedule: "" } }).success).toBe(false);
  });

  it("treats uploaded document instructions as untrusted", () => {
    expect(extractionInstructions()).toContain("untrusted data");
    expect(extractionInstructions()).toContain("Do not diagnose");
  });
});
