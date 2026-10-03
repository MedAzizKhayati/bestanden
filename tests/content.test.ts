import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { localize } from "@/lib/content/localize";
import { checkTranslations } from "@/lib/content/translations";

describe("content files", () => {
  test("every file validates, including all German translations", () => {
    const run = Bun.spawnSync(["bun", "scripts/validate-content.ts", "--i18n=de"], { stdout: "pipe", stderr: "pipe" });
    const out = run.stdout.toString();
    expect(out).toMatch(/· 0 error\(s\)/);
    expect(run.exitCode).toBe(0);
  });
});

describe("localize", () => {
  const raw: Record<string, unknown> & { nested: Record<string, string>[] } = {
    explanation: "Because …",
    explanationDe: "Weil …",
    nested: [{ md: "Rule", mdDe: "Regel", keep: "same" }],
    onlyEnglish: "Fallback",
  };

  test("German swaps in …De fields and falls back to English", () => {
    expect(localize(raw, "de") as unknown).toEqual({ explanation: "Weil …", nested: [{ md: "Regel", keep: "same" }], onlyEnglish: "Fallback" });
  });

  test("English strips the German fields", () => {
    expect(localize(raw, "en") as unknown).toEqual({ explanation: "Because …", nested: [{ md: "Rule", keep: "same" }], onlyEnglish: "Fallback" });
  });

  test("results are memoised per object and locale", () => {
    expect(localize(raw.nested[0], "de")).toBe(localize(raw.nested[0], "de"));
    expect(localize(raw.nested[0], "de")).not.toBe(localize(raw.nested[0], "en"));
  });
});

describe("translation checks", () => {
  test("missing, mis-shaped and English-looking German fields are reported", () => {
    const issues = checkTranslations(
      "strategies",
      { title: "T", summary: "S", summaryDe: "This is the summary", traps: ["a", "b"], trapsDe: ["a"] },
      true,
    ).map((i) => i.message);
    expect(issues.some((m) => m.startsWith("titleDe: missing"))).toBe(true);
    expect(issues.some((m) => m.startsWith("summaryDe: looks English"))).toBe(true);
    expect(issues.some((m) => m.startsWith("trapsDe: must have 2 entries"))).toBe(true);
  });

  test("German examples in quotes, bold or italics don't count as English", () => {
    const issues = checkTranslations("grammar", { md: "x", mdDe: "Anders als im Englischen *proud of* sagt man **stolz auf** – „I like the flat.“" }, true);
    expect(issues).toEqual([]);
  });
});

test("German strategy texts really are German", () => {
  const file = JSON.parse(readFileSync("content/telc-b1/strategies.json", "utf8")) as { guides: { titleDe?: string }[] };
  expect(file.guides.every((g) => g.titleDe && !/\bthe\b/i.test(g.titleDe))).toBe(true);
});
