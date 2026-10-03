"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  /** Strict: timers auto-submit at zero and Hören runs as an uninterruptible exam simulation. */
  strictTimer: boolean;
  /** Show English translations of exam instructions by default. */
  showEnglish: boolean;
  voiceFemale?: string; // SpeechSynthesisVoice.voiceURI
  voiceMale?: string;
  speechRate: number; // 0.8 – 1.15
  examDate?: string; // yyyy-mm-dd
  dailyGoalMinutes: number;
  /** The welcome flow was finished or skipped. */
  onboarded: boolean;
  /** The "first steps" checklist on the dashboard was dismissed. */
  firstStepsDismissed: boolean;
  update: (patch: Partial<Omit<SettingsState, "update">>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      strictTimer: true,
      showEnglish: true,
      speechRate: 1,
      dailyGoalMinutes: 30,
      onboarded: false,
      firstStepsDismissed: false,
      update: (patch) => set(patch),
    }),
    {
      name: "bestanden:settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
