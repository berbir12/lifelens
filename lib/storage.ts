import {createClient} from "@supabase/supabase-js";
export function storageAdmin(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("STORAGE_NOT_CONFIGURED");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from(process.env.SUPABASE_STORAGE_BUCKET??"medical-documents")}
export function safeFilename(name:string){return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g,"-").replace(/-+/g,"-").slice(0,120)}
