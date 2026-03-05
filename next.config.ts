import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from S3 / R2 hosts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },

  // Externalize heavy server-only packages so Next.js doesn't bundle them
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Silence Turbopack/webpack mismatch warning (no custom webpack config needed)
  turbopack: {},
};

export default nextConfig;
