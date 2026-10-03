import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale, type Locale } from "@/i18n/config";

/** Saved choice first, then the browser's language preferences, then English. */
export function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const ranked = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((x) => x.base && Number.isFinite(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((x) => x.base).find(isLocale) ?? DEFAULT_LOCALE;
}

/** Every page lives under /de or /en; unprefixed URLs (incl. old links) are redirected. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension (icon.svg, manifest, robots.txt, …).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
