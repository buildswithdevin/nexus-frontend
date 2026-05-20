import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from common favicon/thumbnail domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons/**" },
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
  // Silence noisy build output
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
