import { describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { PlacementTest } from "@/lib/content/schemas";
import { buildPlan } from "@/lib/plan/build-plan";
import { estimateLevel, itemsBySkill, scorePlacement, weakestSkills, type PlacementAnswers } from "@/lib/placement/score";
import { runLiveChecks } from "@/lib/writing/checks";

// The vocab store persists to localStorage; the scheduler itself is pure.
mock.module("zustand/middleware", () => ({ persist: (fn: unknown) => fn, createJSONStorage: () => undefined }));
const { schedule } = await import("@/lib/store/vocab");

describe("spaced repetition", () => {
  test("good answers grow the interval, a lapse resets it", () => {
    const now = 0;
    let card = schedule(undefined, 2, now);
    expect(card.interval).toBe(1);
    card = schedule(card, 2, now);
    expect(card.interval).toBe(3);
    card = schedule(card, 2, now);
    expect(card.interval).toBeCloseTo(7.5);
    const lapsed = schedule(card, 0, now);
    expect(lapsed.interval).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ease).toBeLessThan(card.ease);
  });
});

describe("placement level estimate", () => {
  const tally = (a2: [number, number], b1: [number, number], b2: [number, number]) => ({
    A2: { correct: a2[0], total: a2[1] },
    B1: { correct: b1[0], total: b1[1] },
    B2: { correct: b2[0], total: b2[1] },
  });
  test("levels follow the bands", () => {
    expect(estimateLevel(tally([1, 4], [0, 6], [0, 4]))).toBe("A1");
    expect(estimateLevel(tally([4, 4], [1, 6], [0, 4]))).toBe("A2");
    expect(estimateLevel(tally([4, 4], [3, 6], [0, 4]))).toBe("B1-");
    expect(estimateLevel(tally([4, 4], [5, 6], [0, 4]))).toBe("B1");
    expect(estimateLevel(tally([4, 4], [5, 6], [2, 4]))).toBe("B1+");
    expect(estimateLevel(tally([4, 4], [6, 6], [3, 4]))).toBe("B2");
  });

  test("a full test: perfect answers → B2 and ready; no answers → weakest everywhere", () => {
    let test: PlacementTest;
    try {
      test = JSON.parse(readFileSync("content/placement/telc-b1.json", "utf8"));
    } catch {
      return; // content not written yet
    }
    const perfect: PlacementAnswers = {};
    for (const items of Object.values(itemsBySkill(test)))
      for (const item of items) perfect[item.id] = item.type === "mc" ? item.answer : item.answer ? "r" : "f";
    const best = scorePlacement(test, perfect, 900, 1);
    expect(best.overall).toBe("B2");
    expect(best.readiness).toBe("ready");
    const worst = scorePlacement(test, {}, 60, 1);
    expect(worst.overall).toBe("A1");
    expect(worst.readiness).toBe("notYet");
    expect(worst.missedGrammar.length).toBeGreaterThan(0);
    expect(weakestSkills(worst)).toHaveLength(4);
  });
});

describe("live writing checks", () => {
  test("register mix-ups and missing parts are flagged, in both languages", () => {
    const text = "Hallo Anna,\nwie geht es Ihnen? Ich komme gern zu deiner Party.\nViele Grüße\nMax";
    for (const locale of ["en", "de"] as const) {
      const checks = runLiveChecks(text, "", "informal", locale);
      expect(checks.find((c) => c.id === "register")?.status).toBe("warn");
      expect(checks.find((c) => c.id === "subject")?.status).not.toBe("ok");
      expect(checks.find((c) => c.id === "salutation")?.status).toBe("ok");
    }
  });
});

describe("study plan", () => {
  test("ends with a final week and fills every week", () => {
    const weeks = buildPlan({
      today: new Date("2026-10-05"),
      examDate: new Date("2026-12-14"),
      dailyMinutes: 30,
      weakness: {},
      inventory: { grammar: [], vocab: [], parts: [], mocks: [] },
      locale: "de",
    });
    expect(weeks.length).toBeGreaterThanOrEqual(9);
    expect(weeks.at(-1)?.phase).toBe("Final week");
  });
});
