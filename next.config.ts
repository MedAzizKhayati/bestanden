import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Lets the dev server be opened as http://127.0.0.1:3000 too (e.g. to test with a fresh profile).
  allowedDevOrigins: ["127.0.0.1"],
  // Personal copies of official exam material (private/, gitignored) must never end up in a deployment.
  outputFileTracingExcludes: { "*": ["private/**"] },
  experimental: {
    // The root layout lives in app/[locale]; unmatched URLs need a standalone 404 page.
    globalNotFound: true,
  },
};

export default nextConfig;
