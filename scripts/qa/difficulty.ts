#!/usr/bin/env bun
/**
 * Prints the text measures of every set in a part next to the telc targets.
 *
 *   bun scripts/qa/difficulty.ts lesen-2
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DIFFICULTY_TARGETS, difficultyIssues, measureText } from "../../src/lib/content/difficulty";
import { ExamSet } from "../../src/lib/content/schemas";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const partId = process.argv[2];
const targets = partId ? DIFFICULTY_TARGETS[partId] : undefined;
if (!targets) {
  console.error(`usage: difficulty.ts <${Object.keys(DIFFICULTY_TARGETS).join("|")}>`);
  process.exit(1);
}

const dir = join(ROOT, "content", "telc-b1", partId);
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const set = ExamSet.parse(JSON.parse(readFileSync(join(dir, f), "utf8")));
  const cells = targets.map((t) => {
    const m = measureText(t.text(set));
    return `${t.segment}: ${m.words} words · ${m.wordsPerSentence.toFixed(1)} w/s · ${m.longWords.toFixed(1)} % long · LIX ${m.lix.toFixed(1)}`;
  });
  const flag = difficultyIssues(set, partId).length ? "✗" : "✓";
  console.log(`${flag} ${set.id} (difficulty ${set.difficulty})  ${cells.join("  |  ")}`);
}
