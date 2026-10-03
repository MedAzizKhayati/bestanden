import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { logAiError, toAiError } from "@/lib/ai/client";
import { aiText } from "@/lib/ai/i18n";
import { providerFor } from "@/lib/ai/providers";
import { configForRequest } from "@/lib/ai/route-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A tiny request to check the user's (or the server's) AI configuration from the settings page. */
export async function POST(req: Request) {
  const body = z.object({ locale: z.enum(LOCALES).default(DEFAULT_LOCALE) }).safeParse(await req.json().catch(() => ({})));
  const locale = body.success ? body.data.locale : DEFAULT_LOCALE;
  const t = aiText(locale);
  const resolved = configForRequest(req, locale, { bucket: "test", perHour: 20, message: t.partnerLimit }, t.notConfigured);
  if ("response" in resolved) return resolved.response;
  const { config } = resolved;
  try {
    let reply = "";
    for await (const chunk of providerFor(config).stream(config, {
      system: "Antworte nur mit dem Wort: Hallo",
      messages: [{ role: "user", content: "Test" }],
      signal: req.signal,
    })) {
      reply += chunk;
      if (reply.length > 40) break;
    }
    return NextResponse.json({ ok: true, provider: config.provider, model: config.model, reply: reply.trim().slice(0, 40) });
  } catch (e) {
    logAiError("ai/test", e);
    const err = toAiError(e, locale);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
