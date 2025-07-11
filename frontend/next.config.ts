import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/:filename",
        destination: "/api/file?filename=:filename",
      },
    ];
  },
  // You can add more config options below if needed
};

export default nextConfig;
