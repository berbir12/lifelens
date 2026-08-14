import {describe,expect,it} from "vitest";
import {createInvitationToken,hashInvitationToken,invitationExpiry,safeReturnPath} from "@/lib/family-invitations";

describe("family invitations",()=>{
  it("creates URL-safe, high-entropy tokens and stable hashes",()=>{const first=createInvitationToken(),second=createInvitationToken();expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(first.hash).toBe(hashInvitationToken(first.token));expect(second.hash).not.toBe(first.hash)});
  it("expires invitations in the future",()=>{expect(new Date(invitationExpiry()).getTime()).toBeGreaterThan(Date.now())});
  it("only permits local return paths",()=>{expect(safeReturnPath("/family/invite/abc","/onboarding")).toBe("/family/invite/abc");expect(safeReturnPath("https://evil.test","/onboarding")).toBe("/onboarding");expect(safeReturnPath("//evil.test","/onboarding")).toBe("/onboarding")});
});
