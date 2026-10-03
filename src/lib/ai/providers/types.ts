import type { z } from "zod/v4";

export const PROVIDER_IDS = ["anthropic", "openai", "google", "compatible"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/** Where the credentials of a request come from. */
export type ConfigSource = "user" | "server";

export interface AiConfig {
  provider: ProviderId;
  model: string;
  apiKey: string;
  /** OpenAI-compatible endpoints only (OpenRouter, Ollama, LM Studio, Mistral, Groq, …). */
  baseUrl?: string;
  source: ConfigSource;
}

export interface StructuredRequest<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Short identifier for the schema (OpenAI requires one). */
  schemaName: string;
  /** How much the model should think: assessments use "high", the chat partner "low". */
  effort: "low" | "high";
  signal?: AbortSignal;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

/** Result of a structured call: the parsed object, or why there is none. */
export type StructuredResult<T> = { ok: true; value: T } | { ok: false; reason: "refusal" | "cut-off" | "unreadable" };

export interface AiProvider {
  structured<T>(config: AiConfig, request: StructuredRequest<T>): Promise<StructuredResult<T>>;
  /** Streams the reply as text chunks. Yields a polite German fallback if the model declines. */
  stream(config: AiConfig, request: ChatRequest): AsyncIterable<string>;
}

/** What the partner says when a provider refuses to continue the conversation. */
export const PARTNER_REFUSAL = "Entschuldigung, darüber möchte ich lieber nicht sprechen. Lass uns beim Thema bleiben.";
