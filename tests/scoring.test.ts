import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import type { ExamSet } from "@/lib/content/schemas";
import { answerKey, isScoredSet, mistakeCard, officialNumber, scoreSet, verdict } from "@/lib/exam/scoring";
import { allParts, gradeFor, telcB1Exam } from "./helpers";

const exam = telcB1Exam();

describe("scoring every practice set", () => {
  for (const part of allParts(exam).filter((p) => p.items > 0)) {
    const dir = `content/telc-b1/${part.id}`;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const set = JSON.parse(readFileSync(`${dir}/${file}`, "utf8")) as ExamSet;
      test(`${part.id}/${file}: full marks for the key, zero for no answers`, () => {
        expect(isScoredSet(set)).toBe(true);
        if (!isScoredSet(set)) return;
        const key = answerKey(set);
        expect(Object.keys(key).length).toBe(part.items);
        const full = scoreSet(set, part, key);
        expect(full.points).toBe(part.maxPoints);
        expect(full.percent).toBe(100);
        const none = scoreSet(set, part, {});
        expect(none.points).toBe(0);
        // Every wrong answer produces a review card with the right solution, in both languages.
        const n = Number(Object.keys(key)[0]);
        for (const locale of ["en", "de"] as const) {
          const card = mistakeCard(set, part, n, null, locale);
          expect(card.correct).toBe(key[n]);
          expect(card.correctText.length).toBeGreaterThan(0);
        }
      });
    }
  }
});

describe("exam facts", () => {
  test("official numbering and pass grades", () => {
    const sb1 = allParts(exam).find((p) => p.id === "sprachbausteine-1")!;
    expect(officialNumber(sb1, 3)).toBe(23);
    expect(gradeFor(exam, 270).label).toBe("sehr gut");
    expect(gradeFor(exam, 180).label).toBe("ausreichend");
    expect(gradeFor(exam, 179).label).toBe("nicht bestanden");
    expect(exam.written.passPoints / exam.written.maxPoints).toBe(0.6);
  });

  test("verdicts relative to the 60 % pass mark", () => {
    expect(verdict(85, "en").tone).toBe("success");
    expect(verdict(60, "de").label).toBe("Bestanden-Niveau");
    expect(verdict(50, "en").tone).toBe("warning");
    expect(verdict(20, "en").tone).toBe("destructive");
  });
});
