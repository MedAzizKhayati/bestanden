import type { Locale } from "@/i18n/config";
import { telcB1De } from "./telc-b1.de";
import type { ExamDefinition } from "./types";

type Grade = "A" | "B" | "C" | "D";

/**
 * Translation of an exam definition's explanatory (English) texts. Official German names and
 * task instructions stay untouched; English glosses (nameEn, instructionEn, labelEn) are simply
 * not shown in the German UI.
 */
export interface ExamTranslation {
  description: string;
  sections: Record<string, { description: string; timeNote?: string }>;
  /** Part id → description. */
  parts: Record<string, string>;
  writingRubric: { criteria: Record<string, { assesses: string[]; bands: Record<Grade, string> }>; notes: string[] };
  speakingRubric: { criteria: Record<string, { assesses: string[]; descriptors: Record<Grade, string> }> };
}

const TRANSLATIONS: Record<string, Partial<Record<Locale, ExamTranslation>>> = {
  "telc-b1": { de: telcB1De },
};

const cache = new Map<string, ExamDefinition>();

/** The exam definition with its explanations in `locale` (memoised, so the identity is stable). */
export function localizeExam(exam: ExamDefinition, locale: Locale): ExamDefinition {
  const tr = TRANSLATIONS[exam.id]?.[locale];
  if (!tr) return exam;
  const key = `${exam.id}:${locale}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const localized: ExamDefinition = {
    ...exam,
    description: tr.description,
    sections: exam.sections.map((s) => ({
      ...s,
      description: tr.sections[s.id]?.description ?? s.description,
      timeNote: s.timeNote ? (tr.sections[s.id]?.timeNote ?? s.timeNote) : undefined,
      parts: s.parts.map((p) => ({ ...p, description: tr.parts[p.id] ?? p.description })),
    })),
    writingRubric: {
      ...exam.writingRubric,
      notes: tr.writingRubric.notes,
      criteria: exam.writingRubric.criteria.map((c) => {
        const t = tr.writingRubric.criteria[c.id];
        return t ? { ...c, assesses: t.assesses, bands: c.bands.map((b) => ({ ...b, descriptor: t.bands[b.grade] })) } : c;
      }),
    },
    speakingRubric: {
      ...exam.speakingRubric,
      criteria: exam.speakingRubric.criteria.map((c) => {
        const t = tr.speakingRubric.criteria[c.id];
        return t ? { ...c, assesses: t.assesses, descriptors: t.descriptors } : c;
      }),
    },
  };
  cache.set(key, localized);
  return localized;
}
