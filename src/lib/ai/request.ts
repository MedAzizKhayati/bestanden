"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAiConfig } from "@/lib/store/ai-config";
import { DEFAULT_MODEL_HINTS } from "./models";

/** Headers that carry the user's own AI configuration (empty when the server's AI is used). */
export function aiRequestHeaders(): Record<string, string> {
  const s = useAiConfig.getState();
  if (s.llm === "server") return {};
  const headers: Record<string, string> = { "x-ai-provider": s.llm, "x-ai-key": s.keys[s.llm] ?? "" };
  const model = s.models[s.llm];
  if (model) headers["x-ai-model"] = model;
  if (s.llm === "compatible") headers["x-ai-base-url"] = s.baseUrl;
  return headers;
}

/** POST JSON to an AI route with the user's configuration attached. */
export function aiFetch(path: string, body: unknown, init: RequestInit = {}) {
  return fetch(path, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...aiRequestHeaders(), ...init.headers },
    body: JSON.stringify(body),
  });
}

export interface ServerAiStatus {
  available: boolean;
  provider?: string;
  model?: string;
}

let statusPromise: Promise<ServerAiStatus> | null = null;
/** The server's AI status, fetched once per page load. */
export function serverAiStatus(): Promise<ServerAiStatus> {
  statusPromise ??= fetch("/api/ai/status")
    .then((r) => r.json() as Promise<ServerAiStatus>)
    .catch(() => ({ available: false }));
  return statusPromise;
}

/** Non-hook check (for event handlers): the user's own configuration, else the server's. */
export async function aiUsable(): Promise<boolean> {
  const s = useAiConfig.getState();
  if (s.llm === "compatible") return !!s.baseUrl && !!s.models.compatible;
  if (s.llm !== "server") return !!s.keys[s.llm];
  return (await serverAiStatus()).available;
}

export interface AiAvailability {
  /** False until the server status is known. */
  ready: boolean;
  available: boolean;
  source: "user" | "server" | null;
  /** e.g. "OpenAI · gpt-5-mini" */
  label?: string;
}

/** Whether AI feedback can be used – with the user's own key, or the server's configuration. */
export function useAiAvailability(): AiAvailability {
  const { llm, key, model, baseUrl } = useAiConfig(
    useShallow((s) => ({ llm: s.llm, key: s.llm === "server" ? "" : (s.keys[s.llm] ?? ""), model: s.llm === "server" ? "" : (s.models[s.llm] ?? ""), baseUrl: s.baseUrl })),
  );
  const [server, setServer] = useState<ServerAiStatus | null>(null);
  useEffect(() => {
    let alive = true;
    void serverAiStatus().then((s) => alive && setServer(s));
    return () => {
      alive = false;
    };
  }, []);

  if (llm !== "server") {
    const usable = llm === "compatible" ? !!baseUrl && !!model : !!key;
    const shownModel = model || DEFAULT_MODEL_HINTS[llm];
    return { ready: true, available: usable, source: usable ? "user" : null, label: `${PROVIDER_LABELS[llm]}${shownModel ? ` · ${shownModel}` : ""}` };
  }
  if (!server) return { ready: false, available: false, source: null };
  return server.available
    ? { ready: true, available: true, source: "server", label: `${PROVIDER_LABELS[server.provider as keyof typeof PROVIDER_LABELS] ?? server.provider} · ${server.model}` }
    : { ready: true, available: false, source: null };
}

export const PROVIDER_LABELS = { anthropic: "Anthropic Claude", openai: "OpenAI", google: "Google Gemini", compatible: "OpenAI-compatible" } as const;
