#!/usr/bin/env bun
/**
 * Validates every JSON file under /content (or only the paths given as arguments).
 *
 *   bun run content:validate                      # everything
 *   bun run content:validate content/telc-b1/lesen-1
 *   bun run content:validate content/grammar/passiv.json
 *   bun run content:validate --i18n=de            # also require every German translation
 *
 * Exit code 1 if any error is found. Warnings never fail the run.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodType } from "zod";
import {
  ExamSet,
  GrammarTopic,
  PhraseBank,
  PlacementTest,
  ReferenceList,
  StrategyFile,
  VocabTheme,
} from "../src/lib/content/schemas";
import { checkExamSet, checkGrammarTopic, checkPlacementTest, checkTypography, checkVocabTheme, type Issue } from "../src/lib/content/checks";
import { checkTranslations } from "../src/lib/content/translations";
import { EXAMS, allParts } from "../src/lib/exams";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = args.length ? args.map((a) => resolve(ROOT, a)) : [CONTENT];
/** --i18n=de: every English explanation field must have its German `…De` version. */
const requireGerman = flags.includes("--i18n=de");

function walk(path: string): string[] {
  if (!existsSync(path)) {
    console.error(`✗ path not found: ${relative(ROOT, path)}`);
    process.exitCode = 1;
    return [];
  }
  if (statSync(path).isFile()) return path.endsWith(".json") ? [path] : [];
  return readdirSync(path).flatMap((f) => walk(join(path, f)));
}

const files = [...new Set(targets.flatMap(walk))].sort();
const grammarIds = new Set(
  existsSync(join(CONTENT, "grammar"))
    ? readdirSync(join(CONTENT, "grammar"))
        .filter((f) => f.endsWith(".json"))
        .map((f) => basename(f, ".json"))
    : [],
);

let errorCount = 0;
let warningCount = 0;
const vocabIds = new Map<string, string>();

function report(file: string, issues: Issue[]) {
  if (!issues.length) return;
  console.log(`\n${relative(ROOT, file)}`);
  for (const i of issues) {
    if (i.level === "error") errorCount++;
    else warningCount++;
    console.log(`  ${i.level === "error" ? "✗" : "⚠"} ${i.message}`);
  }
}

function parseWith<T>(schema: ZodType<T>, data: unknown): { ok: true; value: T } | { ok: false; issues: Issue[] } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  return {
    ok: false,
    issues: r.error.issues.map((i) => ({ level: "error" as const, message: `${i.path.join(".") || "(root)"}: ${i.message}` })),
  };
}

for (const file of files) {
  const rel = relative(CONTENT, file);
  const segments = rel.split("/");
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    report(file, [{ level: "error", message: `invalid JSON: ${(e as Error).message}` }]);
    continue;
  }

  const issues: Issue[] = [];
  const [root] = segments;

  if (root === "grammar") {
    const r = parseWith(GrammarTopic, raw);
    if (!r.ok) issues.push(...r.issues);
    else {
      if (r.value.id !== basename(file, ".json")) issues.push({ level: "error", message: `id "${r.value.id}" must equal the file name` });
      issues.push(...checkGrammarTopic(r.value));
      issues.push(...checkTranslations("grammar", r.value, requireGerman));
      r.value.related.forEach((id) => {
        if (!grammarIds.has(id)) issues.push({ level: "warning", message: `related topic "${id}" does not exist (yet)` });
      });
    }
  } else if (root === "vocabulary") {
    const r = parseWith(VocabTheme, raw);
    if (!r.ok) issues.push(...r.issues);
    else {
      if (r.value.id !== basename(file, ".json")) issues.push({ level: "error", message: `id "${r.value.id}" must equal the file name` });
      issues.push(...checkVocabTheme(r.value));
      issues.push(...checkTranslations("vocab", r.value, requireGerman));
      for (const w of r.value.words) {
        const other = vocabIds.get(w.id);
        if (other) issues.push({ level: "error", message: `word id "${w.id}" also used in ${other}` });
        vocabIds.set(w.id, rel);
      }
    }
  } else if (root === "phrases") {
    const r = parseWith(PhraseBank, raw);
    if (!r.ok) issues.push(...r.issues);
    else {
      if (r.value.id !== basename(file, ".json")) issues.push({ level: "error", message: `id "${r.value.id}" must equal the file name` });
      issues.push(...checkTypography(r.value));
      issues.push(...checkTranslations("phrases", r.value, requireGerman));
    }
  } else if (root === "placement") {
    const r = parseWith(PlacementTest, raw);
    if (!r.ok) issues.push(...r.issues);
    else {
      if (r.value.examId !== basename(file, ".json")) issues.push({ level: "error", message: `examId "${r.value.examId}" must equal the file name` });
      issues.push(...checkPlacementTest(r.value, grammarIds));
      issues.push(...checkTranslations("placement", r.value, requireGerman));
    }
  } else if (root === "lists") {
    const r = parseWith(ReferenceList, raw);
    if (!r.ok) issues.push(...r.issues);
    else {
      if (r.value.id !== basename(file, ".json")) issues.push({ level: "error", message: `id "${r.value.id}" must equal the file name` });
      issues.push(...checkTypography(r.value));
      issues.push(...checkTranslations("list", r.value, requireGerman));
    }
  } else {
    const exam = EXAMS.find((e) => e.id === root);
    if (!exam) {
      issues.push({ level: "error", message: `unknown content folder "${root}"` });
    } else if (segments.length === 2 && segments[1] === "strategies.json") {
      const r = parseWith(StrategyFile, raw);
      if (!r.ok) issues.push(...r.issues);
      else {
        const valid = new Set(["allgemein", ...allParts(exam).map((p) => p.id)]);
        const ids = r.value.guides.map((g) => g.partId);
        ids.forEach((id) => valid.has(id) || issues.push({ level: "error", message: `unknown partId "${id}"` }));
        if (new Set(ids).size !== ids.length) issues.push({ level: "error", message: "duplicate partId" });
        [...valid].filter((id) => !ids.includes(id)).forEach((id) => issues.push({ level: "warning", message: `no guide for "${id}"` }));
        issues.push(...checkTypography(r.value));
        issues.push(...checkTranslations("strategies", r.value, requireGerman));
      }
    } else if (segments.length === 3) {
      const part = allParts(exam).find((p) => p.id === segments[1]);
      if (!part) issues.push({ level: "error", message: `unknown part folder "${segments[1]}"` });
      else {
        const r = parseWith(ExamSet, raw);
        if (!r.ok) issues.push(...r.issues);
        else {
          const set = r.value;
          const expectedId = `${part.id}-${basename(file, ".json")}`;
          if (!/^\d{2}$/.test(basename(file, ".json")))
            issues.push({ level: "error", message: "file name must be a two-digit set number, e.g. 03.json" });
          if (set.id !== expectedId) issues.push({ level: "error", message: `id must be "${expectedId}", found "${set.id}"` });
          if (set.examId !== exam.id) issues.push({ level: "error", message: `examId must be "${exam.id}"` });
          if (set.type !== part.setType)
            issues.push({ level: "error", message: `type must be "${part.setType}" for ${part.id}, found "${set.type}"` });
          issues.push(...checkExamSet(set, part.id));
          issues.push(...checkTranslations("set", set, requireGerman));
          if (set.type === "gap-mc" || set.type === "gap-wordbank")
            set.gaps.forEach((g) => {
              if (g.grammar && grammarIds.size && !grammarIds.has(g.grammar))
                issues.push({ level: "warning", message: `gaps[${g.n}].grammar "${g.grammar}" is not a known grammar topic` });
            });
        }
      }
    } else {
      issues.push({ level: "error", message: `unexpected location ${dirname(rel)}` });
    }
  }
  report(file, issues);
}

console.log(
  `\n${files.length} file(s) checked${requireGerman ? " (incl. German translations)" : ""} · ${errorCount} error(s) · ${warningCount} warning(s)${errorCount ? "" : " ✓"}`,
);
if (errorCount) process.exitCode = 1;
