import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@crowdvote/types"],
};

export default nextConfig;
