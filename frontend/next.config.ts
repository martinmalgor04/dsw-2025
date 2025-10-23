import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Configure for production
  env: {
    PORT: '80',
  },
};

export default nextConfig;