import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/workspace", permanent: false },
      { source: "/dashboard/:path*", destination: "/workspace/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
