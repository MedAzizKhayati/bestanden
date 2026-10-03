import "server-only";

import { DEFAULT_MODEL_HINTS } from "../models";
import { anthropicProvider } from "./anthropic";
import { googleProvider } from "./google";
import { openaiProvider } from "./openai";
import { PROVIDER_IDS, type AiConfig, type AiProvider, type ProviderId } from "./types";

export * from "./types";

const PROVIDERS: Record<ProviderId, AiProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
  compatible: openaiProvider,
};

export function providerFor(config: AiConfig): AiProvider {
  return PROVIDERS[config.provider];
}

/** Sensible defaults; every model can be overridden (env AI_MODEL, or the user's settings). */
export const DEFAULT_MODELS: Record<ProviderId, string> = DEFAULT_MODEL_HINTS;

const isProvider = (v: string | undefined | null): v is ProviderId => !!v && (PROVIDER_IDS as readonly string[]).includes(v);

/** The server's own AI configuration from the environment, or null if none is set. */
export function serverConfig(): AiConfig | null {
  const env = process.env;
  const explicit = isProvider(env.AI_PROVIDER) ? env.AI_PROVIDER : undefined;
  const keys: Record<ProviderId, string | undefined> = {
    anthropic: env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN,
    openai: env.OPENAI_API_KEY,
    google: env.GEMINI_API_KEY || env.GOOGLE_API_KEY,
    compatible: env.AI_BASE_URL ? env.AI_API_KEY || "" : undefined,
  };
  const provider = explicit ?? PROVIDER_IDS.find((p) => keys[p] !== undefined);
  if (!provider || keys[provider] === undefined) return null;
  const specific = { anthropic: env.ANTHROPIC_MODEL, openai: env.OPENAI_MODEL, google: env.GEMINI_MODEL, compatible: undefined }[provider];
  const model = env.AI_MODEL || specific || DEFAULT_MODELS[provider];
  if (!model) return null;
  return { provider, model, apiKey: keys[provider] ?? "", baseUrl: provider === "compatible" ? env.AI_BASE_URL : undefined, source: "server" };
}

export class ConfigError extends Error {}

/** Base URLs of OpenAI-compatible servers: http(s) only, no private networks in production (SSRF). */
export function checkBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigError("invalid-base-url");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new ConfigError("invalid-base-url");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const local =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    /^f[cd][0-9a-f]{2}:/i.test(host);
  if (local && process.env.NODE_ENV === "production" && process.env.AI_ALLOW_LOCAL_BASE_URL !== "1") throw new ConfigError("local-base-url");
  return url.toString().replace(/\/$/, "");
}

/**
 * Configuration for one request. A key from the user's settings (sent as headers) overrides the
 * server configuration – including provider and model. Without one, the server's env is used.
 */
export function resolveConfig(req: Request): AiConfig | null {
  const h = (name: string) => req.headers.get(name)?.trim() || undefined;
  const provider = h("x-ai-provider");
  if (isProvider(provider)) {
    const apiKey = h("x-ai-key") ?? "";
    const baseUrl = provider === "compatible" ? checkBaseUrl(h("x-ai-base-url") ?? "") : undefined;
    if (!apiKey && provider !== "compatible") throw new ConfigError("missing-key");
    const model = h("x-ai-model") || DEFAULT_MODELS[provider];
    if (!model) throw new ConfigError("missing-model");
    return { provider, model, apiKey, baseUrl, source: "user" };
  }
  return serverConfig();
}
