"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SheetAnswers } from "@/lib/official/sheet";
import type { WritingFeedback } from "./progress";

/** The three timed parts of the written exam, in exam order. */
export const OFFICIAL_STAGES = ["lesen", "hoeren", "schreiben"] as const;
export type OfficialStage = (typeof OFFICIAL_STAGES)[number];

export interface OfficialWriting {
  subject: string;
  text: string;
  /** The booklet's task, pasted by the learner – only needed for the AI correction. */
  task: string;
  feedback?: WritingFeedback;
  /** Self-assessed points (0–45) when there is no AI correction. */
  selfPoints?: number;
}

export interface OfficialRun {
  mode: "exam" | "training";
  /** The parts of this attempt, in order (one part or the whole written exam). */
  stages: OfficialStage[];
  current: number;
  /** Wall-clock start per part – timers survive reloads. */
  startedAt: Partial<Record<OfficialStage, number>>;
  answers: SheetAnswers;
  writing: OfficialWriting;
}

export interface OfficialResult {
  at: number;
  mode: OfficialRun["mode"];
  stages: OfficialStage[];
  answers: SheetAnswers;
  writing?: OfficialWriting;
}

interface OfficialState {
  runs: Record<string, OfficialRun>;
  results: Record<string, OfficialResult[]>;
  /** Answer keys entered by the user for tests whose info.json has none. */
  keys: Record<string, SheetAnswers>;
  start: (testId: string, mode: OfficialRun["mode"], stages: OfficialStage[]) => void;
  startStage: (testId: string) => void;
  setAnswer: (testId: string, n: number, value: string | null) => void;
  setWriting: (testId: string, patch: Partial<OfficialWriting>) => void;
  /** Ends the current part; after the last one the attempt becomes a result. */
  finishStage: (testId: string) => void;
  discard: (testId: string) => void;
  setKey: (testId: string, key: SheetAnswers) => void;
}

const emptyWriting: OfficialWriting = { subject: "", text: "", task: "" };

export const useOfficial = create<OfficialState>()(
  persist(
    (set) => ({
      runs: {},
      results: {},
      keys: {},
      start: (testId, mode, stages) =>
        set((s) => ({ runs: { ...s.runs, [testId]: { mode, stages, current: 0, startedAt: {}, answers: {}, writing: emptyWriting } } })),
      startStage: (testId) =>
        set((s) => {
          const run = s.runs[testId];
          if (!run) return s;
          const stage = run.stages[run.current];
          if (run.startedAt[stage]) return s;
          return { runs: { ...s.runs, [testId]: { ...run, startedAt: { ...run.startedAt, [stage]: Date.now() } } } };
        }),
      setAnswer: (testId, n, value) =>
        set((s) => {
          const run = s.runs[testId];
          if (!run) return s;
          const answers = { ...run.answers };
          if (value === null) delete answers[n];
          else answers[n] = value;
          return { runs: { ...s.runs, [testId]: { ...run, answers } } };
        }),
      setWriting: (testId, patch) =>
        set((s) => {
          const run = s.runs[testId];
          if (run) return { runs: { ...s.runs, [testId]: { ...run, writing: { ...run.writing, ...patch } } } };
          // The AI correction may arrive after the attempt was saved: attach it to the latest result.
          const list = s.results[testId];
          if (!list?.length) return s;
          const last = list[list.length - 1];
          return { results: { ...s.results, [testId]: [...list.slice(0, -1), { ...last, writing: { ...(last.writing ?? emptyWriting), ...patch } }] } };
        }),
      finishStage: (testId) =>
        set((s) => {
          const run = s.runs[testId];
          if (!run) return s;
          if (run.current < run.stages.length - 1) return { runs: { ...s.runs, [testId]: { ...run, current: run.current + 1 } } };
          const result: OfficialResult = {
            at: Date.now(),
            mode: run.mode,
            stages: run.stages,
            answers: run.answers,
            writing: run.stages.includes("schreiben") ? run.writing : undefined,
          };
          const { [testId]: _done, ...runs } = s.runs;
          return { runs, results: { ...s.results, [testId]: [...(s.results[testId] ?? []), result] } };
        }),
      discard: (testId) =>
        set((s) => {
          const { [testId]: _gone, ...runs } = s.runs;
          return { runs };
        }),
      setKey: (testId, key) => set((s) => ({ keys: { ...s.keys, [testId]: key } })),
    }),
    { name: "bestanden:official", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
