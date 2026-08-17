import {describe,expect,it} from "vitest";
import {createHelpSlug,helpBoardSchema,helpClaimSchema,helpSlugSchema} from "@/lib/help-circle";

describe("Help Circle access inputs",()=>{
  it("creates unguessable URL-safe slugs",()=>{const a=createHelpSlug(),b=createHelpSlug();expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(helpSlugSchema.safeParse(a).success).toBe(true);expect(a).not.toBe(b)});
  it("bounds labels and helper names",()=>{expect(helpBoardSchema.safeParse({label:"Helping with Mom"}).success).toBe(true);expect(helpClaimSchema.safeParse({taskId:crypto.randomUUID(),name:""}).success).toBe(false)});
  it("rejects short or path-like slugs",()=>{expect(helpSlugSchema.safeParse("guessable").success).toBe(false);expect(helpSlugSchema.safeParse("../"+"a".repeat(40)).success).toBe(false)});
});
