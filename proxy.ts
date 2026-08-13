import { createServerClient } from "@supabase/ssr";
import { NextResponse,type NextRequest } from "next/server";

export async function proxy(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return NextResponse.next({request});
  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
  await supabase.auth.getClaims();
  return response;
}
// Keep public landing and social-card pages fast for preview crawlers.
export const config={matcher:[
  "/dashboard/:path*","/settings/:path*","/documents/:path*","/vault/:path*",
  "/memories/:path*","/family/:path*","/preparedness/:path*","/passport/:path*",
  "/doctor-visit/:path*","/insights/:path*","/medications/:path*",
  "/notifications/:path*","/search/:path*","/story/:path*","/onboarding/:path*",
  "/api/:path*",
]};
