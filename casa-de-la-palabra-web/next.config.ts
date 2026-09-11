import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Tells the browser to never try http:// for this site again, so a
        // typed address or old bookmark can't land on the HTTP version — that
        // is what made Google Identity Services fail with origin_mismatch,
        // since only the https origin is registered in Google Cloud Console.
        source: "/:path*",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }],
      },
    ];
  },
};

export default nextConfig;
