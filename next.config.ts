import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/*": ["./data/.assembled.json", "./data/claims/**/*.json"],
  },
};

export default nextConfig;
