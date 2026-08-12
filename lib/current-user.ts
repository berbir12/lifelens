import {cache} from "react";import {createSupabaseServer} from "@/lib/supabase/server";
type Claims={sub?:string;email?:string;user_metadata?:Record<string,unknown>};
export const currentUser=cache(async()=>{const supabase=await createSupabaseServer();if(!supabase)return null;const {data,error}=await supabase.auth.getClaims();const claims=data?.claims as Claims|undefined;if(error||!claims?.sub)return null;const metadata=claims.user_metadata??{},email=claims.email??null,name=String(metadata.full_name??metadata.name??email?.split("@")[0]??"LifeLens member");return{id:claims.sub,email,name,image:typeof metadata.avatar_url==="string"?metadata.avatar_url:undefined}});
export async function currentUserId(){return(await currentUser())?.id??null}
