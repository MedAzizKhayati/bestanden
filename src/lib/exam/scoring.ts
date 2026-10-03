import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import type { ExamSet } from "@/lib/content/schemas";
import type { PartDefinition } from "@/lib/exams";
import type { Answers, MistakeCard } from "@/lib/store/progress";
import { findQuote, gapSentence, seededShuffle } from "@/lib/utils/text";

/** Exam sets that are scored automatically (receptive skills). */
export type ScoredSet = Extract<
  ExamSet,
  { type: "headline-matching" | "text-mc" | "ad-matching" | "gap-mc" | "gap-wordbank" | "audio-short" | "audio-long" }
>;

export function isScoredSet(set: ExamSet): set is ScoredSet {
  return !set.type.startsWith("writing") && !set.type.startsWith("speaking");
}

/** True/false answers are stored as "r" (richtig) / "f" (falsch). */
export const tf = (b: boolean) => (b ? "r" : "f");

export function answerKey(set: ScoredSet): Record<string, string> {
  switch (set.type) {
    case "headline-matching":
      return Object.fromEntries(set.texts.map((t) => [String(t.n), t.answer]));
    case "text-mc":
      return Object.fromEntries(set.questions.map((q) => [String(q.n), q.answer]));
    case "ad-matching":
      return Object.fromEntries(set.situations.map((s) => [String(s.n), s.answer]));
    case "gap-mc":
    case "gap-wordbank":
      return Object.fromEntries(set.gaps.map((g) => [String(g.n), g.answer]));
    case "audio-short":
      return Object.fromEntries(set.items.map((i) => [String(i.n), tf(i.answer)]));
    case "audio-long":
      return Object.fromEntries(set.statements.map((s) => [String(s.n), tf(s.answer)]));
  }
}

export interface ItemResult {
  n: number;
  given: string | null;
  correct: string;
  ok: boolean;
}

export interface ScoreResult {
  correct: number;
  total: number;
  points: number;
  maxPoints: number;
  percent: number;
  items: ItemResult[];
}

export function scoreSet(set: ScoredSet, part: PartDefinition, answers: Answers): ScoreResult {
  const key = answerKey(set);
  const items = Object.entries(key).map(([n, correct]) => {
    const given = answers[n] ?? null;
    return { n: Number(n), given, correct, ok: given === correct };
  });
  const correct = items.filter((i) => i.ok).length;
  const points = correct * part.pointsPerItem;
  return {
    correct,
    total: items.length,
    points,
    maxPoints: part.maxPoints,
    percent: part.maxPoints ? Math.round((points / part.maxPoints) * 100) : 0,
    items,
  };
}

/** The number printed on the official answer sheet (e.g. Sprachbausteine Teil 1 gap 3 → 23). */
export function officialNumber(part: PartDefinition, n: number) {
  return part.firstItem ? part.firstItem + n - 1 : n;
}

type CardDraft = Omit<MistakeCard, "createdAt" | "streak" | "due" | "resolved">;

/**
 * Build a self-contained review card for a wrong answer, answerable without the original page.
 * Its texts are stored in the UI language at creation time (the set's explanations are already localized).
 */
export function mistakeCard(set: ScoredSet, part: PartDefinition, n: number, given: string | null, locale: Locale): CardDraft {
  const labels = getMessages(locale).common.cards;
  const base = { id: `${set.id}:${n}`, examId: set.examId, partId: part.id, setId: set.id, n, given };
  const pick = <T extends { key: string }>(all: T[], correct: string, extra = 2): T[] => {
    const others = seededShuffle(
      all.filter((o) => o.key !== correct && o.key !== given),
      `${set.id}-${n}`,
    ).slice(0, extra);
    const chosen = all.filter((o) => o.key === correct || o.key === given);
    return [...chosen, ...others].sort((a, b) => a.key.localeCompare(b.key));
  };

  switch (set.type) {
    case "headline-matching": {
      const t = set.texts.find((x) => x.n === n)!;
      const options = pick(set.headlines, t.answer, 1).map((h) => ({ key: h.key, text: h.text }));
      return {
        ...base,
        prompt: labels.whichHeadline,
        context: t.text,
        options,
        correct: t.answer,
        correctText: set.headlines.find((h) => h.key === t.answer)!.text,
        explanation: t.explanation,
      };
    }
    case "text-mc": {
      const q = set.questions.find((x) => x.n === n)!;
      return {
        ...base,
        prompt: q.stem,
        context: labels.fromText(q.evidence),
        options: q.options,
        correct: q.answer,
        correctText: q.options.find((o) => o.key === q.answer)!.text,
        explanation: q.explanation,
      };
    }
    case "ad-matching": {
      const s = set.situations.find((x) => x.n === n)!;
      const adText = (key: string) => {
        const ad = set.ads.find((a) => a.key === key);
        return ad ? [ad.heading, ad.subheading, ...ad.lines, ad.footer].filter(Boolean).join(" · ") : "";
      };
      const keys = new Set([s.answer, given ?? ""].filter((k) => k && k !== "x"));
      const options = [...keys].sort().map((k) => ({ key: k, text: adText(k) }));
      options.push({ key: "x", text: labels.noAdFits });
      return {
        ...base,
        prompt: s.text,
        options,
        correct: s.answer,
        correctText: s.answer === "x" ? labels.noAdFitsShort : adText(s.answer),
        explanation: s.explanation,
      };
    }
    case "gap-mc": {
      const g = set.gaps.find((x) => x.n === n)!;
      const fill = (m: number) => {
        const gap = set.gaps.find((x) => x.n === m);
        return gap?.options.find((o) => o.key === gap.answer)?.text ?? "…";
      };
      return {
        ...base,
        prompt: gapSentence(set.text, n, fill),
        options: g.options,
        correct: g.answer,
        correctText: g.options.find((o) => o.key === g.answer)!.text,
        explanation: g.explanation,
      };
    }
    case "gap-wordbank": {
      const g = set.gaps.find((x) => x.n === n)!;
      const word = (key: string) => set.words.find((w) => w.key === key)?.text ?? "…";
      const fill = (m: number) => word(set.gaps.find((x) => x.n === m)?.answer ?? "");
      return {
        ...base,
        prompt: gapSentence(set.text, n, fill),
        options: pick(set.words, g.answer, 2).map((w) => ({ key: w.key, text: w.text })),
        correct: g.answer,
        correctText: word(g.answer),
        explanation: g.explanation,
      };
    }
    case "audio-short": {
      const item = set.items.find((x) => x.n === n)!;
      return {
        ...base,
        prompt: item.statement,
        context: item.script.map((l) => l.t).join(" "),
        options: [
          { key: "r", text: "richtig" },
          { key: "f", text: "falsch" },
        ],
        correct: tf(item.answer),
        correctText: item.answer ? "richtig" : "falsch",
        explanation: item.explanation,
      };
    }
    case "audio-long": {
      const st = set.statements.find((x) => x.n === n)!;
      const idx = set.script.findIndex((l) => findQuote(l.t, st.evidence) !== null);
      const lines = idx >= 0 ? set.script.slice(Math.max(0, idx - 1), idx + 2) : [];
      return {
        ...base,
        prompt: st.text,
        context: lines.map((l) => l.t).join(" "),
        options: [
          { key: "r", text: "richtig" },
          { key: "f", text: "falsch" },
        ],
        correct: tf(st.answer),
        correctText: st.answer ? "richtig" : "falsch",
        explanation: st.explanation,
      };
    }
  }
}

/** Score as percentage → traffic-light verdict relative to the 60 % pass mark. */
export function verdict(percent: number, locale: Locale): { label: string; tone: "success" | "warning" | "destructive" } {
  const v = getMessages(locale).common.verdict;
  if (percent >= 80) return { label: v.excellent, tone: "success" };
  if (percent >= 60) return { label: v.pass, tone: "success" };
  if (percent >= 45) return { label: v.almost, tone: "warning" };
  return { label: v.practice, tone: "destructive" };
}
