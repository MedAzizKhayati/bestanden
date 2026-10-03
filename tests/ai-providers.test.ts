import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { AiConfig } from "@/lib/ai/providers";

/**
 * Runs the real assessment and partner code of every provider against a local mock server
 * and checks the requests (endpoint, auth, structured-output format) and the parsed results.
 */

const WRITING = {
  criteria: [
    { id: "I", grade: "A", comment: "Alle vier Punkte." },
    { id: "II", grade: "B", comment: "Gute Konnektoren." },
    { id: "III", grade: "C", comment: "Einige Fehler." },
  ],
  level: "B1",
  summary: "Solide E-Mail.",
  leitpunkte: [{ point: "P1", covered: "yes", comment: "ok" }],
  errors: [{ original: "mit meine Freunde", correction: "mit meinen Freunden", type: "grammar", explanation: "mit + Dativ" }],
  strengths: ["Klarer Aufbau"],
  improvements: ["Satzanfänge variieren"],
  correctedText: "…",
  improvedText: "…",
};
const PARTNER_TEXT = "Super Idee! Wollen wir am Samstag feiern?";

interface Seen {
  path: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}
const seen: Seen[] = [];
let server: ReturnType<typeof Bun.serve>;

/** Server-sent events: Anthropic names its events, OpenAI ends with [DONE], Gemini has neither. */
const sse = (events: unknown[], style: "anthropic" | "openai" | "gemini") =>
  new Response(
    events.map((e) => (style === "anthropic" ? `event: ${(e as { type: string }).type}\n` : "") + `data: ${JSON.stringify(e)}\n\n`).join("") +
      (style === "openai" ? "data: [DONE]\n\n" : ""),
    { headers: { "content-type": "text/event-stream" } },
  );

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const body = (await req.json()) as Record<string, unknown>;
      seen.push({ path: url.pathname + url.search, headers: Object.fromEntries(req.headers), body });
      const structured = JSON.stringify(WRITING);

      if (url.pathname === "/v1/messages") {
        const text = (body.output_config as { format?: unknown } | undefined)?.format ? structured : PARTNER_TEXT;
        return sse(
          [
            { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } },
            { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
            { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
            { type: "content_block_stop", index: 0 },
            { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 5 } },
            { type: "message_stop" },
          ],
          "anthropic",
        );
      }
      if (url.pathname.endsWith("/chat/completions")) {
        if (body.stream)
          return sse([
            { id: "c", object: "chat.completion.chunk", created: 0, model: body.model, choices: [{ index: 0, delta: { role: "assistant", content: "Super Idee! " }, finish_reason: null }] },
            { id: "c", object: "chat.completion.chunk", created: 0, model: body.model, choices: [{ index: 0, delta: { content: "Wollen wir am Samstag feiern?" }, finish_reason: "stop" }] },
          ], "openai");
        // The compatible server pretends not to support strict JSON schemas, to exercise the fallback.
        const format = body.response_format as { type?: string } | undefined;
        if (url.pathname.startsWith("/compat") && format?.type === "json_schema")
          return Response.json({ error: { message: "response_format json_schema not supported" } }, { status: 400 });
        const content = url.pathname.startsWith("/compat") ? `Hier ist die Bewertung:\n\`\`\`json\n${structured}\n\`\`\`` : structured;
        return Response.json({
          id: "c",
          object: "chat.completion",
          created: 0,
          model: body.model,
          choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        });
      }
      if (url.pathname.includes(":streamGenerateContent"))
        return sse([
          { candidates: [{ content: { role: "model", parts: [{ text: "Super Idee! " }] } }] },
          { candidates: [{ content: { role: "model", parts: [{ text: "Wollen wir am Samstag feiern?" }] }, finishReason: "STOP" }] },
        ], "gemini");
      if (url.pathname.includes(":generateContent"))
        return Response.json({ candidates: [{ content: { role: "model", parts: [{ text: structured }] }, finishReason: "STOP" }] });
      return new Response("not found", { status: 404 });
    },
  });
  const base = `http://localhost:${server.port}`;
  process.env.ANTHROPIC_BASE_URL = base;
  process.env.OPENAI_BASE_URL = `${base}/v1`;
  process.env.GEMINI_BASE_URL = base;
});
afterAll(() => server.stop(true));

const task = JSON.parse(readFileSync("content/telc-b1/schreiben/01.json", "utf8"));
const speakingSet = JSON.parse(readFileSync("content/telc-b1/sprechen-3/02.json", "utf8"));
const input = { task, subject: "Hochzeit", text: "Liebe Jana, vielen Dank für deine Einladung. Ich komme leider nicht mit meine Freunde.", minutesUsed: 12, locale: "de" as const };

const configs: AiConfig[] = [
  { provider: "anthropic", model: "claude-opus-5-5", apiKey: "sk-ant-test", source: "user" },
  { provider: "openai", model: "gpt-5-mini", apiKey: "sk-openai-test", source: "user" },
  { provider: "google", model: "gemini-2.5-flash", apiKey: "gemini-test", source: "user" },
  { provider: "compatible", model: "llama3.1", apiKey: "", baseUrl: "", source: "user" },
];

describe.each(configs)("$provider", (config) => {
  const cfg = () => (config.provider === "compatible" ? { ...config, baseUrl: `http://localhost:${server.port}/compat/v1` } : config);

  test("writing assessment is parsed and scored on the server", async () => {
    const { assessWriting } = await import("@/lib/ai/writing");
    seen.length = 0;
    const fb = await assessWriting(cfg(), input);
    expect(fb.total).toBe((5 + 3 + 1) * 3);
    expect(fb.criteria.map((c) => c.points)).toEqual([5, 3, 1]);
    expect(fb.errors[0].correction).toBe("mit meinen Freunden");

    const req = seen[seen.length - 1];
    const sentText = JSON.stringify(req.body);
    expect(sentText).toContain("Feedback language: GERMAN");
    if (config.provider === "anthropic") {
      expect(req.path).toStartWith("/v1/messages");
      expect(req.headers["x-api-key"]).toBe("sk-ant-test");
      expect((req.body.output_config as { format: { type: string } }).format.type).toBe("json_schema");
      expect(req.headers["anthropic-beta"]).toContain("server-side-fallback");
    } else if (config.provider === "openai") {
      expect(req.headers.authorization).toBe("Bearer sk-openai-test");
      expect((req.body.response_format as { type: string }).type).toBe("json_schema");
      expect(req.body.reasoning_effort).toBe("high");
    } else if (config.provider === "google") {
      expect(req.path).toContain("/models/gemini-2.5-flash:generateContent");
      expect(req.headers["x-goog-api-key"]).toBe("gemini-test");
      const gen = req.body.generationConfig as { responseMimeType: string; responseJsonSchema: Record<string, unknown> };
      expect(gen.responseMimeType).toBe("application/json");
      expect(gen.responseJsonSchema.$schema).toBeUndefined();
    } else {
      // json_schema rejected → retried in JSON mode, reply wrapped in prose and a code fence.
      const formats = seen.map((s) => (s.body.response_format as { type?: string } | undefined)?.type);
      expect(formats).toEqual(["json_schema", "json_object"]);
    }
  });

  test("partner reply streams as text", async () => {
    const { streamPartnerReply } = await import("@/lib/ai/speaking");
    seen.length = 0;
    let text = "";
    for await (const chunk of streamPartnerReply(cfg(), "sprechen-3", speakingSet, [])) text += chunk;
    expect(text).toBe(PARTNER_TEXT);
    // The partner speaks first → the conversation opens with the examiner's instruction.
    expect(JSON.stringify(seen[0].body)).toContain("Die Prüferin");
  });
});

describe("configuration", () => {
  test("user headers override the server configuration", async () => {
    const { resolveConfig } = await import("@/lib/ai/providers");
    process.env.ANTHROPIC_API_KEY = "server-key";
    const req = new Request("http://x", { headers: { "x-ai-provider": "openai", "x-ai-key": "user-key", "x-ai-model": "gpt-x" } });
    expect(resolveConfig(req)).toEqual({ provider: "openai", model: "gpt-x", apiKey: "user-key", baseUrl: undefined, source: "user" });
    expect(resolveConfig(new Request("http://x"))?.source).toBe("server");
    delete process.env.ANTHROPIC_API_KEY;
  });

  test("a user provider without key is rejected, private base URLs only outside production", async () => {
    const { resolveConfig, checkBaseUrl } = await import("@/lib/ai/providers");
    expect(() => resolveConfig(new Request("http://x", { headers: { "x-ai-provider": "google" } }))).toThrow("missing-key");
    expect(checkBaseUrl("http://localhost:11434/v1/")).toBe("http://localhost:11434/v1");
    expect(() => checkBaseUrl("ftp://example.com")).toThrow("invalid-base-url");
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = "production";
    expect(() => checkBaseUrl("http://192.168.1.10:1234/v1")).toThrow("local-base-url");
    expect(checkBaseUrl("https://openrouter.ai/api/v1")).toBe("https://openrouter.ai/api/v1");
    env.NODE_ENV = prev;
  });
});
