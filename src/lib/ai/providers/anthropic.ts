import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { PARTNER_REFUSAL, type AiConfig, type AiProvider } from "./types";

/**
 * Server-side refusal fallback: if a safety classifier declines a request, the API
 * re-runs it on Anthropic's recommended fallback model inside the same call.
 */
const FALLBACK = {
  betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[],
  fallbacks: "default" as const,
};

const clients = new Map<string, Anthropic>();
function client(config: AiConfig): Anthropic {
  // Server credentials may also come from ANTHROPIC_AUTH_TOKEN, which the SDK reads itself.
  const key = config.source === "server" ? "server" : config.apiKey;
  let c = clients.get(key);
  if (!c) {
    c = config.source === "server" ? new Anthropic() : new Anthropic({ apiKey: config.apiKey });
    if (clients.size > 50) clients.clear();
    clients.set(key, c);
  }
  return c;
}

export const anthropicProvider: AiProvider = {
  async structured(config, req) {
    // Streamed: thinking tokens count towards max_tokens, and the SDK requires streaming for
    // budgets this large. finalMessage() still returns the schema-parsed output.
    const response = await client(config)
      .beta.messages.stream(
        {
          model: config.model,
          max_tokens: 32000,
          ...FALLBACK,
          output_config: { effort: req.effort, format: betaZodOutputFormat(req.schema) },
          system: req.system,
          messages: [{ role: "user", content: req.prompt }],
        },
        { signal: req.signal },
      )
      .finalMessage();
    if (response.stop_reason === "refusal") return { ok: false, reason: "refusal" };
    if (response.stop_reason === "max_tokens") return { ok: false, reason: "cut-off" };
    const out = response.parsed_output;
    return out ? { ok: true, value: out } : { ok: false, reason: "unreadable" };
  },

  async *stream(config, req) {
    const stream = client(config).beta.messages.stream(
      {
        model: config.model,
        max_tokens: 4096,
        ...FALLBACK,
        output_config: { effort: "low" },
        system: req.system,
        messages: req.messages,
      },
      { signal: req.signal },
    );
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") yield PARTNER_REFUSAL;
  },
};
