"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { createNeuralResolver, prerenderedResolver } from "@/lib/audio/resolvers";
import { setAudioResolver } from "@/lib/audio/speech";
import { ttsKeyId, useAiConfig } from "@/lib/store/ai-config";
import { useHydrated } from "@/lib/store/hydration";

/**
 * Keeps the speech engine in sync with the voice settings: recorded/pre-rendered files first,
 * then the chosen neural voice, then (inside playLines) the browser's voices.
 */
export function AudioEngineSync() {
  const hydrated = useHydrated();
  const { tts, key, voiceF, voiceM } = useAiConfig(
    useShallow((s) => ({
      tts: s.tts,
      key: s.tts === "browser" ? "" : (s.keys[ttsKeyId(s.tts)] ?? ""),
      voiceF: s.tts === "browser" ? undefined : s.ttsVoices[s.tts]?.f,
      voiceM: s.tts === "browser" ? undefined : s.ttsVoices[s.tts]?.m,
    })),
  );

  useEffect(() => {
    if (!hydrated) return;
    const neural = tts === "browser" ? null : createNeuralResolver(tts, { key: key || undefined, voices: { f: voiceF, m: voiceM } });
    setAudioResolver(async (text, speaker, signal) => (await prerenderedResolver(text, speaker, signal)) ?? (neural ? neural(text, speaker, signal) : null));
    return () => setAudioResolver(null);
  }, [hydrated, tts, key, voiceF, voiceM]);

  return null;
}
