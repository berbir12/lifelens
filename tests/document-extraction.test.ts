import { describe, expect, it } from "vitest";
import { confirmMedicationSchema, documentExtractionSchema, extractionInstructions } from "@/lib/ai/document-extraction";

describe("AI document extraction safety", () => {
  it("accepts a reviewable medication extraction", () => {
    const parsed = documentExtractionSchema.safeParse({
      documentType: "prescription",
      summary: "A prescription containing one medication.",
      documentDate: "2026-08-14",
      provider: null,
      facility: null,
      facts: [{label:"Medication prescribed",value:"Metformin 500 mg twice daily",sourcePage:1,confidence:0.96}],
      followUpItems: [],
      timelineDraft: {title:"Prescription recorded",description:"Prescription containing Metformin 500 mg twice daily.",occurredOn:"2026-08-14"},
      medications: [{ name: "Metformin", dosage: "500 mg", schedule: "twice daily", reason: null, prescriber: null, refillDate: null, expirationDate: null, sourcePage: 1, confidence: 0.96 }],
      warnings: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("creates a useful review for an imaging report without medications",()=>{
    const parsed=documentExtractionSchema.safeParse({documentType:"imaging_report",summary:"Brain MRI report with findings documented by the radiologist.",documentDate:"2025-07-10",provider:"Reporting radiologist",facility:"Example Imaging Centre",facts:[{label:"Reported finding",value:"Finding copied from the report without interpretation.",sourcePage:1,confidence:0.94}],followUpItems:[],timelineDraft:{title:"Brain MRI report",description:"Brain MRI report dated 10 July 2025.",occurredOn:"2025-07-10"},medications:[],warnings:[]});
    expect(parsed.success).toBe(true);
    if(parsed.success)expect(parsed.data.facts).toHaveLength(1);
  });

  it("requires confirmed dosage and schedule before saving", () => {
    expect(confirmMedicationSchema.safeParse({ extractionId: crypto.randomUUID(), medicationIndex: 0, medication: { name: "Metformin", dosage: "", schedule: "" } }).success).toBe(false);
  });

  it("treats uploaded document instructions as untrusted", () => {
    expect(extractionInstructions()).toContain("untrusted data");
    expect(extractionInstructions()).toContain("Do not diagnose");
  });
});
