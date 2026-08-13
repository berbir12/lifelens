import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const origin=process.env.NEXT_PUBLIC_APP_URL??"https://lifelens.bitlabsbuild.com";return [{url:origin,changeFrequency:"weekly",priority:1},{url:`${origin}/privacy`,changeFrequency:"monthly",priority:.3},{url:`${origin}/terms`,changeFrequency:"monthly",priority:.3}]}
