"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PlacementAnswers, PlacementResult } from "@/lib/placement/score";

export interface PlacementState {
  results: PlacementResult[];
  /** Answers of the last finished test (for the review). */
  lastAnswers: PlacementAnswers;
  /** A running test survives reloads, like every timed task. */
  running: { startedAt: number; answers: PlacementAnswers; section: number } | null;
  start: () => void;
  setAnswer: (id: string, value: number | "r" | "f") => void;
  setSection: (section: number) => void;
  finish: (result: PlacementResult) => void;
  discard: () => void;
}

export const usePlacement = create<PlacementState>()(
  persist(
    (set) => ({
      results: [],
      lastAnswers: {},
      running: null,
      start: () => set({ running: { startedAt: Date.now(), answers: {}, section: 0 } }),
      setAnswer: (id, value) => set((s) => (s.running ? { running: { ...s.running, answers: { ...s.running.answers, [id]: value } } } : s)),
      setSection: (section) => set((s) => (s.running ? { running: { ...s.running, section } } : s)),
      finish: (result) => set((s) => ({ results: [...s.results, result], lastAnswers: s.running?.answers ?? {}, running: null })),
      discard: () => set({ running: null }),
    }),
    { name: "bestanden:placement", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export const latestPlacement = (s: PlacementState) => s.results[s.results.length - 1];
