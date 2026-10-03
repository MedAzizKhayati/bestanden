"use client";

import { useLocale } from "@/i18n/client";
import { DEFAULT_EXAM, getExam, localizeExam, type ExamDefinition } from "./index";

/** Client-side exam definition in the current UI language (defaults to the main exam). */
export function useExam(slug?: string): ExamDefinition {
  const locale = useLocale();
  return localizeExam((slug ? getExam(slug) : undefined) ?? DEFAULT_EXAM, locale);
}
