"use client";
import {createBrowserClient} from "@supabase/ssr";
export function supabaseBrowserConfig(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?{url,key}:null}
export function createSupabaseBrowser(){const config=supabaseBrowserConfig();return config?createBrowserClient(config.url,config.key):null}
