/**
 * Text measures that keep exam sets at telc level.
 *
 * The targets were measured on the passages (not instructions or answer options) of the two official
 * telc Deutsch B1 Übungstests, adult and youth Version 1. Only the resulting numbers are stored here.
 * Sets tagged difficulty 1 (warm-up) are exempt; difficulty 3 must reach the stricter `hard` values.
 */
import type { ExamSet } from "./schemas";

export interface TextMeasures {
  words: number;
  sentences: number;
  wordsPerSentence: number;
  /** Share of words longer than six letters, in percent. */
  longWords: number;
  /** Läsbarhetsindex: words per sentence + long-word share. Around 40 = standard press text, 50+ = demanding. */
  lix: number;
}

export function measureText(text: string): TextMeasures {
  const flat = text.replace(/\s+/g, " ").trim();
  const sentences = flat.split(/(?<=[.!?…])\s+/).filter((s) => /\p{L}{2,}/u.test(s)).length;
  const words = flat.match(/[A-Za-zÄÖÜäöüß]+/g) ?? [];
  const long = words.filter((w) => w.length > 6).length;
  const wordsPerSentence = words.length / Math.max(1, sentences);
  const longWords = words.length ? (long / words.length) * 100 : 0;
  return { words: words.length, sentences, wordsPerSentence, longWords, lix: wordsPerSentence + longWords };
}

type Measure = keyof Omit<TextMeasures, "sentences">;

interface Target {
  /** What is measured, e.g. "article". */
  segment: string;
  text: (set: ExamSet) => string;
  /** Minimum (and optional maximum) per measure for exam level; `hard` overrides minimums for difficulty 3. */
  min: Partial<Record<Measure, number>>;
  max?: Partial<Record<Measure, number>>;
  hard?: Partial<Record<Measure, number>>;
}

const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

export const DIFFICULTY_TARGETS: Record<string, Target[]> = {
  // telc: texts 12.6 words/sentence, LIX 41
  "lesen-1": [
    { segment: "texts", text: (s) => (s.type === "headline-matching" ? join(s.texts.map((t) => t.text)) : ""), min: { lix: 38, words: 330 } },
  ],
  // telc: article 17.9 words/sentence, 30.5 % long words, LIX 48; questions LIX 43
  "lesen-2": [
    {
      segment: "article",
      text: (s) => (s.type === "text-mc" ? join([s.article.lead, ...s.article.paragraphs]) : ""),
      min: { words: 320, wordsPerSentence: 15, longWords: 27, lix: 44 },
      max: { words: 520 },
      hard: { wordsPerSentence: 16.5, longWords: 29, lix: 47 },
    },
    {
      segment: "questions and options",
      text: (s) => (s.type === "text-mc" ? join(s.questions.flatMap((q) => [q.stem, ...q.options.map((o) => o.text)])) : ""),
      min: { lix: 38 },
      hard: { lix: 41 },
    },
  ],
  // telc: situations LIX 40, 30 % long words
  "lesen-3": [
    { segment: "situations", text: (s) => (s.type === "ad-matching" ? join(s.situations.map((x) => x.text)) : ""), min: { lix: 37, longWords: 27 } },
  ],
  // telc: letters of 125–130 words
  "sprachbausteine-1": [
    { segment: "letter", text: (s) => (s.type === "gap-mc" ? s.text.replace(/\[\[\d+\]\]/g, " ") : ""), min: { words: 120 }, max: { words: 220 } },
  ],
  // telc: letters of 150–245 words
  "sprachbausteine-2": [
    { segment: "letter", text: (s) => (s.type === "gap-wordbank" ? s.text.replace(/\[\[\d+\]\]/g, " ") : ""), min: { words: 170 }, max: { words: 250 } },
  ],
  // telc: five statements of about 80 words
  "hoeren-1": [
    { segment: "statements", text: (s) => (s.type === "audio-short" ? join(s.items.flatMap((i) => i.script.map((l) => l.t))) : ""), min: { words: 350 } },
  ],
  // telc: 430–715 words
  "hoeren-2": [
    { segment: "script", text: (s) => (s.type === "audio-long" ? join(s.script.map((l) => l.t)) : ""), min: { words: 430 }, max: { words: 750 } },
  ],
  // telc: five recordings of 60–75 words
  "hoeren-3": [
    { segment: "recordings", text: (s) => (s.type === "audio-short" ? join(s.items.flatMap((i) => i.script.map((l) => l.t))) : ""), min: { words: 300 } },
  ],
};

const LABEL: Record<Measure, string> = {
  words: "words",
  wordsPerSentence: "words per sentence",
  longWords: "% long words",
  lix: "LIX",
};

const round = (n: number) => Math.round(n * 10) / 10;

/** Messages for every measure where an exam-level set is easier (or longer) than the official tests. */
export function difficultyIssues(set: ExamSet, partId: string): string[] {
  if (set.difficulty === 1) return [];
  const issues: string[] = [];
  for (const target of DIFFICULTY_TARGETS[partId] ?? []) {
    const m = measureText(target.text(set));
    const min = set.difficulty === 3 ? { ...target.min, ...target.hard } : target.min;
    for (const [key, value] of Object.entries(min) as [Measure, number][])
      if (m[key] < value) issues.push(`${target.segment}: ${round(m[key])} ${LABEL[key]}, below telc level (${set.difficulty === 3 ? "hard set ≥" : "≥"} ${value})`);
    for (const [key, value] of Object.entries(target.max ?? {}) as [Measure, number][])
      if (m[key] > value) issues.push(`${target.segment}: ${round(m[key])} ${LABEL[key]}, above the official range (≤ ${value})`);
  }
  return issues;
}
