import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default config;
