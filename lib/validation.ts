import {z} from "zod";
export const checkInSchema=z.object({transcript:z.string().trim().min(1).max(10_000),recordedAt:z.string().datetime().optional()});
export const searchSchema=z.object({query:z.string().trim().min(2).max(300),cursor:z.string().optional()});
export const documentSchema=z.object({name:z.string().min(1).max(180),mimeType:z.enum(["application/pdf","image/jpeg","image/png","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),size:z.number().int().positive().max(20*1024*1024)});
