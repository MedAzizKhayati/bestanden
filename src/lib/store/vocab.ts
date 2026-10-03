"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dayKey } from "@/lib/utils/time";

/** Spaced-repetition state of one vocabulary card (SM-2 style). */
export interface CardState {
  due: number;
  interval: number; // days
  ease: number;
  reps: number;
  lapses: number;
  last: number;
}

export type Grade = 0 | 1 | 2 | 3; // again · hard · good · easy

const MIN = 60_000;
const DAY = 86_400_000;

export function schedule(card: CardState | undefined, grade: Grade, now = Date.now()): CardState {
  const c: CardState = card ?? { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 };
  if (grade === 0) {
    return { ...c, reps: 0, interval: 0, lapses: c.lapses + 1, ease: Math.max(1.3, c.ease - 0.2), due: now + MIN, last: now };
  }
  let interval: number;
  if (c.reps === 0) interval = grade === 1 ? 0 : grade === 2 ? 1 : 3;
  else if (c.reps === 1) interval = grade === 1 ? 1 : grade === 2 ? 3 : 6;
  else interval = Math.max(1, c.interval * (grade === 1 ? 1.2 : grade === 2 ? c.ease : c.ease * 1.3));
  const ease = Math.max(1.3, c.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  const due = interval === 0 ? now + 10 * MIN : now + interval * DAY;
  return { due, interval, ease, reps: c.reps + 1, lapses: c.lapses, last: now };
}

interface VocabState {
  cards: Record<string, CardState>;
  reviewsByDay: Record<string, number>;
  review: (id: string, grade: Grade) => void;
  learn: (ids: string[]) => void;
  forget: (id: string) => void;
  importState: (data: Partial<Pick<VocabState, "cards" | "reviewsByDay">>) => void;
  resetAll: () => void;
}

export const useVocab = create<VocabState>()(
  persist(
    (set) => ({
      cards: {},
      reviewsByDay: {},
      review: (id, grade) =>
        set((s) => {
          const key = dayKey(Date.now());
          return {
            cards: { ...s.cards, [id]: schedule(s.cards[id], grade) },
            reviewsByDay: { ...s.reviewsByDay, [key]: (s.reviewsByDay[key] ?? 0) + 1 },
          };
        }),
      learn: (ids) =>
        set((s) => {
          const cards = { ...s.cards };
          const now = Date.now();
          for (const id of ids) if (!cards[id]) cards[id] = { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 };
          return { cards };
        }),
      forget: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.cards;
          return { cards: rest };
        }),
      importState: (data) => set(() => ({ cards: data.cards ?? {}, reviewsByDay: data.reviewsByDay ?? {} })),
      resetAll: () => set(() => ({ cards: {}, reviewsByDay: {} })),
    }),
    {
      name: "bestanden:vocab",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ cards: s.cards, reviewsByDay: s.reviewsByDay }),
    },
  ),
);
