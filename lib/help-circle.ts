import {z} from "zod";

export const helpSlugSchema=z.string().regex(/^[A-Za-z0-9_-]{32,80}$/);
export const helpBoardSchema=z.object({label:z.string().trim().min(1).max(80)});
export const helpTaskSchema=z.object({title:z.string().trim().min(1).max(120),details:z.string().trim().max(500).optional(),dueAt:z.string().max(40).optional().or(z.literal("")),name:z.string().trim().min(1).max(60)}).refine(value=>!value.dueAt||!Number.isNaN(new Date(value.dueAt).getTime()),{message:"Invalid date"});
export const helpClaimSchema=z.object({taskId:z.string().uuid(),name:z.string().trim().min(1).max(60)});
export const helpCompleteSchema=helpClaimSchema;
export const helpUpdateSchema=z.object({name:z.string().trim().min(1).max(60),body:z.string().trim().min(1).max(500)});

export function createHelpSlug(){
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}
