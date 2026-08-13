import {createClient} from "@supabase/supabase-js";
export function createSupabaseAdmin(){const url=process.env.SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
