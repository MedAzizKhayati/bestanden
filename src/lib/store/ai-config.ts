"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProviderId } from "@/lib/ai/providers/types";

/** "server" = use the AI configured on the server (if any). */
export type LlmChoice = "server" | ProviderId;
/** "browser" = the device's own voices (free, offline). The others are neural cloud voices. */
export type TtsChoice = "browser" | "openai" | "elevenlabs" | "google";
export type KeyId = ProviderId | "elevenlabs" | "googleTts";

export interface AiConfigState {
  llm: LlmChoice;
  /** Chosen model per provider (empty = provider default). */
  models: Partial<Record<ProviderId, string>>;
  /** Base URL of an OpenAI-compatible server (OpenRouter, Ollama, LM Studio, …). */
  baseUrl: string;
  tts: TtsChoice;
  /** Voice overrides per neural engine: female / male voice ids. */
  ttsVoices: Partial<Record<Exclude<TtsChoice, "browser">, { f?: string; m?: string }>>;
  /** API keys – stored only in this browser and sent only with the user's own requests. */
  keys: Partial<Record<KeyId, string>>;
  update: (patch: Partial<Omit<AiConfigState, "update" | "setKey" | "setModel" | "setTtsVoice" | "forgetKeys">>) => void;
  setKey: (id: KeyId, value: string) => void;
  setModel: (provider: ProviderId, model: string) => void;
  setTtsVoice: (engine: Exclude<TtsChoice, "browser">, gender: "f" | "m", voice: string) => void;
  forgetKeys: () => void;
}

export const useAiConfig = create<AiConfigState>()(
  persist(
    (set) => ({
      llm: "server",
      models: {},
      baseUrl: "",
      tts: "browser",
      ttsVoices: {},
      keys: {},
      update: (patch) => set(patch),
      setKey: (id, value) => set((s) => ({ keys: { ...s.keys, [id]: value.trim() } })),
      setModel: (provider, model) => set((s) => ({ models: { ...s.models, [provider]: model.trim() } })),
      setTtsVoice: (engine, gender, voice) =>
        set((s) => ({ ttsVoices: { ...s.ttsVoices, [engine]: { ...s.ttsVoices[engine], [gender]: voice.trim() } } })),
      forgetKeys: () => set({ keys: {}, llm: "server", tts: "browser" }),
    }),
    {
      name: "bestanden:ai",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** The key a TTS engine uses: ElevenLabs and Google Cloud TTS have their own; OpenAI shares the LLM key. */
export function ttsKeyId(engine: Exclude<TtsChoice, "browser">): KeyId {
  return engine === "openai" ? "openai" : engine === "google" ? "googleTts" : "elevenlabs";
}
