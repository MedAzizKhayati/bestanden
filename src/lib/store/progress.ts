"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dayKey } from "@/lib/utils/time";

/** Item number (as string) → chosen answer ("a", "x", "true", "false"). */
export type Answers = Record<string, string>;

export interface AttemptRecord {
  id: string;
  examId: string;
  partId: string;
  setId: string;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  limitSec: number;
  overtimeSec: number;
  strict: boolean;
  autoSubmitted: boolean;
  correct: number;
  total: number;
  points: number;
  maxPoints: number;
  answers: Answers;
  context: "practice" | "mock";
}

export interface InProgressAttempt {
  startedAt: number;
  limitSec: number;
  strict: boolean;
  answers: Answers;
  updatedAt: number;
}

export interface MistakeCard {
  id: string; // `${setId}:${n}`
  examId: string;
  partId: string;
  setId: string;
  n: number;
  prompt: string;
  context?: string;
  options?: { key: string; text: string }[];
  correct: string;
  correctText: string;
  given: string | null;
  explanation: string;
  createdAt: number;
  streak: number;
  due: number;
  resolved: boolean;
}

export interface WritingFeedback {
  criteria: { id: "I" | "II" | "III"; grade: "A" | "B" | "C" | "D"; points: number; comment: string }[];
  total: number; // 0–45
  level: string;
  summary: string;
  leitpunkte: { point: string; covered: "yes" | "partly" | "no"; comment: string }[];
  errors: { original: string; correction: string; type: string; explanation: string }[];
  strengths: string[];
  improvements: string[];
  correctedText: string;
  improvedText: string;
}

export interface WritingRecord {
  id: string;
  examId: string;
  setId: string;
  subject: string;
  text: string;
  wordCount: number;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  limitSec: number;
  autoSubmitted: boolean;
  feedback?: WritingFeedback;
  /** Self-assessment when no AI feedback is available. */
  selfGrades?: Partial<Record<"I" | "II" | "III", "A" | "B" | "C" | "D">>;
}

export interface SpeakingFeedback {
  criteria: { id: string; grade: "A" | "B" | "C" | "D"; points: number; comment: string }[];
  total: number;
  maxPoints: number;
  summary: string;
  corrections: { original: string; correction: string; explanation: string }[];
  betterPhrases: { instead: string; try: string }[];
  strengths: string[];
  nextSteps: string[];
}

export interface SpeakingRecord {
  id: string;
  examId: string;
  partId: string;
  setId: string;
  transcript: string;
  durationSec: number;
  createdAt: number;
  feedback?: SpeakingFeedback;
}

export interface ActivityDay {
  seconds: number;
  items: number;
}

interface ProgressState {
  attempts: AttemptRecord[];
  inProgress: Record<string, InProgressAttempt>;
  mistakes: Record<string, MistakeCard>;
  writing: WritingRecord[];
  speaking: SpeakingRecord[];
  grammar: Record<string, { results: Record<number, boolean>; updatedAt: number }>;
  activity: Record<string, ActivityDay>;

  startAttempt: (key: string, limitSec: number, strict: boolean) => InProgressAttempt;
  setAnswers: (key: string, answers: Answers) => void;
  discardAttempt: (key: string) => void;
  finishAttempt: (key: string, record: Omit<AttemptRecord, "id">, mistakes: Omit<MistakeCard, "createdAt" | "streak" | "due" | "resolved">[], solvedIds: string[]) => AttemptRecord;
  reviewMistake: (id: string, correct: boolean) => void;
  removeMistake: (id: string) => void;
  saveWriting: (record: WritingRecord) => void;
  saveSpeaking: (record: SpeakingRecord) => void;
  recordGrammar: (topicId: string, index: number, correct: boolean) => void;
  resetGrammar: (topicId: string) => void;
  logActivity: (seconds: number, items?: number) => void;
  importState: (data: Partial<ProgressData>) => void;
  resetAll: () => void;
}

export type ProgressData = Pick<
  ProgressState,
  "attempts" | "inProgress" | "mistakes" | "writing" | "speaking" | "grammar" | "activity"
>;

const empty: ProgressData = {
  attempts: [],
  inProgress: {},
  mistakes: {},
  writing: [],
  speaking: [],
  grammar: {},
  activity: {},
};

const DAY = 86_400_000;
const MISTAKE_INTERVALS = [0, 1, 3, 7, 16]; // days, by streak

export function attemptKey(examId: string, setId: string, context: "practice" | "mock" = "practice") {
  return `${context}:${examId}:${setId}`;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function addActivity(activity: Record<string, ActivityDay>, seconds: number, items: number) {
  const key = dayKey(Date.now());
  const prev = activity[key] ?? { seconds: 0, items: 0 };
  return { ...activity, [key]: { seconds: prev.seconds + Math.max(0, Math.round(seconds)), items: prev.items + items } };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...empty,

      startAttempt: (key, limitSec, strict) => {
        const existing = get().inProgress[key];
        if (existing) return existing;
        const attempt: InProgressAttempt = { startedAt: Date.now(), limitSec, strict, answers: {}, updatedAt: Date.now() };
        set((s) => ({ inProgress: { ...s.inProgress, [key]: attempt } }));
        return attempt;
      },

      setAnswers: (key, answers) =>
        set((s) => {
          const current = s.inProgress[key];
          if (!current) return s;
          return { inProgress: { ...s.inProgress, [key]: { ...current, answers, updatedAt: Date.now() } } };
        }),

      discardAttempt: (key) =>
        set((s) => {
          const { [key]: _removed, ...rest } = s.inProgress;
          return { inProgress: rest };
        }),

      finishAttempt: (key, record, newMistakes, solvedIds) => {
        const full: AttemptRecord = { ...record, id: uid() };
        set((s) => {
          const { [key]: _removed, ...rest } = s.inProgress;
          const mistakes = { ...s.mistakes };
          const now = Date.now();
          for (const m of newMistakes) {
            mistakes[m.id] = { ...m, createdAt: mistakes[m.id]?.createdAt ?? now, streak: 0, due: now, resolved: false };
          }
          for (const id of solvedIds) {
            const m = mistakes[id];
            if (m && !m.resolved) mistakes[id] = { ...m, streak: m.streak + 1, due: now + MISTAKE_INTERVALS[Math.min(m.streak + 1, 4)] * DAY };
          }
          return {
            inProgress: rest,
            attempts: [...s.attempts, full],
            mistakes,
            activity: addActivity(s.activity, full.durationSec, full.total),
          };
        });
        return full;
      },

      reviewMistake: (id, correct) =>
        set((s) => {
          const m = s.mistakes[id];
          if (!m) return s;
          const streak = correct ? m.streak + 1 : 0;
          const resolved = streak >= 3;
          const due = Date.now() + MISTAKE_INTERVALS[Math.min(streak, 4)] * DAY;
          return {
            mistakes: { ...s.mistakes, [id]: { ...m, streak, resolved, due } },
            activity: addActivity(s.activity, 20, 1),
          };
        }),

      removeMistake: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.mistakes;
          return { mistakes: rest };
        }),

      saveWriting: (record) =>
        set((s) => {
          const exists = s.writing.some((w) => w.id === record.id);
          return {
            writing: exists ? s.writing.map((w) => (w.id === record.id ? record : w)) : [...s.writing, record],
            activity: exists ? s.activity : addActivity(s.activity, record.durationSec, 1),
          };
        }),

      saveSpeaking: (record) =>
        set((s) => {
          const exists = s.speaking.some((r) => r.id === record.id);
          return {
            speaking: exists ? s.speaking.map((r) => (r.id === record.id ? record : r)) : [...s.speaking, record],
            activity: exists ? s.activity : addActivity(s.activity, record.durationSec, 1),
          };
        }),

      recordGrammar: (topicId, index, correct) =>
        set((s) => {
          const prev = s.grammar[topicId] ?? { results: {}, updatedAt: 0 };
          return {
            grammar: { ...s.grammar, [topicId]: { results: { ...prev.results, [index]: correct }, updatedAt: Date.now() } },
            activity: addActivity(s.activity, 25, 1),
          };
        }),

      resetGrammar: (topicId) =>
        set((s) => {
          const { [topicId]: _removed, ...rest } = s.grammar;
          return { grammar: rest };
        }),

      logActivity: (seconds, items = 0) => set((s) => ({ activity: addActivity(s.activity, seconds, items) })),

      importState: (data) => set(() => ({ ...empty, ...data })),

      resetAll: () => set(() => ({ ...empty })),
    }),
    {
      name: "bestanden:progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): ProgressData => ({
        attempts: s.attempts,
        inProgress: s.inProgress,
        mistakes: s.mistakes,
        writing: s.writing,
        speaking: s.speaking,
        grammar: s.grammar,
        activity: s.activity,
      }),
    },
  ),
);

export { uid };
