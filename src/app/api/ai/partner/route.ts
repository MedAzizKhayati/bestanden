import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { getSet } from "@/lib/content/load";
import { logAiError, toAiError } from "@/lib/ai/client";
import { aiText } from "@/lib/ai/i18n";
import { configForRequest } from "@/lib/ai/route-helpers";
import { streamPartnerReply, type SpeakingSet } from "@/lib/ai/speaking";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  examId: z.string(),
  partId: z.enum(["sprechen-1", "sprechen-2", "sprechen-3"]),
  setNumber: z.string().regex(/^\d{2}$/),
  turns: z.array(z.object({ role: z.enum(["user", "partner"]), text: z.string().max(2000) })).max(60),
  /** UI language – only affects error messages; the partner always speaks German. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;
  const t = aiText(locale);

  const resolved = configForRequest(req, locale, { bucket: "partner", perHour: 240, message: t.partnerLimit }, t.partnerNotConfigured);
  if ("response" in resolved) return resolved.response;
  if (!parsed.success) return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  const { examId, partId, setNumber, turns } = parsed.data;
  const set = getSet(examId, partId, setNumber);
  if (!set || !set.type.startsWith("speaking")) return NextResponse.json({ error: t.unknownTask }, { status: 404 });

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());
  const chunks = streamPartnerReply(resolved.config, partId, set as SpeakingSet, turns, abort.signal)[Symbol.asyncIterator]();

  // Read the first chunk before answering, so configuration and auth errors become a JSON error.
  let first: IteratorResult<string>;
  try {
    first = await chunks.next();
  } catch (e) {
    logAiError("ai/partner", e);
    const err = toAiError(e, locale);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        for (let next = first.done ? first : await chunks.next(); !next.done; next = await chunks.next()) controller.enqueue(encoder.encode(next.value));
        controller.close();
      } catch (e) {
        logAiError("ai/partner stream", e);
        controller.error(e);
      }
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
