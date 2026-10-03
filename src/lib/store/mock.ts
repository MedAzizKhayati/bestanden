"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Answers, WritingFeedback } from "./progress";

export type MockStage = "reading" | "listening" | "writing" | "done";

export interface MockRun {
  mockId: string;
  stage: MockStage;
  readingStartedAt: number;
  listeningIndex: number; // 0..2 within Hören
  writingStartedAt?: number;
  answers: Record<string, Answers>; // partId → answers
  writing: { subject: string; text: string };
  strict: boolean;
}

export interface MockResult {
  id: string;
  mockId: string;
  finishedAt: number;
  parts: Record<string, { points: number; maxPoints: number; correct: number; total: number }>;
  writing?: { feedback?: WritingFeedback; selfPoints?: number; text: string; subject: string };
  writtenPoints: number; // incl. writing if available
}

interface MockState {
  runs: Record<string, MockRun>;
  results: MockResult[];
  start: (mockId: string, strict: boolean) => MockRun;
  patch: (mockId: string, patch: Partial<MockRun>) => void;
  setAnswers: (mockId: string, partId: string, answers: Answers) => void;
  abandon: (mockId: string) => void;
  saveResult: (result: MockResult) => void;
}

export const useMock = create<MockState>()(
  persist(
    (set) => ({
      runs: {},
      results: [],
      start: (mockId, strict) => {
        const run: MockRun = {
          mockId,
          stage: "reading",
          readingStartedAt: Date.now(),
          listeningIndex: 0,
          answers: {},
          writing: { subject: "", text: "" },
          strict,
        };
        set((s) => ({ runs: { ...s.runs, [mockId]: run } }));
        return run;
      },
      patch: (mockId, patch) =>
        set((s) => {
          const run = s.runs[mockId];
          return run ? { runs: { ...s.runs, [mockId]: { ...run, ...patch } } } : s;
        }),
      setAnswers: (mockId, partId, answers) =>
        set((s) => {
          const run = s.runs[mockId];
          return run ? { runs: { ...s.runs, [mockId]: { ...run, answers: { ...run.answers, [partId]: answers } } } } : s;
        }),
      abandon: (mockId) =>
        set((s) => {
          const { [mockId]: _removed, ...rest } = s.runs;
          return { runs: rest };
        }),
      saveResult: (result) =>
        set((s) => {
          const exists = s.results.some((r) => r.id === result.id);
          return { results: exists ? s.results.map((r) => (r.id === result.id ? result : r)) : [...s.results, result] };
        }),
    }),
    {
      name: "bestanden:mock",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ runs: s.runs, results: s.results }),
    },
  ),
);

