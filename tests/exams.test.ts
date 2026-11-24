import { describe, expect, test } from "bun:test";
import { mistakeId } from "@/lib/exam/scoring";
import { MOCK_PARTS, WRITING_ALT, WRITING_PART, mockCount, mockSetNumbers } from "@/lib/exam/mock";
import { EXAMS, allParts, getExam } from "@/lib/exams";
import { B2_BANDS, estimateLevel } from "@/lib/placement/score";

describe("every exam definition is consistent", () => {
  for (const exam of EXAMS) {
    test(`${exam.id}: points, numbering and rubrics add up`, () => {
      const written = exam.sections.filter((s) => s.id !== "sprechen");
      const oral = exam.sections.find((s) => s.id === "sprechen")!;
      expect(written.reduce((n, s) => n + s.maxPoints, 0)).toBe(exam.written.maxPoints);
      expect(oral.maxPoints).toBe(exam.oral.maxPoints);
      expect(exam.written.maxPoints + exam.oral.maxPoints).toBe(exam.totalPoints);
      expect(exam.written.passPoints / exam.written.maxPoints).toBe(0.6);
      expect(exam.oral.passPoints / exam.oral.maxPoints).toBe(0.6);
      for (const s of exam.sections) expect(s.parts.reduce((n, p) => n + p.maxPoints, 0)).toBe(s.maxPoints);
      // Items 1–60 on the answer sheet, without gaps.
      const scored = allParts(exam).filter((p) => p.items > 0);
      let next = 1;
      for (const p of scored) {
        expect(p.firstItem).toBe(next);
        expect(p.items * p.pointsPerItem).toBe(p.maxPoints);
        next += p.items;
      }
      expect(next - 1).toBe(60);
      // Writing: three criteria, A = 5 × 3 = 45.
      expect(exam.writingRubric.criteria.reduce((n, c) => n + c.bands[0].points, 0) * exam.writingRubric.multiplier).toBe(exam.writingRubric.maxPoints);
      // Speaking: the A grades of a part add up to its maximum.
      for (const p of oral.parts) {
        const table = exam.speakingRubric.points[p.id];
        expect(Object.values(table).reduce((n, grades) => n + grades.A, 0)).toBe(p.maxPoints);
      }
    });
  }

  test("telc B2 format: everything heard once, 25 points per speaking part, a choice of two writing tasks", () => {
    const b2 = getExam("telc-b2")!;
    const hoeren = b2.sections.find((s) => s.id === "hoeren")!;
    expect(hoeren.parts.every((p) => p.audio?.plays === 1)).toBe(true);
    expect(b2.sections.find((s) => s.id === "sprechen")!.parts.map((p) => p.maxPoints)).toEqual([25, 25, 25]);
    expect(b2.speakingRubric.points["sprechen-2"].aussprache).toEqual({ A: 4, B: 2, C: 1, D: 0 });
    const writing = allParts(b2).find((p) => p.id === "schreiben")!;
    expect(writing.writing).toEqual({ minWords: 150, cover: "three", choice: true });
    expect(b2.written.minutes).toBe(140);
  });
});

describe("mock exams with a choice of writing tasks", () => {
  const numbers = Object.fromEntries(MOCK_PARTS.map((p) => [p, ["01", "02", "03", "04", "05", "06"]]));
  test("two writing tasks per mock, from the end of the list", () => {
    expect(mockCount(numbers, true)).toBe(3);
    expect(mockCount(numbers, false)).toBe(6);
    const first = mockSetNumbers(numbers, 1, true)!;
    expect(first[WRITING_PART]).toBe("06");
    expect(first[WRITING_ALT]).toBe("05");
    expect(first["lesen-1"]).toBe("06");
    const third = mockSetNumbers(numbers, 3, true)!;
    expect([third[WRITING_PART], third[WRITING_ALT]]).toEqual(["02", "01"]);
    expect(mockSetNumbers(numbers, 4, true)).toBeNull();
  });
});

describe("ids shared by B1 and B2 sets", () => {
  test("mistake cards keep B1 ids and prefix other exams", () => {
    expect(mistakeId("telc-b1", "lesen-1-01", 3)).toBe("lesen-1-01:3");
    expect(mistakeId("telc-b2", "lesen-1-01", 3)).toBe("telc-b2:lesen-1-01:3");
  });
});

describe("B2 level check bands", () => {
  const tally = (b1: [number, number], b2: [number, number], c1: [number, number]) => ({
    A2: { correct: 0, total: 0 },
    B1: { correct: b1[0], total: b1[1] },
    B2: { correct: b2[0], total: b2[1] },
    C1: { correct: c1[0], total: c1[1] },
  });
  test("B1 / B2 / C1 items map to the B2 scale", () => {
    expect(estimateLevel(tally([1, 4], [0, 6], [0, 4]), B2_BANDS)).toBe("A2");
    expect(estimateLevel(tally([4, 4], [1, 6], [0, 4]), B2_BANDS)).toBe("B1");
    expect(estimateLevel(tally([4, 4], [3, 6], [0, 4]), B2_BANDS)).toBe("B2-");
    expect(estimateLevel(tally([4, 4], [5, 6], [0, 4]), B2_BANDS)).toBe("B2");
    expect(estimateLevel(tally([4, 4], [5, 6], [2, 4]), B2_BANDS)).toBe("B2+");
    expect(estimateLevel(tally([4, 4], [6, 6], [3, 4]), B2_BANDS)).toBe("C1");
  });
});
