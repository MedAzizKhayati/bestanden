import type { Locale } from "@/i18n/config";

/** `explanationDe` is the German version of `explanation`, `trapsDe` of `traps`, … */
const VARIANT = /^[a-z][A-Za-z0-9]*De$/;

const caches: Record<Locale, WeakMap<object, unknown>> = { de: new WeakMap(), en: new WeakMap() };

/**
 * Returns content for one UI language: for "de" every `fooDe` replaces `foo` (falling back to the
 * English original where no translation exists); for every locale the `…De` fields are dropped so
 * pages only ship one language. Results are memoised per object, so identities stay stable.
 */
export function localize<T>(value: T, locale: Locale): T {
  return transform(value, locale) as T;
}

function transform(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) return value.map((v) => transform(v, locale));
  if (value === null || typeof value !== "object") return value;
  const cache = caches[locale];
  const hit = cache.get(value);
  if (hit) return hit;
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(src)) {
    if (VARIANT.test(key) && key.slice(0, -2) in src) continue;
    const de = locale === "de" ? src[`${key}De`] : undefined;
    out[key] = transform(de !== undefined ? de : v, locale);
  }
  cache.set(value, out);
  return out;
}
