import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GoogleApiError } from "@google/genai";
import OpenAI from "openai";
import type { Locale } from "@/i18n/config";
import { aiText } from "./i18n";
import { ConfigError, serverConfig } from "./providers";

/** True if the server has its own AI credentials (users can still bring their own key). */
export function aiConfigured(): boolean {
  return serverConfig() !== null;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** HTTP status of an SDK error from any provider, if it has one. */
function statusOf(error: unknown): number | undefined {
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) return error.status ?? undefined;
  if (error instanceof GoogleApiError) return error.status;
  return undefined;
}

/** Map provider and configuration errors to user-facing messages (in the UI language) and status codes. */
export function toAiError(error: unknown, locale: Locale): AiError {
  if (error instanceof AiError) return error;
  const t = aiText(locale);
  if (error instanceof ConfigError) {
    const message = { "missing-key": t.missingKey, "missing-model": t.missingModel, "invalid-base-url": t.invalidBaseUrl, "local-base-url": t.localBaseUrl }[
      error.message
    ];
    return new AiError(message ?? t.invalidRequest, 400);
  }
  if (error instanceof Anthropic.APIConnectionError || error instanceof OpenAI.APIConnectionError) return new AiError(t.connection, 502);
  const status = statusOf(error);
  if (status === 401 || status === 403) return new AiError(t.invalidKey, 401);
  if (status === 404) return new AiError(t.unknownModel, 400);
  if (status === 429) return new AiError(t.busy, 429);
  if (status === 400 || status === 413 || status === 422) return new AiError(t.badRequest, 400);
  if (status) return new AiError(t.serviceError(String(status)), 502);
  if (error instanceof TypeError && /fetch/i.test(error.message)) return new AiError(t.connection, 502);
  return new AiError(t.unexpected, 500);
}

/** Log without leaking request data (the user's key travels in headers, never in error messages we print). */
export function logAiError(route: string, error: unknown) {
  const status = statusOf(error);
  console.error(`[${route}]`, status ? `status ${status}:` : "", error instanceof Error ? error.message : String(error));
}

/* ---------------- best-effort rate limiting (per server instance) ---------------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
