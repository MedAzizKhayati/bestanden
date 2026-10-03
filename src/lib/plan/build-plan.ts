/** Study-plan generator: pure function, no React. */

import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export interface PlanInventory {
  parts: { partId: string; label: string; sectionId: string; minutes: number; sets: { id: string; href: string; title: string }[] }[];
  grammar: { id: string; title: string; href: string }[];
  vocab: { id: string; title: string; href: string }[];
  mocks: { id: string; href: string; title: string; setIds: string[] }[];
}

export type TaskKind = "set" | "grammar" | "vocab" | "mock" | "review" | "strategy";

export interface PlanTask {
  key: string;
  kind: TaskKind;
  refId: string;
  label: string;
  detail: string;
  href: string;
  minutes: number;
  sectionId?: string;
}

/** Stable phase ids (compared in code; the UI shows `phaseName`). */
export type PlanPhase = "Foundations" | "Exam training" | "Mock exams" | "Final week";

export interface PlanWeek {
  index: number;
  start: Date;
  end: Date;
  phase: PlanPhase;
  /** Name of the phase in the UI language. */
  phaseName: string;
  focus: string;
  tasks: PlanTask[];
}

export interface PlanInput {
  today: Date;
  examDate?: Date;
  dailyMinutes: number;
  /** partId → recent percentage (null = never practised); lower = weaker. */
  weakness: Record<string, number | null>;
  inventory: PlanInventory;
  /** Language of the generated names, labels and details (default English). */
  locale?: Locale;
}

const PHASE_KEY = {
  Foundations: "foundations",
  "Exam training": "training",
  "Mock exams": "mocks",
  "Final week": "final",
} as const satisfies Record<PlanPhase, string>;

export function buildPlan({ today, examDate, dailyMinutes, weakness, inventory, locale = "en" }: PlanInput): PlanWeek[] {
  const { common, plan } = getMessages(locale);
  const tr = plan.builder;
  const DAY = 86_400_000;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = examDate ? Math.max(1, Math.ceil((examDate.getTime() - start.getTime()) / DAY)) : 56;
  const weekCount = Math.min(26, Math.max(1, Math.ceil(daysLeft / 7)));
  const weeklyBudget = dailyMinutes * 6; // one rest day per week

  const phaseFor = (w: number): PlanPhase => {
    if (weekCount === 1) return "Final week";
    if (w === weekCount - 1) return "Final week";
    if (weekCount <= 3) return w === 0 ? "Exam training" : "Mock exams";
    const foundations = Math.max(1, Math.round(weekCount * 0.3));
    const mocks = Math.max(1, Math.round(weekCount * 0.25));
    if (w < foundations) return "Foundations";
    if (w >= weekCount - 1 - mocks) return "Mock exams";
    return "Exam training";
  };

  // Sets used in mock exams are kept out of regular practice.
  const reserved = new Set(inventory.mocks.flatMap((m) => m.setIds));
  const queues = new Map(inventory.parts.map((p) => [p.partId, p.sets.filter((s) => !reserved.has(s.id))]));
  const grammar = [...inventory.grammar];
  const vocab = [...inventory.vocab];
  const mocks = [...inventory.mocks];

  const partById = new Map(inventory.parts.map((p) => [p.partId, p]));
  const rankedParts = [...inventory.parts].sort((a, b) => (weakness[a.partId] ?? 50) - (weakness[b.partId] ?? 50));

  const takeSet = (partId: string): PlanTask | null => {
    const q = queues.get(partId);
    const p = partById.get(partId);
    const s = q?.shift();
    if (!s || !p) return null;
    return { key: `set:${s.id}`, kind: "set", refId: s.id, label: `${p.label} · ${s.title}`, detail: common.minutes(p.minutes), href: s.href, minutes: p.minutes, sectionId: p.sectionId };
  };
  const takeGrammar = (): PlanTask | null => {
    const g = grammar.shift();
    return g ? { key: `grammar:${g.id}`, kind: "grammar", refId: g.id, label: tr.grammar(g.title), detail: tr.grammarDetail, href: g.href, minutes: 20 } : null;
  };
  const takeVocab = (): PlanTask | null => {
    const v = vocab.shift();
    return v ? { key: `vocab:${v.id}`, kind: "vocab", refId: v.id, label: tr.vocab(v.title), detail: tr.vocabDetail, href: v.href, minutes: 15 } : null;
  };

  const weeks: PlanWeek[] = [];
  for (let w = 0; w < weekCount; w++) {
    const phase = phaseFor(w);
    const tasks: PlanTask[] = [];
    let budget = weeklyBudget;
    const push = (t: PlanTask | null) => {
      if (t && budget - t.minutes >= -10) {
        tasks.push(t);
        budget -= t.minutes;
        return true;
      }
      return false;
    };

    if (phase === "Mock exams" || (phase === "Final week" && daysLeft > 3 && weekCount > 1)) {
      const m = mocks.shift();
      if (m) push({ key: `mock:${m.id}`, kind: "mock", refId: m.id, label: m.title, detail: tr.mockDetail(150), href: m.href, minutes: 150 });
    }
    push({ key: `review:${w}`, kind: "review", refId: "fehlertrainer", label: tr.review, detail: tr.reviewDetail, href: "/fehlertrainer", minutes: 30 });

    if (phase === "Foundations") {
      push(takeGrammar());
      push(takeGrammar());
      push(takeVocab());
      push(takeVocab());
      for (const p of inventory.parts) if (budget > 0) push(takeSet(p.partId));
      push(takeGrammar());
    } else if (phase === "Exam training") {
      // Weakest two parts twice, then one set of everything else.
      for (const p of rankedParts.slice(0, 2)) {
        push(takeSet(p.partId));
        push(takeSet(p.partId));
      }
      for (const p of rankedParts.slice(2)) if (budget > 0) push(takeSet(p.partId));
      push(takeGrammar());
      push(takeVocab());
    } else if (phase === "Mock exams") {
      for (const p of rankedParts.slice(0, 3)) push(takeSet(p.partId));
      push(takeSet("schreiben"));
      push(takeSet("sprechen-2"));
      push(takeSet("sprechen-3"));
      push(takeGrammar());
    } else {
      push({ key: `strategy:${w}`, kind: "strategy", refId: "strategien", label: tr.strategies, detail: tr.strategiesDetail, href: "/telc-b1/strategien", minutes: 30 });
      push({ key: `phrases:${w}`, kind: "strategy", refId: "redemittel", label: tr.phrases, detail: tr.phrasesDetail, href: "/redemittel", minutes: 20 });
      for (const p of rankedParts.slice(0, 2)) push(takeSet(p.partId));
      push(takeSet("sprechen-1"));
    }

    const ws = new Date(start.getTime() + w * 7 * DAY);
    const we = new Date(Math.min(start.getTime() + (w * 7 + 6) * DAY, start.getTime() + (daysLeft - 1) * DAY));
    const names = tr.phases[PHASE_KEY[phase]];
    weeks.push({ index: w, start: ws, end: we, phase, phaseName: names.name, focus: names.focus, tasks });
  }
  return weeks;
}
