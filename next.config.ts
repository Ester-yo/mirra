import type { NextConfig } from "next";

const basePath = process.env.MIRRA_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  outputFileTracingRoot: process.cwd(),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
    ],
  },
};

export default nextConfig;
