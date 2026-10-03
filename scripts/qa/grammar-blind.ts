#!/usr/bin/env bun
/**
 * Blind-solve QA for grammar drills.
 *
 *   bun scripts/qa/grammar-blind.ts export <outDir> [topicId…]
 *   bun scripts/qa/grammar-blind.ts compare <answers.json> [topicId…]
 *
 * answers.json: { "<topicId>": { "<index>": "<answer>" } } where index is the 0-based
 * exercise index; mc answers are the option TEXT, all others the full typed answer.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GrammarTopic } from "../../src/lib/content/schemas";
import { answerMatches } from "../../src/lib/utils/text";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const [cmd, target, ...only] = process.argv.slice(2);
if (!cmd || !target) {
  console.error("usage: grammar-blind.ts export <outDir> | compare <answers.json> [topicId…]");
  process.exit(1);
}

const dir = join(ROOT, "content", "grammar");
const topics = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => GrammarTopic.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))))
  .filter((t) => !only.length || only.includes(t.id));

if (cmd === "export") {
  mkdirSync(target, { recursive: true });
  for (const t of topics) {
    const blind = {
      id: t.id,
      title: t.title,
      exercises: t.exercises.map((e, i) => {
        if (e.type === "mc") return { index: i, type: e.type, prompt: e.prompt, options: e.options };
        if (e.type === "gap") return { index: i, type: e.type, prompt: e.prompt, hint: e.hint };
        if (e.type === "order") return { index: i, type: e.type, words: [...e.words].sort(() => Math.random() - 0.5) };
        return { index: i, type: e.type, instruction: e.instruction, prompt: e.prompt };
      }),
    };
    writeFileSync(join(target, `${t.id}.json`), JSON.stringify(blind, null, 2));
  }
  console.log(`exported ${topics.length} topic(s) to ${target}`);
} else if (cmd === "compare") {
  const given = JSON.parse(readFileSync(target, "utf8")) as Record<string, Record<string, string>>;
  let total = 0;
  let wrong = 0;
  for (const t of topics) {
    const mine = given[t.id];
    if (!mine) continue;
    t.exercises.forEach((e, i) => {
      const g = mine[String(i)];
      if (g === undefined) return;
      total++;
      const ok = e.type === "mc" ? g.trim() === e.options[e.answer] : answerMatches(g, e.answers);
      if (!ok) {
        wrong++;
        const key = e.type === "mc" ? e.options[e.answer] : e.answers.join(" | ");
        console.log(`${t.id} #${i} (${e.type}): solver "${g}" vs key "${key}"`);
      }
    });
  }
  console.log(`\n${total - wrong}/${total} agree · ${wrong} disagreement(s)`);
}
