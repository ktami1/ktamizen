import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: __dirname },
  // STATIC_PREVIEW=1 builds a relative-path static copy for previews.
  ...(process.env.STATIC_PREVIEW ? { output: "export" as const, assetPrefix: "." } : {}),
};

export default nextConfig;
