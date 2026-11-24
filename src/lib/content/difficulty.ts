/**
 * Text measures that keep exam sets at telc level.
 *
 * The targets were measured on the passages (not instructions or answer options) of the official
 * telc Übungstests (B1: adult and youth Version 1; B2: Übungstest 1, 2019). Only the resulting numbers are stored here.
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

const audioText = (s: ExamSet) =>
  s.type === "audio-short" ? join([...s.items.flatMap((i) => i.script.map((l) => l.t)), ...s.unscored.flatMap((u) => u.script.map((l) => l.t))]) : "";

/** Targets per exam and part. */
export const DIFFICULTY_TARGETS: Record<string, Record<string, Target[]>> = {
  "telc-b1": {
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
    "hoeren-1": [{ segment: "statements", text: audioText, min: { words: 350 } }],
    // telc: 430–715 words
    "hoeren-2": [
      { segment: "script", text: (s) => (s.type === "audio-long" ? join(s.script.map((l) => l.t)) : ""), min: { words: 430 }, max: { words: 750 } },
    ],
    // telc: five recordings of 60–75 words
    "hoeren-3": [{ segment: "recordings", text: audioText, min: { words: 300 } }],
  },
  /*
   * telc Deutsch B2 Übungstest 1 (2019): Lesen 1 texts ~1,000 words, 18 words/sentence, LIX 47 · Lesen 2 article 540 words,
   * 16 w/s, 35 % long words, LIX 51 · Lesen 3 situations LIX 47, info texts ~970 words, LIX 43 · Sprachbausteine 1 letter
   * ~250 words · Sprachbausteine 2 article ~290 words, LIX 53 · Hören 1 six news reports ~360 words · Hören 2 ~830 words ·
   * Hören 3 ~370 words.
   */
  "telc-b2": {
    "lesen-1": [
      {
        segment: "texts",
        text: (s) => (s.type === "headline-matching" ? join(s.texts.map((t) => t.text)) : ""),
        min: { words: 650, wordsPerSentence: 13, lix: 44 },
        max: { words: 1050 },
        hard: { wordsPerSentence: 15, lix: 46 },
      },
    ],
    "lesen-2": [
      {
        segment: "article",
        text: (s) => (s.type === "text-mc" ? join([s.article.lead, ...s.article.paragraphs]) : ""),
        min: { words: 450, wordsPerSentence: 15, longWords: 30, lix: 47 },
        max: { words: 680 },
        hard: { wordsPerSentence: 16, longWords: 33, lix: 50 },
      },
      {
        segment: "questions and options",
        text: (s) => (s.type === "text-mc" ? join(s.questions.flatMap((q) => [q.stem, ...q.options.map((o) => o.text)])) : ""),
        min: { lix: 42 },
        hard: { lix: 45 },
      },
    ],
    "lesen-3": [
      { segment: "situations", text: (s) => (s.type === "ad-matching" ? join(s.situations.map((x) => x.text)) : ""), min: { lix: 42, longWords: 30 } },
      {
        segment: "info texts",
        text: (s) => (s.type === "ad-matching" ? join(s.ads.flatMap((a) => [a.heading, a.subheading, a.text, ...a.lines])) : ""),
        min: { words: 750, lix: 40 },
        max: { words: 1300 },
      },
    ],
    "sprachbausteine-1": [
      { segment: "letter", text: (s) => (s.type === "gap-mc" ? s.text.replace(/\[\[\d+\]\]/g, " ") : ""), min: { words: 200 }, max: { words: 320 } },
    ],
    "sprachbausteine-2": [
      {
        segment: "article",
        text: (s) => (s.type === "gap-wordbank" ? s.text.replace(/\[\[\d+\]\]/g, " ") : ""),
        min: { words: 240, lix: 44 },
        max: { words: 380 },
        hard: { lix: 47 },
      },
    ],
    "hoeren-1": [{ segment: "news reports", text: audioText, min: { words: 330 }, max: { words: 620 } }],
    "hoeren-2": [
      { segment: "script", text: (s) => (s.type === "audio-long" ? join(s.script.map((l) => l.t)) : ""), min: { words: 600 }, max: { words: 980 } },
    ],
    "hoeren-3": [{ segment: "recordings", text: audioText, min: { words: 300 }, max: { words: 560 } }],
  },
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
  for (const target of DIFFICULTY_TARGETS[set.examId]?.[partId] ?? []) {
    const m = measureText(target.text(set));
    const min = set.difficulty === 3 ? { ...target.min, ...target.hard } : target.min;
    for (const [key, value] of Object.entries(min) as [Measure, number][])
      if (m[key] < value) issues.push(`${target.segment}: ${round(m[key])} ${LABEL[key]}, below telc level (${set.difficulty === 3 ? "hard set ≥" : "≥"} ${value})`);
    for (const [key, value] of Object.entries(target.max ?? {}) as [Measure, number][])
      if (m[key] > value) issues.push(`${target.segment}: ${round(m[key])} ${LABEL[key]}, above the official range (≤ ${value})`);
  }
  return issues;
}
