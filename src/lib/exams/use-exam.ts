"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { useHydrated } from "@/lib/store/hydration";
import { useSettings } from "@/lib/store/settings";
import { DEFAULT_EXAM, getExam, localizeExam, type ExamDefinition } from "./index";

/** The exam slug in a pathname ("/de/telc-b2/lesen" → "telc-b2"), if the page belongs to an exam. */
export function examSlugInPath(pathname: string): string | undefined {
  const first = stripLocale(pathname).split("/")[1];
  return first && getExam(first) ? first : undefined;
}

/**
 * The exam the learner is working on: the exam of the current page, otherwise the one chosen in the
 * settings (exam switcher, welcome flow), otherwise the default exam.
 */
export function useCurrentExamSlug(): string {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const chosen = useSettings((s) => s.examSlug);
  const fromPath = examSlugInPath(pathname ?? "/");
  if (fromPath) return fromPath;
  return hydrated && chosen && getExam(chosen) ? chosen : DEFAULT_EXAM.slug;
}

/** Client-side exam definition in the current UI language (`slug`, or the learner's current exam). */
export function useExam(slug?: string): ExamDefinition {
  const locale = useLocale();
  const current = useCurrentExamSlug();
  return localizeExam(getExam(slug ?? current) ?? DEFAULT_EXAM, locale);
}
