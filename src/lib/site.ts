export const site = {
  name: "Bestanden",
  /** Public origin, used for absolute URLs (sitemap, hreflang, Open Graph). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Locale-neutral description for the web app manifest; pages use the translated one. */
  description:
    "telc Deutsch B1 exam training · Prüfungstraining: exam timing, audio tasks, AI feedback on writing and speaking, grammar and vocabulary.",
} as const;
