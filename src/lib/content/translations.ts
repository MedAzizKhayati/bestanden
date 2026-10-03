import type { Issue } from "./checks";

export type ContentKind = "set" | "strategies" | "grammar" | "vocab" | "phrases" | "list" | "placement";

/**
 * English fields that need a German `…De` version, per content kind. Field names repeat
 * across a file (e.g. every exercise has an `explanation`), so one entry covers all of them.
 * Optional extras (`columnsDe`, `rowsDe`, `hintDe`) are only checked when present.
 */
export const TRANSLATED_FIELDS: Record<ContentKind, string[]> = {
  set: ["explanation", "why", "modelNotes"],
  strategies: ["title", "summary", "whatIsTested", "detail", "traps", "timeAdvice", "checklist"],
  grammar: ["summary", "md", "heading", "note", "why", "explanation", "instruction"],
  vocab: ["description"],
  phrases: ["description", "note"],
  list: ["description", "meaning", "wordOrder"],
  placement: ["explanation"],
};

/** Words that only occur in English – a German translation should contain none (outside quotes). */
const ENGLISH =
  /(?<!\p{L})(the|and|you|your|with|which|this|that|these|those|is|are|was not|of|for|when|where|why|how|what|it's|don't|doesn't|isn't|can't|english|meaning|spoken|mostly|afterwards|during|since|nevertheless|although|because|should|would|could|their|they|there)(?!\p{L})/giu;

function stripMarkup(text: string) {
  // Quoted/bold German examples may legitimately contain anything; only judge the prose.
  // *italics* mark deliberate English contrasts ("im Englischen *proud of*").
  return text.replace(/\*\*[^*]*\*\*|\*[^*\n]+\*|`[^`]*`|„[^“]*“|"[^"]*"/g, " ");
}

/**
 * Checks the German versions inside one content file.
 * - Always: present translations have the right shape and no straight quotes.
 * - With `requireComplete`: every field listed in TRANSLATED_FIELDS has its `…De` version.
 */
export function checkTranslations(kind: ContentKind, value: unknown, requireComplete: boolean): Issue[] {
  const required = new Set(TRANSLATED_FIELDS[kind]);
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const at = (key: string) => (path ? `${path}.${key}` : key);

    for (const [key, v] of Object.entries(obj)) {
      if (key.endsWith("De") && key.length > 2 && key.slice(0, -2) in obj) {
        const base = obj[key.slice(0, -2)];
        checkShape(base, v, at(key));
        continue;
      }
      if (requireComplete && required.has(key) && v !== undefined && obj[`${key}De`] === undefined)
        err(`${at(`${key}De`)}: missing German translation`);
      if (v && typeof v === "object") walk(v, at(key));
    }
  };

  const checkShape = (base: unknown, de: unknown, path: string) => {
    if (Array.isArray(base)) {
      if (!Array.isArray(de) || de.length !== base.length) return err(`${path}: must have ${base.length} entries, like the original`);
      base.forEach((b, i) => checkShape(b, de[i], `${path}[${i}]`));
      return;
    }
    if (typeof base === "string") {
      if (typeof de !== "string" || !de.trim()) return err(`${path}: must be a non-empty string`);
      if (de.includes('"')) warn(`${path}: contains straight double quotes – use German „…“`);
      // Identical texts are fine (German examples are copied unchanged); English words are not.
      const english = stripMarkup(de).match(ENGLISH) ?? [];
      if (english.length) warn(`${path}: looks English (${[...new Set(english.map((w) => w.toLowerCase()))].join(", ")})`);
    }
  };

  walk(value, "");
  return issues;
}
