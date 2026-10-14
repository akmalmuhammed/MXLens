import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // The engine is a workspace package shipped as TypeScript-compiled ESM.
  transpilePackages: ["@mxlens/engine"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
