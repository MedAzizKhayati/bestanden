import type { ProviderId } from "./providers/types";

/** Shown as defaults/suggestions in the settings. Any model id the provider offers can be typed in. */
export const DEFAULT_MODEL_HINTS: Record<ProviderId, string> = {
  anthropic: "claude-opus-5-5",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
  compatible: "",
};

export const MODEL_SUGGESTIONS: Record<ProviderId, string[]> = {
  anthropic: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-4-5-20251001"],
  openai: ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
  compatible: ["llama3.1", "qwen2.5", "mistral-small", "openai/gpt-5-mini", "anthropic/claude-sonnet-5-5"],
};
