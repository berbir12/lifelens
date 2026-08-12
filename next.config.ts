import type { NextConfig } from "next";
const config: NextConfig = { reactStrictMode: true, output:"standalone", outputFileTracingRoot: process.cwd(), experimental: { optimizePackageImports: ["lucide-react", "recharts"] } };
export default config;
