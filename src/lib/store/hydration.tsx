"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useAiConfig } from "./ai-config";
import { useMock } from "./mock";
import { useOfficial } from "./official";
import { usePlacement } from "./placement";
import { useProgress } from "./progress";
import { useSettings } from "./settings";
import { useVocab } from "./vocab";

const useHydrationFlag = create<{ hydrated: boolean }>(() => ({ hydrated: false }));

/** Rehydrates all persisted stores once on the client, after the first render. */
export function StoreHydration() {
  useEffect(() => {
    Promise.all([
      useProgress.persist.rehydrate(),
      useSettings.persist.rehydrate(),
      useVocab.persist.rehydrate(),
      useMock.persist.rehydrate(),
      useAiConfig.persist.rehydrate(),
      usePlacement.persist.rehydrate(),
      useOfficial.persist.rehydrate(),
    ]).then(
      () => useHydrationFlag.setState({ hydrated: true }),
    );
  }, []);
  return null;
}

/** False during SSR and the first client render; true once persisted state is loaded. */
export function useHydrated() {
  return useHydrationFlag((s) => s.hydrated);
}
