import type { ExamDefinition, PartDefinition, PlannedExam, SectionDefinition } from "./types";
import { telcB1 } from "./telc-b1";

export * from "./types";
export { localizeExam } from "./localize";

/** Exams with content. Adding a level = add a definition here + its /content folder. */
export const EXAMS: ExamDefinition[] = [telcB1];

export const PLANNED_EXAMS: PlannedExam[] = [
  { slug: "telc-b2", name: "telc Deutsch B2", level: "B2", status: "preparing" },
  { slug: "telc-c1", name: "telc Deutsch C1", level: "C1", status: "preparing" },
  { slug: "dtz", name: "Deutsch-Test für Zuwanderer", level: "B1", status: "planned" },
];

export const DEFAULT_EXAM = telcB1;

export function getExam(slug: string): ExamDefinition | undefined {
  return EXAMS.find((e) => e.slug === slug);
}

export function getSection(exam: ExamDefinition, sectionId: string): SectionDefinition | undefined {
  return exam.sections.find((s) => s.id === sectionId);
}

export function allParts(exam: ExamDefinition): PartDefinition[] {
  return exam.sections.flatMap((s) => s.parts);
}

export function getPart(exam: ExamDefinition, partId: string): PartDefinition | undefined {
  return allParts(exam).find((p) => p.id === partId);
}

export function getPartBySlug(
  exam: ExamDefinition,
  sectionId: string,
  partSlug: string,
): PartDefinition | undefined {
  return getSection(exam, sectionId)?.parts.find((p) => p.slug === partSlug);
}

/** URL of a part's overview page. Single-part sections (Schreiben) live at the section URL. */
export function partHref(exam: ExamDefinition, part: PartDefinition): string {
  const section = getSection(exam, part.sectionId)!;
  return section.parts.length === 1 ? `/${exam.slug}/${section.id}` : `/${exam.slug}/${section.id}/${part.slug}`;
}

/** URL of one practice set. `setNumber` is the two-digit suffix of the set id ("03"). */
export function setHref(exam: ExamDefinition, part: PartDefinition, setNumber: string): string {
  return `${partHref(exam, part)}/${setNumber}`;
}

export function gradeFor(exam: ExamDefinition, points: number) {
  return exam.grades.find((g) => points >= g.min) ?? exam.grades[exam.grades.length - 1];
}
