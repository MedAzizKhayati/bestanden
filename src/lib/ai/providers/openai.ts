import "server-only";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod/v4";
import { PARTNER_REFUSAL, type AiConfig, type AiProvider, type StructuredRequest, type StructuredResult } from "./types";

const clients = new Map<string, OpenAI>();
function client(config: AiConfig): OpenAI {
  const key = `${config.baseUrl ?? ""}|${config.source === "server" ? "server" : config.apiKey}`;
  let c = clients.get(key);
  if (!c) {
    // Local servers (Ollama, LM Studio) accept any key, but the SDK insists on one.
    c = new OpenAI({ apiKey: config.apiKey || "not-needed", baseURL: config.baseUrl || undefined, maxRetries: 1 });
    if (clients.size > 50) clients.clear();
    clients.set(key, c);
  }
  return c;
}

/** Reasoning models take `reasoning_effort`; others reject it. */
const isReasoningModel = (model: string) => /^(o\d|gpt-5)/i.test(model);

/** Pull a JSON object out of a reply that may be wrapped in prose or code fences. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(body.slice(start, end + 1));
}

async function structuredOpenAI<T>(config: AiConfig, req: StructuredRequest<T>): Promise<StructuredResult<T>> {
  const completion = await client(config).chat.completions.parse(
    {
      model: config.model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.prompt },
      ],
      response_format: zodResponseFormat(req.schema, req.schemaName),
      max_completion_tokens: 16000,
      ...(isReasoningModel(config.model) ? { reasoning_effort: req.effort === "high" ? ("high" as const) : ("low" as const) } : {}),
    },
    { signal: req.signal },
  );
  const choice = completion.choices[0];
  if (choice?.message.refusal) return { ok: false, reason: "refusal" };
  if (choice?.finish_reason === "length") return { ok: false, reason: "cut-off" };
  const parsed = choice?.message.parsed;
  return parsed ? { ok: true, value: parsed as T } : { ok: false, reason: "unreadable" };
}

/**
 * OpenAI-compatible servers differ in what they support. Try a strict JSON schema first, then
 * plain JSON mode, then free text – the schema is also described in the prompt – and validate.
 */
async function structuredCompatible<T>(config: AiConfig, req: StructuredRequest<T>): Promise<StructuredResult<T>> {
  const jsonSchema = z.toJSONSchema(req.schema);
  const formats = [
    { type: "json_schema" as const, json_schema: { name: req.schemaName, schema: jsonSchema as Record<string, unknown>, strict: true } },
    { type: "json_object" as const },
    undefined,
  ];
  const prompt = `${req.prompt}\n\nReply with a single JSON object that matches this JSON Schema exactly (no prose, no code fences):\n${JSON.stringify(jsonSchema)}`;
  let lastError: unknown;
  for (const response_format of formats) {
    try {
      const completion = await client(config).chat.completions.create(
        {
          model: config.model,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: prompt },
          ],
          max_tokens: 8000,
          ...(response_format ? { response_format } : {}),
        },
        { signal: req.signal },
      );
      const choice = completion.choices[0];
      if (choice?.message.refusal) return { ok: false, reason: "refusal" };
      if (choice?.finish_reason === "length") return { ok: false, reason: "cut-off" };
      const parsed = req.schema.safeParse(extractJson(choice?.message.content ?? ""));
      return parsed.success ? { ok: true, value: parsed.data } : { ok: false, reason: "unreadable" };
    } catch (e) {
      // 400 = this server doesn't support the response format → try the next, simpler one.
      if (e instanceof OpenAI.BadRequestError || e instanceof OpenAI.UnprocessableEntityError) {
        lastError = e;
        continue;
      }
      if (e instanceof SyntaxError || (e instanceof Error && e.message === "no JSON object in reply")) return { ok: false, reason: "unreadable" };
      throw e;
    }
  }
  throw lastError;
}

export const openaiProvider: AiProvider = {
  structured(config, req) {
    return config.provider === "compatible" ? structuredCompatible(config, req) : structuredOpenAI(config, req);
  },

  async *stream(config, req) {
    const stream = await client(config).chat.completions.create(
      {
        model: config.model,
        stream: true,
        messages: [{ role: "system", content: req.system }, ...req.messages],
        ...(config.provider === "compatible" ? { max_tokens: 1024 } : { max_completion_tokens: 4000 }),
        ...(config.provider === "openai" && isReasoningModel(config.model) ? { reasoning_effort: "low" as const } : {}),
      },
      { signal: req.signal },
    );
    let refused = false;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.refusal) refused = true;
      if (delta?.content) yield delta.content;
    }
    if (refused) yield PARTNER_REFUSAL;
  },
};
