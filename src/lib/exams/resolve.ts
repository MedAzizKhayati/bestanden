import "server-only";

import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { SectionId } from "@/lib/content/schemas";
import { EXAMS, getExam, getSection, localizeExam, type ExamDefinition } from "./index";

/** Sections whose sets are scored automatically and use the generic exercise route. */
export const AUTO_SECTIONS: SectionId[] = ["lesen", "sprachbausteine", "hoeren"];

/** The exam for a URL slug, with its explanations in `locale` – 404 if unknown. */
export function requireExam(slug: string, locale?: Locale): ExamDefinition {
  const exam = getExam(slug) ?? notFound();
  return locale ? localizeExam(exam, locale) : exam;
}

export function requirePart(exam: ExamDefinition, sectionId: string, partSlug: string) {
  const section = getSection(exam, sectionId);
  const part = section?.parts.find((p) => p.slug === partSlug);
  if (!section || !part) notFound();
  return { section, part };
}

export function examParams() {
  return EXAMS.map((e) => ({ exam: e.slug }));
}
