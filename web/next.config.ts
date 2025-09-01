import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Fix for Vercel deployment
  outputFileTracingRoot: process.cwd(),
  // Ensure proper static export if needed
  trailingSlash: false,
};

export default nextConfig;
