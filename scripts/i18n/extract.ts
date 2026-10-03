#!/usr/bin/env bun
/**
 * Collects the English explanation texts that have no German version yet into a worksheet.
 *
 *   bun scripts/i18n/extract.ts <worksheet.json> <content paths…>
 *
 * The worksheet maps "<file>#<path>" → English text. Replace every value with its German
 * translation (keep the keys) and write the result with scripts/i18n/apply.ts.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSLATED_FIELDS } from "../../src/lib/content/translations";
import { formatPath, type PathSegment } from "./json-spans";
import { OPTIONAL_FIELDS, kindOf, looksEnglish } from "./kinds";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = join(ROOT, "content");

const [out, ...paths] = process.argv.slice(2);
if (!out || !paths.length) {
  console.error("usage: bun scripts/i18n/extract.ts <worksheet.json> <content paths…>");
  process.exit(1);
}

function walk(path: string): string[] {
  if (!existsSync(path)) throw new Error(`not found: ${path}`);
  if (statSync(path).isFile()) return path.endsWith(".json") ? [path] : [];
  return readdirSync(path)
    .sort()
    .flatMap((f) => walk(join(path, f)));
}

const worksheet: Record<string, string> = {};
let fileCount = 0;

for (const file of [...new Set(paths.flatMap((p) => walk(resolve(ROOT, p))))].sort()) {
  const kind = kindOf(CONTENT, file);
  if (!kind) continue;
  const required = new Set(TRANSLATED_FIELDS[kind]);
  const optional = new Set(OPTIONAL_FIELDS[kind] ?? []);
  const id = relative(CONTENT, file).replace(/\.json$/, "");
  const before = Object.keys(worksheet).length;

  const leaves = (v: unknown, segs: PathSegment[], keep: (s: string) => boolean) => {
    if (typeof v === "string") {
      if (keep(v)) worksheet[`${id}#${formatPath(segs)}`] = v;
    } else if (Array.isArray(v)) v.forEach((x, i) => leaves(x, [...segs, i], keep));
  };
  /** Table headers: all or nothing. Table rows: whole columns, since a column is either English or German examples. */
  const optionalLeaves = (key: string, v: unknown, segs: PathSegment[]) => {
    if (key === "columns" && Array.isArray(v)) {
      if (v.some((c) => typeof c === "string" && looksEnglish(c))) leaves(v, segs, () => true);
    } else if (key === "rows" && Array.isArray(v)) {
      const rows = v as unknown[][];
      const english = new Set<number>();
      rows.forEach((row) => row.forEach((cell, c) => typeof cell === "string" && looksEnglish(cell) && english.add(c)));
      rows.forEach((row, r) => row.forEach((cell, c) => english.has(c) && leaves(cell, [...segs, r, c], () => true)));
    } else leaves(v, segs, looksEnglish);
  };
  const visit = (node: unknown, segs: PathSegment[]) => {
    if (Array.isArray(node)) return node.forEach((v, i) => visit(v, [...segs, i]));
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    for (const [key, v] of Object.entries(obj)) {
      if (/[a-z]De$/.test(key)) continue;
      const done = obj[`${key}De`] !== undefined;
      if (!done && required.has(key)) leaves(v, [...segs, key], () => true);
      else if (!done && optional.has(key)) optionalLeaves(key, v, [...segs, key]);
      if (v && typeof v === "object") visit(v, [...segs, key]);
    }
  };
  visit(JSON.parse(readFileSync(file, "utf8")), []);
  if (Object.keys(worksheet).length > before) fileCount++;
}

writeFileSync(resolve(out), `${JSON.stringify(worksheet, null, 2)}\n`);
const chars = Object.values(worksheet).reduce((s, v) => s + v.length, 0);
console.log(`${Object.keys(worksheet).length} text(s) from ${fileCount} file(s) · ${chars} characters → ${out}`);
