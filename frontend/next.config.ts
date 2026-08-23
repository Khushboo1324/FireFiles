import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.fireflies.ai",
        port: "",
        pathname: "/logo.png",
        search: "",
      },
    ],
  },
};

export default nextConfig;
