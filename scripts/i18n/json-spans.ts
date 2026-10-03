/**
 * Minimal JSON parser that keeps source offsets, so translations can be inserted
 * into content files without re-formatting them.
 */

export type JsonNode =
  | { kind: "object"; start: number; end: number; members: Map<string, { keyStart: number; node: JsonNode }> }
  | { kind: "array"; start: number; end: number; items: JsonNode[] }
  | { kind: "string"; start: number; end: number; value: string }
  | { kind: "literal"; start: number; end: number };

export function parseWithSpans(text: string): JsonNode {
  let i = 0;
  const literal = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/y;
  const ws = () => {
    while (i < text.length && (text[i] === " " || text[i] === "\n" || text[i] === "\r" || text[i] === "\t")) i++;
  };
  const fail = (what: string): never => {
    throw new Error(`JSON: expected ${what} at offset ${i}`);
  };
  const parseString = (): JsonNode & { kind: "string" } => {
    const start = i;
    if (text[i] !== '"') fail("string");
    i++;
    while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    i++;
    return { kind: "string", start, end: i, value: JSON.parse(text.slice(start, i)) as string };
  };
  const parseValue = (): JsonNode => {
    ws();
    const start = i;
    if (text[i] === "{") {
      i++;
      const members = new Map<string, { keyStart: number; node: JsonNode }>();
      ws();
      if (text[i] === "}") return { kind: "object", start, end: ++i, members };
      for (;;) {
        ws();
        const keyStart = i;
        const key = parseString().value;
        ws();
        if (text[i++] !== ":") fail("':'");
        members.set(key, { keyStart, node: parseValue() });
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "}") return { kind: "object", start, end: ++i, members };
        else fail("',' or '}'");
      }
    }
    if (text[i] === "[") {
      i++;
      const items: JsonNode[] = [];
      ws();
      if (text[i] === "]") return { kind: "array", start, end: ++i, items };
      for (;;) {
        items.push(parseValue());
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "]") return { kind: "array", start, end: ++i, items };
        else fail("',' or ']'");
      }
    }
    if (text[i] === '"') return parseString();
    literal.lastIndex = i;
    const m = literal.exec(text);
    if (!m) fail("value");
    i += m![0].length;
    return { kind: "literal", start, end: i };
  };
  const root = parseValue();
  ws();
  if (i !== text.length) fail("end of input");
  return root;
}

export type PathSegment = string | number;

/** "blocks[2].rows[1][0]" → ["blocks", 2, "rows", 1, 0] */
export function parsePath(path: string): PathSegment[] {
  return [...path.matchAll(/\[(\d+)\]|([^.[\]]+)/g)].map((m) => (m[1] !== undefined ? Number(m[1]) : m[2]));
}

export function formatPath(segments: PathSegment[]): string {
  return segments.map((s, i) => (typeof s === "number" ? `[${s}]` : i === 0 ? s : `.${s}`)).join("");
}

export function nodeAt(root: JsonNode, segments: PathSegment[]): JsonNode | undefined {
  let node: JsonNode | undefined = root;
  for (const s of segments) {
    if (!node) return undefined;
    if (typeof s === "number") node = node.kind === "array" ? node.items[s] : undefined;
    else node = node.kind === "object" ? node.members.get(s)?.node : undefined;
  }
  return node;
}
