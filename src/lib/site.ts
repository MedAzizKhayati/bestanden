export const site = {
  name: "Bestanden",
  /**
   * Public origin for absolute URLs (sitemap, hreflang, Open Graph): NEXT_PUBLIC_SITE_URL if set,
   * else the production domain Vercel provides at build time, else local development.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** Locale-neutral description for the web app manifest; pages use the translated one. */
  description:
    "telc Deutsch B1 exam training · Prüfungstraining: exam timing, audio tasks, AI feedback on writing and speaking, grammar and vocabulary.",
} as const;
