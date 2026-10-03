#!/usr/bin/env bun
/**
 * Blind-solve QA for exam sets.
 *
 *   bun scripts/qa/blind.ts export <partId> <outDir>    # writes sets WITHOUT answers/explanations
 *   bun scripts/qa/blind.ts compare <partId> <answers.json>
 *
 * answers.json: { "<setId>": { "<n>": "<answer>" } } — letters for matching/MC,
 * "r"/"f" for richtig/falsch. compare prints every disagreement with the key.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ExamSet } from "../../src/lib/content/schemas";
import { answerKey, isScoredSet } from "../../src/lib/exam/scoring";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const [cmd, partId, target] = process.argv.slice(2);
if (!cmd || !partId || !target) {
  console.error("usage: blind.ts export|compare <partId> <outDir|answers.json>");
  process.exit(1);
}

const dir = join(ROOT, "content", "telc-b1", partId);
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const sets = files.map((f) => ExamSet.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));

const STRIP = new Set(["answer", "explanation", "evidence", "distractors", "glossary", "why", "label"]);
function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).filter(([k]) => !STRIP.has(k)).map(([k, v]) => [k, strip(v)]));
  return value;
}

if (cmd === "export") {
  mkdirSync(target, { recursive: true });
  for (const s of sets) writeFileSync(join(target, `${s.id}.json`), JSON.stringify(strip(s), null, 2));
  console.log(`exported ${sets.length} blind set(s) to ${target}`);
} else if (cmd === "compare") {
  const given = JSON.parse(readFileSync(target, "utf8")) as Record<string, Record<string, string>>;
  let total = 0;
  let wrong = 0;
  for (const s of sets) {
    if (!isScoredSet(s)) continue;
    const key = answerKey(s);
    const mine = given[s.id] ?? {};
    for (const [n, correct] of Object.entries(key)) {
      total++;
      const g = (mine[n] ?? "").toString().trim().toLowerCase();
      if (g !== correct) {
        wrong++;
        console.log(`${s.id} item ${n}: solver "${g || "–"}" vs key "${correct}"`);
      }
    }
  }
  console.log(`\n${total - wrong}/${total} agree · ${wrong} disagreement(s)`);
} else {
  console.error(`unknown command ${cmd}`);
  process.exit(1);
}
