import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { getSet } from "@/lib/content/load";
import { getExam } from "@/lib/exams";
import { logAiError, toAiError } from "@/lib/ai/client";
import { aiText } from "@/lib/ai/i18n";
import { configForRequest } from "@/lib/ai/route-helpers";
import { assessSpeaking, type SpeakingSet } from "@/lib/ai/speaking";

export const runtime = "nodejs";
export const maxDuration = 180;

const Body = z.object({
  examId: z.string(),
  partId: z.enum(["sprechen-1", "sprechen-2", "sprechen-3"]),
  setNumber: z.string().regex(/^\d{2}$/),
  durationSec: z.number().min(0).max(3600),
  turns: z.array(z.object({ role: z.enum(["user", "partner"]), text: z.string().max(4000) })).min(1).max(80),
  /** UI language – the language of the feedback. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;
  const t = aiText(locale);

  const resolved = configForRequest(req, locale, { bucket: "sprechen", perHour: 30, message: t.speakingLimit }, t.notConfigured);
  if ("response" in resolved) return resolved.response;
  if (!parsed.success) return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  const { examId, partId, setNumber, turns, durationSec } = parsed.data;
  const exam = getExam(examId);
  const set = getSet(examId, partId, setNumber);
  if (!exam || !set || !set.type.startsWith("speaking")) return NextResponse.json({ error: t.unknownTask }, { status: 404 });
  if (!turns.some((turn) => turn.role === "user" && turn.text.trim().split(/\s+/).length >= 5))
    return NextResponse.json({ error: t.speakMore }, { status: 400 });

  try {
    const feedback = await assessSpeaking(resolved.config, exam, partId, set as SpeakingSet, turns, durationSec, locale, req.signal);
    return NextResponse.json({ feedback });
  } catch (e) {
    logAiError("ai/sprechen", e);
    const err = toAiError(e, locale);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
