import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configure for production
  env: {
    PORT: '80',
  },
};

export default nextConfig;