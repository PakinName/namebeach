import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  allowedDevOrigins: ['starting-treo-greater-cat.trycloudflare.com'],
};

export default nextConfig;
