export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, { native: string; short: string }> = {
  de: { native: "Deutsch", short: "DE" },
  en: { native: "English", short: "EN" },
};

/** BCP 47 tags for date/number formatting. */
export const LOCALE_TAGS: Record<Locale, string> = { de: "de-DE", en: "en-GB" };

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Prefix an internal path with the locale ("/grammatik" → "/de/grammatik"). */
export function localizeHref(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return href;
  const first = href.split(/[/?#]/)[1];
  if (isLocale(first)) return href;
  if (href === "/" || href.startsWith("/?") || href.startsWith("/#")) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

/** "/de/grammatik" → "/grammatik", "/en" → "/". */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (!isLocale(parts[1])) return pathname;
  return `/${parts.slice(2).join("/")}`;
}

/** Swap the locale segment of a pathname. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  if (pathname === "/" || !pathname) return `/${locale}`;
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || `/${locale}`;
}
