import type { ExamDefinition, PartDefinition } from "@/lib/exams";

/** Answer per item number: a letter, "x" (no ad fits) or "r" / "f" (richtig / falsch). */
export type SheetAnswers = Record<string, string>;

export interface SheetPart {
  part: PartDefinition;
  /** Official item numbers on the answer sheet, e.g. 21–30. */
  numbers: number[];
  options: string[];
}

const letters = (n: number) => "abcdefghijklmnopqrstuvwxyz".slice(0, n).split("");

const OPTIONS: Partial<Record<PartDefinition["setType"], string[]>> = {
  "headline-matching": letters(10),
  "text-mc": letters(3),
  "ad-matching": [...letters(12), "x"],
  "gap-mc": letters(3),
  "gap-wordbank": letters(15),
  "audio-short": ["r", "f"],
  "audio-long": ["r", "f"],
};

/** The official answer sheet (Antwortbogen) of an exam: every scored part with its numbers and options. */
export function answerSheet(exam: ExamDefinition): SheetPart[] {
  return exam.sections
    .flatMap((s) => s.parts)
    .filter((p) => p.items > 0 && OPTIONS[p.setType])
    .map((part) => ({
      part,
      numbers: Array.from({ length: part.items }, (_, i) => part.firstItem + i),
      options: OPTIONS[part.setType]!,
    }));
}

export interface SheetScore {
  parts: { partId: string; sectionId: string; correct: number; total: number; points: number; maxPoints: number }[];
  bySection: Record<string, { points: number; maxPoints: number }>;
  points: number;
  maxPoints: number;
}

/** Score an answer sheet against a key, with the official points per item. */
export function scoreSheet(exam: ExamDefinition, answers: SheetAnswers, key: SheetAnswers, sectionIds?: string[]): SheetScore {
  const parts = answerSheet(exam)
    .filter((sp) => !sectionIds || sectionIds.includes(sp.part.sectionId))
    .map(({ part, numbers }) => {
      const correct = numbers.filter((n) => key[n] !== undefined && answers[n] === key[n]).length;
      return { partId: part.id, sectionId: part.sectionId, correct, total: numbers.length, points: correct * part.pointsPerItem, maxPoints: part.maxPoints };
    });
  const bySection: SheetScore["bySection"] = {};
  for (const p of parts) {
    const s = (bySection[p.sectionId] ??= { points: 0, maxPoints: 0 });
    s.points += p.points;
    s.maxPoints += p.maxPoints;
  }
  return { parts, bySection, points: parts.reduce((n, p) => n + p.points, 0), maxPoints: parts.reduce((n, p) => n + p.maxPoints, 0) };
}

/** A key is usable when every item of the sheet has a valid value. */
export function completeKey(exam: ExamDefinition, key: SheetAnswers | undefined): key is SheetAnswers {
  if (!key) return false;
  return answerSheet(exam).every(({ numbers, options }) => numbers.every((n) => options.includes(key[n])));
}
