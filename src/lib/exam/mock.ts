/** Parts of the written exam in the order they are taken. */
export const READING_PARTS = ["lesen-1", "lesen-2", "lesen-3", "sprachbausteine-1", "sprachbausteine-2"] as const;
export const LISTENING_PARTS = ["hoeren-1", "hoeren-2", "hoeren-3"] as const;
export const WRITING_PART = "schreiben";
export const MOCK_PARTS = [...READING_PARTS, ...LISTENING_PARTS, WRITING_PART] as const;

/** Minutes for the shared Lesen + Sprachbausteine block and for Schreiben. */
export const READING_MINUTES = 90;
export const WRITING_MINUTES = 30;

/** How many complete mock exams the content supports. */
export function mockCount(numbersByPart: Record<string, string[]>): number {
  return Math.min(...MOCK_PARTS.map((p) => numbersByPart[p]?.length ?? 0));
}

/**
 * Mock exam k (1-based) uses the k-th set from the END of every part, so practice
 * (which starts at set 01) and mock exams overlap as late as possible.
 */
export function mockSetNumbers(numbersByPart: Record<string, string[]>, k: number): Record<string, string> | null {
  if (k < 1 || k > mockCount(numbersByPart)) return null;
  return Object.fromEntries(
    MOCK_PARTS.map((p) => {
      const list = numbersByPart[p];
      return [p, list[list.length - k]];
    }),
  );
}
