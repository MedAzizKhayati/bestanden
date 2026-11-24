import "server-only";

import { getSets } from "@/lib/content/load";
import { getPart, type ExamDefinition } from "@/lib/exams";
import { MOCK_PARTS, WRITING_PART, mockCount, mockSetNumbers } from "./mock";

/** Set numbers per part that mock exams may use. Warm-up sets (difficulty 1) are left out: a mock should feel like the real exam. */
export function numbersByPart(exam: ExamDefinition): Record<string, string[]> {
  return Object.fromEntries(
    MOCK_PARTS.map((p) => [p, getSets(exam.id, p).filter((s) => s.set.difficulty > 1).map((s) => s.number)]),
  );
}

/** True if the exam lets candidates choose between two writing tasks (telc B2). */
export function writingChoice(exam: ExamDefinition): boolean {
  return !!getPart(exam, WRITING_PART)?.writing?.choice;
}

export function listMocks(exam: ExamDefinition) {
  const byPart = numbersByPart(exam);
  const choice = writingChoice(exam);
  const count = mockCount(byPart, choice);
  return Array.from({ length: count }, (_, i) => {
    const k = i + 1;
    const numbers = mockSetNumbers(byPart, k, choice)!;
    return { id: String(k).padStart(2, "0"), k, numbers };
  });
}
