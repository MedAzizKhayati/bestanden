import { relative } from "node:path";
import type { ContentKind } from "../../src/lib/content/translations";

/** Which content kind a file under /content is (mirrors the validator's folder rules). */
export function kindOf(contentDir: string, file: string): ContentKind | null {
  const [root, ...rest] = relative(contentDir, file).split("/");
  if (root === "grammar") return "grammar";
  if (root === "vocabulary") return "vocab";
  if (root === "phrases") return "phrases";
  if (root === "lists") return "list";
  if (root === "placement") return "placement";
  if (rest.length === 1 && rest[0] === "strategies.json") return "strategies";
  if (rest.length === 2) return "set";
  return null;
}

/**
 * Fields that only sometimes contain English (grammar tables, gap hints).
 * Only strings that look English are extracted; the rest are copied unchanged.
 */
export const OPTIONAL_FIELDS: Partial<Record<ContentKind, string[]>> = { grammar: ["columns", "rows", "hint"] };

const ENGLISH_HINTS =
  /(?<!\p{L})(the|and|or|of|for|with|without|after|before|when|if|use|used|case|ending|endings|meaning|example|examples|masculine|feminine|neuter|plural|singular|nominative|accusative|dative|genitive|present|past|future|infinitive|participle|noun|nouns|adjective|adverb|preposition|conjunction|question|answer|subject|object|position|tense|place|reason|purpose|condition|result|contrast|pronoun|article|definite|indefinite|negation|sentence|clause|main|subordinate|word|words|order|rule|translation|type|typical|regular|irregular|mixed|separable|inseparable|prefix|stem|verbs|changed|change|movement|state|most|all|no|only|time|which|what|who|how|where|why|e\.g\.|i\.e\.|person|people|thing|things|formal|informal|polite|direction|location|wish|advice|request|instead|same|other|not|is|are|you|we|they|he|she|it|my|your|his|her|our|their|in front|between|auxiliary|modal|reflexive|conjugated|conjugation|pattern|patterns|structure|usage|note|tip|tips|group|level|both|either|neither|also|then|than|more|less|very|often|always|never|sometimes|ending in|verb type|questions|answers)(?!\p{L})/iu;

export function looksEnglish(text: string) {
  // Ignore German examples marked up in the cell.
  const prose = text.replace(/\*\*[^*]*\*\*|`[^`]*`|„[^“]*“/g, " ");
  return ENGLISH_HINTS.test(prose);
}
