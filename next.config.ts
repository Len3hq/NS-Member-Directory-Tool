import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server in .next/standalone — used by Docker.
  output: 'standalone',

  // Keep heavy server-only packages out of the bundle so Next.js loads
  // them directly from node_modules at runtime.
  serverExternalPackages: ['@elizaos/core'],
};

export default nextConfig;
