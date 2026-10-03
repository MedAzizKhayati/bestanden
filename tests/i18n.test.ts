import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { DEFAULT_LOCALE, localizeHref, stripLocale, switchLocalePath } from "@/i18n/config";
import { de } from "@/i18n/messages/de";
import { en } from "@/i18n/messages/en";
import { preferredLocale } from "@/proxy";

type Tree = Record<string, unknown>;

/** Every key in `a` exists in `b` with the same kind of value (string / function / array / object). */
function shapeDiff(a: unknown, b: unknown, path = ""): string[] {
  const kind = (v: unknown) => (Array.isArray(v) ? "array" : typeof v);
  if (kind(a) !== kind(b)) return [`${path || "(root)"}: ${kind(a)} vs ${kind(b)}`];
  if (typeof a !== "object" || a === null) return [];
  if (Array.isArray(a)) {
    const arr = b as unknown[];
    if (a.length !== arr.length) return [`${path}: ${a.length} vs ${arr.length} entries`];
    return a.flatMap((v, i) => shapeDiff(v, arr[i], `${path}[${i}]`));
  }
  const keys = new Set([...Object.keys(a as Tree), ...Object.keys(b as Tree)]);
  return [...keys].flatMap((k) => shapeDiff((a as Tree)[k], (b as Tree)[k], path ? `${path}.${k}` : k));
}

describe("messages", () => {
  test("German has exactly the English keys, value kinds and list lengths", () => {
    expect(shapeDiff(en, de)).toEqual([]);
  });

  test("every message function works in both languages", () => {
    const visit = (a: unknown, b: unknown, path: string): void => {
      if (typeof a === "function") {
        const args = Array.from({ length: a.length }, (_, i) => (i % 2 ? 2 : 1));
        const ra = (a as (...x: unknown[]) => unknown)(...args);
        const rb = (b as (...x: unknown[]) => unknown)(...args);
        expect(typeof ra, path).toBe("string");
        expect(typeof rb, path).toBe("string");
        expect((rb as string).length, path).toBeGreaterThan(0);
      } else if (a && typeof a === "object") for (const k of Object.keys(a)) visit((a as Tree)[k], (b as Tree)[k], `${path}.${k}`);
    };
    visit(en, de, "");
  });

  test("German texts use typographic quotes and no English leftovers in common UI words", () => {
    const strings: string[] = [];
    const collect = (v: unknown) => {
      if (typeof v === "string") strings.push(v);
      else if (v && typeof v === "object") Object.values(v).forEach(collect);
    };
    collect(de);
    expect(strings.filter((s) => s.includes('"'))).toEqual([]);
    expect(strings.filter((s) => /(?<!\p{L})(the|and|your|please)(?!\p{L})/iu.test(s))).toEqual([]);
  });
});

describe("locale URLs", () => {
  test("localizeHref prefixes internal paths only", () => {
    expect(localizeHref("de", "/")).toBe("/de");
    expect(localizeHref("de", "/grammatik/passiv")).toBe("/de/grammatik/passiv");
    expect(localizeHref("en", "/?x=1")).toBe("/en?x=1");
    expect(localizeHref("de", "/en/grammatik")).toBe("/en/grammatik");
    expect(localizeHref("de", "/api/ai/status")).toBe("/api/ai/status");
    expect(localizeHref("de", "https://telc.net")).toBe("https://telc.net");
    expect(localizeHref("de", "#ueben")).toBe("#ueben");
  });

  test("switchLocalePath and stripLocale", () => {
    expect(switchLocalePath("/de/telc-b1/lesen", "en")).toBe("/en/telc-b1/lesen");
    expect(switchLocalePath("/", "de")).toBe("/de");
    expect(stripLocale("/de/grammatik")).toBe("/grammatik");
    expect(stripLocale("/en")).toBe("/");
  });

  test("the proxy prefers the saved choice, then Accept-Language, then English", () => {
    const req = (headers: Record<string, string>) => new NextRequest("http://localhost/", { headers });
    expect(preferredLocale(req({ cookie: "NEXT_LOCALE=de", "accept-language": "en-US" }))).toBe("de");
    expect(preferredLocale(req({ "accept-language": "fr-FR,de;q=0.8,en;q=0.5" }))).toBe("de");
    expect(preferredLocale(req({ "accept-language": "es-ES,es;q=0.9" }))).toBe(DEFAULT_LOCALE);
  });
});
