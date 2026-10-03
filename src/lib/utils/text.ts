/** Map typographic variants to a canonical character for fuzzy quote matching. */
function canon(ch: string): string {
  if ("„“”\"«»".includes(ch)) return '"';
  if ("‚‘’'`´".includes(ch)) return "'";
  if ("–—‑".includes(ch)) return "-";
  return ch.toLowerCase();
}

/**
 * Find `quote` inside `text`, ignoring case, whitespace runs and quote styles.
 * Returns [start, end) offsets into the ORIGINAL text, or null.
 */
export function findQuote(text: string, quote: string): [number, number] | null {
  const norm: string[] = [];
  const map: number[] = [];
  let lastWasSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue;
      norm.push(" ");
      map.push(i);
      lastWasSpace = true;
    } else {
      norm.push(canon(ch));
      map.push(i);
      lastWasSpace = false;
    }
  }
  const needle = quote
    .trim()
    .replace(/\s+/g, " ")
    .split("")
    .map((c) => (c === " " ? " " : canon(c)))
    .join("");
  if (!needle) return null;
  const idx = norm.join("").indexOf(needle);
  if (idx < 0) return null;
  return [map[idx], map[idx + needle.length - 1] + 1];
}

export interface Segment {
  text: string;
  mark?: string; // id of the highlight (e.g. item number)
}

/** Split `text` into plain and highlighted segments. Overlapping quotes keep the first one. */
export function highlight(text: string, quotes: { id: string; quote: string }[]): Segment[] {
  const ranges = quotes
    .map((q) => {
      const r = findQuote(text, q.quote);
      return r ? { start: r[0], end: r[1], id: q.id } : null;
    })
    .filter((r): r is { start: number; end: number; id: string } => r !== null)
    .sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start) });
    segments.push({ text: text.slice(r.start, r.end), mark: r.id });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

const GAP = /\[\[(\d+)\]\]/g;

export type GapPiece = { kind: "text"; text: string } | { kind: "gap"; n: number };

/** "Hallo [[1]] Welt" → [{text "Hallo "}, {gap 1}, {text " Welt"}] */
export function splitGaps(text: string): GapPiece[] {
  const pieces: GapPiece[] = [];
  let last = 0;
  for (const m of text.matchAll(GAP)) {
    if (m.index! > last) pieces.push({ kind: "text", text: text.slice(last, m.index) });
    pieces.push({ kind: "gap", n: Number(m[1]) });
    last = m.index! + m[0].length;
  }
  if (last < text.length) pieces.push({ kind: "text", text: text.slice(last) });
  return pieces;
}

/**
 * The sentence that contains gap `n`, with that gap shown as "___" and all other gaps filled in.
 * Used for mistake review cards.
 */
export function gapSentence(text: string, n: number, fill: (gap: number) => string): string {
  const marker = `[[${n}]]`;
  const at = text.indexOf(marker);
  if (at < 0) return "";
  const boundary = /[.!?]\s|\n/g;
  let start = 0;
  let end = text.length;
  for (const m of text.matchAll(boundary)) {
    const pos = m.index! + m[0].length;
    if (pos <= at) start = pos;
    else if (m.index! >= at + marker.length) {
      end = m.index! + 1;
      break;
    }
  }
  return text
    .slice(start, end)
    .replace(GAP, (_, g) => (Number(g) === n ? "___" : fill(Number(g))))
    .trim();
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Lenient comparison for typed answers: case, spacing, punctuation and umlaut transliterations. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[„“”"‚‘’'.,!?;:()]/g, "")
    .replace(/\s+/g, " ");
}

export function answerMatches(given: string, accepted: string[]): boolean {
  const g = normalizeAnswer(given);
  return g.length > 0 && accepted.some((a) => normalizeAnswer(a) === g);
}

/** Deterministic pseudo-random shuffle (stable between server and client renders). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    const j = (h >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
