import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { ZodType } from "zod";
import type { Locale } from "@/i18n/config";
import type { ExamDefinition, PartDefinition } from "@/lib/exams";
import { localize } from "./localize";
import {
  ExamSet,
  GrammarTopic,
  PhraseBank,
  PlacementTest,
  ReferenceList,
  StrategyFile,
  VocabTheme,
  type StrategyGuide,
} from "./schemas";

const CONTENT_DIR = join(process.cwd(), "content");

/*
 * Every getter takes an optional `locale`. Pass it whenever the result is rendered: for "de" the
 * German `…De` versions replace the English explanations, and for every locale the unused
 * language is stripped. Without a locale you get the raw files (ids, sitemap, static params).
 */
function inLocale<T>(value: T, locale: Locale | undefined): T {
  return locale ? localize(value, locale) : value;
}

function readJson<T>(path: string, schema: ZodType<T>): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(readFileSync(path, "utf8")));
    if (parsed.success) return parsed.data;
    console.warn(`[content] invalid ${path.replace(CONTENT_DIR, "content")}: ${parsed.error.issues[0]?.message}`);
  } catch (e) {
    console.warn(`[content] unreadable ${path}: ${(e as Error).message}`);
  }
  return null;
}

function readDir<T>(dir: string, schema: ZodType<T>): { file: string; value: T }[] {
  const full = join(CONTENT_DIR, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((file) => {
      const value = readJson(join(full, file), schema);
      return value ? [{ file: file.replace(/\.json$/, ""), value }] : [];
    });
}

/* ---------------- Exam practice sets ---------------- */

export interface SetSummary {
  id: string;
  number: string; // "03"
  title: string;
  topic: string;
  difficulty: 1 | 2 | 3;
}

const readSets = cache((examId: string, partId: string): { number: string; set: ExamSet }[] =>
  readDir(join(examId, partId), ExamSet)
    .filter(({ file, value }) => /^\d{2}$/.test(file) && value.id === `${partId}-${file}`)
    .map(({ file, value }) => ({ number: file, set: value })),
);

export const getSets = cache((examId: string, partId: string, locale?: Locale): { number: string; set: ExamSet }[] =>
  readSets(examId, partId).map(({ number, set }) => ({ number, set: inLocale(set, locale) })),
);

export function getSetSummaries(examId: string, partId: string): SetSummary[] {
  return getSets(examId, partId).map(({ number, set }) => ({
    id: set.id,
    number,
    title: set.title,
    topic: set.topic,
    difficulty: set.difficulty,
  }));
}

export function getSet(examId: string, partId: string, number: string, locale?: Locale) {
  return getSets(examId, partId, locale).find((s) => s.number === number)?.set;
}

/** Previous / next set numbers for navigation inside a part. */
export function getSetNeighbours(examId: string, partId: string, number: string) {
  const list = getSets(examId, partId).map((s) => s.number);
  const i = list.indexOf(number);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined, index: i, count: list.length };
}

export function countSets(exam: ExamDefinition, part: PartDefinition) {
  return getSets(exam.id, part.id).length;
}

/* ---------------- Strategies ---------------- */

const readStrategies = cache((examId: string): StrategyGuide[] => {
  const path = join(CONTENT_DIR, examId, "strategies.json");
  if (!existsSync(path)) return [];
  return readJson(path, StrategyFile)?.guides ?? [];
});

export function getStrategies(examId: string, locale?: Locale): StrategyGuide[] {
  return inLocale(readStrategies(examId), locale);
}

export function getStrategy(examId: string, partId: string, locale?: Locale) {
  return getStrategies(examId, locale).find((g) => g.partId === partId);
}

/* ---------------- Learning content ---------------- */

const readGrammarTopics = cache(() =>
  readDir("grammar", GrammarTopic)
    .map((x) => x.value)
    .sort((a, b) => a.order - b.order),
);

export function getGrammarTopics(locale?: Locale) {
  return inLocale(readGrammarTopics(), locale);
}

export function getGrammarTopic(id: string, locale?: Locale) {
  return getGrammarTopics(locale).find((t) => t.id === id);
}

const readVocabThemes = cache(() =>
  readDir("vocabulary", VocabTheme)
    .map((x) => x.value)
    .sort((a, b) => a.order - b.order),
);

export function getVocabThemes(locale?: Locale) {
  return inLocale(readVocabThemes(), locale);
}

export function getVocabTheme(id: string, locale?: Locale) {
  return getVocabThemes(locale).find((t) => t.id === id);
}

const readPhraseBanks = cache(() =>
  readDir("phrases", PhraseBank)
    .map((x) => x.value)
    .sort((a, b) => a.order - b.order),
);

export function getPhraseBanks(locale?: Locale) {
  return inLocale(readPhraseBanks(), locale);
}

const readReferenceLists = cache(() =>
  readDir("lists", ReferenceList)
    .map((x) => x.value)
    .sort((a, b) => a.order - b.order),
);

export function getReferenceLists(locale?: Locale) {
  return inLocale(readReferenceLists(), locale);
}

export function getReferenceList(id: string, locale?: Locale) {
  return getReferenceLists(locale).find((l) => l.id === id);
}

/* ---------------- Placement test ---------------- */

const readPlacementTest = cache((examId: string) => {
  const path = join(CONTENT_DIR, "placement", `${examId}.json`);
  return existsSync(path) ? readJson(path, PlacementTest) : null;
});

export function getPlacementTest(examId: string, locale?: Locale) {
  const test = readPlacementTest(examId);
  return test ? inLocale(test, locale) : null;
}
