import "server-only";

import { FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";
import { extractJson } from "./openai";
import { PARTNER_REFUSAL, type AiConfig, type AiProvider } from "./types";

const clients = new Map<string, GoogleGenAI>();
function client(config: AiConfig): GoogleGenAI {
  let c = clients.get(config.apiKey);
  if (!c) {
    // GEMINI_BASE_URL: optional proxy / test server.
    c = new GoogleGenAI({ apiKey: config.apiKey, httpOptions: process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : undefined });
    if (clients.size > 50) clients.clear();
    clients.set(config.apiKey, c);
  }
  return c;
}

/** Gemini accepts standard JSON Schema minus a few keywords. */
function geminiSchema(schema: z.ZodType): unknown {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

const BLOCKED: (FinishReason | undefined)[] = [FinishReason.SAFETY, FinishReason.PROHIBITED_CONTENT, FinishReason.BLOCKLIST, FinishReason.SPII];

export const googleProvider: AiProvider = {
  async structured(config, req) {
    const response = await client(config).models.generateContent({
      model: config.model,
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      config: {
        systemInstruction: req.system,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema(req.schema),
        maxOutputTokens: 16000,
        abortSignal: req.signal,
      },
    });
    const reason = response.candidates?.[0]?.finishReason;
    if (BLOCKED.includes(reason) || response.promptFeedback?.blockReason) return { ok: false, reason: "refusal" };
    if (reason === FinishReason.MAX_TOKENS) return { ok: false, reason: "cut-off" };
    try {
      const parsed = req.schema.safeParse(extractJson(response.text ?? ""));
      return parsed.success ? { ok: true, value: parsed.data } : { ok: false, reason: "unreadable" };
    } catch {
      return { ok: false, reason: "unreadable" };
    }
  },

  async *stream(config, req) {
    const stream = await client(config).models.generateContentStream({
      model: config.model,
      contents: req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      config: { systemInstruction: req.system, maxOutputTokens: 4096, abortSignal: req.signal },
    });
    let refused = false;
    for await (const chunk of stream) {
      if (BLOCKED.includes(chunk.candidates?.[0]?.finishReason) || chunk.promptFeedback?.blockReason) refused = true;
      const text = chunk.text;
      if (text) yield text;
    }
    if (refused) yield PARTNER_REFUSAL;
  },
};
