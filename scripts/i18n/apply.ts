#!/usr/bin/env bun
/**
 * Writes translated worksheets back into the content files as `…De` fields, right after their
 * English originals and in the file's existing formatting.
 *
 *   bun scripts/i18n/apply.ts <translations.json…>
 *
 * Each translations file maps "<file>#<path>" (keys from extract.ts) → German text.
 * Afterwards run `bun run content:validate --i18n=de <files>`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { nodeAt, parsePath, parseWithSpans, type JsonNode, type PathSegment } from "./json-spans";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = join(ROOT, "content");

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error("usage: bun scripts/i18n/apply.ts <translations.json…>");
  process.exit(1);
}

/** file id → base path ("texts[0].explanation", "guides[2].traps") → leaf path relative to base → German */
const byFile = new Map<string, Map<string, Map<string, string>>>();
let problems = 0;
const problem = (message: string) => {
  problems++;
  console.error(`✗ ${message}`);
};

for (const input of inputs) {
  const data = JSON.parse(readFileSync(resolve(input), "utf8")) as Record<string, unknown>;
  for (const [key, german] of Object.entries(data)) {
    const [fileId, path] = key.split("#");
    if (!fileId || !path) {
      problem(`${input}: malformed key "${key}"`);
      continue;
    }
    if (typeof german !== "string" || !german.trim()) {
      problem(`${key}: translation must be a non-empty string`);
      continue;
    }
    const segs = parsePath(path);
    let last = segs.length - 1;
    while (last >= 0 && typeof segs[last] === "number") last--;
    if (last < 0) {
      problem(`${key}: path has no field name`);
      continue;
    }
    const base = JSON.stringify(segs.slice(0, last + 1));
    const rel = JSON.stringify(segs.slice(last + 1));
    const files = byFile.get(fileId) ?? new Map<string, Map<string, string>>();
    const leaves = files.get(base) ?? new Map<string, string>();
    leaves.set(rel, german.trim());
    files.set(base, leaves);
    byFile.set(fileId, files);
  }
}

/** Same arrays/strings structure (lengths included) – then a German version can be patched in place. */
function sameShape(a: JsonNode, b: JsonNode): boolean {
  if (a.kind === "array" && b.kind === "array")
    return a.items.length === b.items.length && a.items.every((item, i) => sameShape(item, b.items[i]));
  return a.kind === b.kind;
}

function stripDe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripDe);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([k]) => !(/[a-z]De$/.test(k) && k.slice(0, -2) in value))
      .map(([k, v]) => [k, stripDe(v)]),
  );
}

let fieldCount = 0;
let fileCount = 0;

for (const [fileId, bases] of byFile) {
  const file = join(CONTENT, `${fileId}.json`);
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    problem(`${fileId}: content file not found`);
    continue;
  }
  const root = parseWithSpans(text);
  const edits: { start: number; end: number; insert: string }[] = [];
  let fileOk = true;

  for (const [baseJson, leaves] of bases) {
    const baseSegs = JSON.parse(baseJson) as PathSegment[];
    const key = baseSegs[baseSegs.length - 1] as string;
    const parent = nodeAt(root, baseSegs.slice(0, -1));
    const member = parent?.kind === "object" ? parent.members.get(key) : undefined;
    if (!parent || parent.kind !== "object" || !member) {
      problem(`${fileId}#${baseSegs.join(".")}: no such field`);
      fileOk = false;
      continue;
    }
    const baseNode = member.node;
    const existing = parent.members.get(`${key}De`);

    // Template: an existing German version with the same shape (so a partial update keeps the
    // entries already translated), otherwise the English original. Swap in the translated strings.
    const template = existing && sameShape(existing.node, baseNode) ? existing.node : baseNode;
    const replacements: { start: number; end: number; text: string }[] = [];
    for (const [relJson, german] of leaves) {
      const leaf: JsonNode | undefined = nodeAt(template, JSON.parse(relJson) as PathSegment[]);
      if (!leaf || leaf.kind !== "string") {
        problem(`${fileId}#${baseSegs.join(".")}${relJson}: not a text field`);
        fileOk = false;
        continue;
      }
      replacements.push({ start: leaf.start - template.start, end: leaf.end - template.start, text: JSON.stringify(german) });
    }
    let deText = text.slice(template.start, template.end);
    for (const r of replacements.sort((a, b) => b.start - a.start)) deText = deText.slice(0, r.start) + r.text + deText.slice(r.end);

    if (existing) {
      edits.push({ start: existing.node.start, end: existing.node.end, insert: deText });
    } else {
      const lineStart = text.lastIndexOf("\n", member.keyStart) + 1;
      const indent = text.slice(lineStart, member.keyStart);
      const inline = /\S/.test(indent) || !text.slice(parent.start, parent.end).includes("\n");
      edits.push({
        start: baseNode.end,
        end: baseNode.end,
        insert: inline ? `, "${key}De": ${deText}` : `,\n${indent}"${key}De": ${deText}`,
      });
    }
    fieldCount++;
  }
  if (!fileOk) continue;

  let next = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) next = next.slice(0, e.start) + e.insert + next.slice(e.end);
  let parsed: unknown;
  try {
    parsed = JSON.parse(next);
  } catch (e) {
    problem(`${fileId}: result is not valid JSON (${(e as Error).message}) – file left unchanged`);
    continue;
  }
  if (!isDeepStrictEqual(stripDe(parsed), stripDe(JSON.parse(text)))) {
    problem(`${fileId}: original content would change – file left unchanged`);
    continue;
  }
  if (next !== text) {
    writeFileSync(file, next);
    fileCount++;
  }
}

console.log(`${fieldCount} German field(s) written to ${fileCount} file(s)${problems ? ` · ${problems} problem(s)` : " ✓"}`);
if (problems) process.exitCode = 1;
