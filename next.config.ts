import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/portfolko",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
