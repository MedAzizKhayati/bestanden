/** Parts of the written exam in the order they are taken. */
export const READING_PARTS = ["lesen-1", "lesen-2", "lesen-3", "sprachbausteine-1", "sprachbausteine-2"] as const;
export const LISTENING_PARTS = ["hoeren-1", "hoeren-2", "hoeren-3"] as const;
export const WRITING_PART = "schreiben";
/** Key of the second writing task (Aufgabe B) in a mock's set numbers, for exams with a choice of two tasks. */
export const WRITING_ALT = "schreiben-b";
export const MOCK_PARTS = [...READING_PARTS, ...LISTENING_PARTS, WRITING_PART] as const;

/** Minutes for the shared Lesen + Sprachbausteine block and for Schreiben. */
export const READING_MINUTES = 90;
export const WRITING_MINUTES = 30;

/** How many complete mock exams the content supports (`writingChoice`: every mock needs two writing tasks). */
export function mockCount(numbersByPart: Record<string, string[]>, writingChoice = false): number {
  return Math.min(
    ...MOCK_PARTS.map((p) => {
      const n = numbersByPart[p]?.length ?? 0;
      return p === WRITING_PART && writingChoice ? Math.floor(n / 2) : n;
    }),
  );
}

/**
 * Mock exam k (1-based) uses the k-th set from the END of every part, so practice
 * (which starts at set 01) and mock exams overlap as late as possible. With a choice of two
 * writing tasks, Aufgabe A and B are the (2k−1)-th and 2k-th tasks from the end (B under WRITING_ALT).
 */
export function mockSetNumbers(numbersByPart: Record<string, string[]>, k: number, writingChoice = false): Record<string, string> | null {
  if (k < 1 || k > mockCount(numbersByPart, writingChoice)) return null;
  const numbers: Record<string, string> = Object.fromEntries(
    MOCK_PARTS.map((p) => {
      const list = numbersByPart[p];
      return [p, list[list.length - (p === WRITING_PART && writingChoice ? 2 * k - 1 : k)]];
    }),
  );
  if (writingChoice) {
    const list = numbersByPart[WRITING_PART];
    numbers[WRITING_ALT] = list[list.length - 2 * k];
  }
  return numbers;
}
