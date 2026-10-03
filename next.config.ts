import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Lets the dev server be opened as http://127.0.0.1:3000 too (e.g. to test with a fresh profile).
  allowedDevOrigins: ["127.0.0.1"],
  // Personal copies of official exam material (private/, gitignored) must never end up in a deployment.
  outputFileTracingExcludes: { "*": ["private/**"] },
  // Pre-rendered voice files are named after a hash of text + speaker, so a file never changes.
  async headers() {
    return [{ source: "/audio/tts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  experimental: {
    // The root layout lives in app/[locale]; unmatched URLs need a standalone 404 page.
    globalNotFound: true,
  },
};

export default nextConfig;
