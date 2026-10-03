import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { getSet } from "@/lib/content/load";
import { logAiError, toAiError } from "@/lib/ai/client";
import { aiText } from "@/lib/ai/i18n";
import { configForRequest } from "@/lib/ai/route-helpers";
import { assessWriting } from "@/lib/ai/writing";

export const runtime = "nodejs";
export const maxDuration = 180;

const Body = z.object({
  examId: z.string(),
  /** A practice set – or `customTask`: a task pasted by the learner (e.g. from an official booklet). */
  setNumber: z.string().regex(/^\d{2}$/).optional(),
  customTask: z.string().trim().min(40).max(4000).optional(),
  subject: z.string().max(200).default(""),
  text: z.string().max(6000),
  minutesUsed: z.number().min(0).max(600),
  /** UI language – the language of the feedback. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;
  const t = aiText(locale);

  const resolved = configForRequest(req, locale, { bucket: "schreiben", perHour: 30, message: t.writingLimit }, t.notConfigured);
  if ("response" in resolved) return resolved.response;
  if (!parsed.success) return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  const { examId, setNumber, customTask, subject, text, minutesUsed } = parsed.data;
  if (text.trim().length < 20) return NextResponse.json({ error: t.writeMore }, { status: 400 });

  const set = setNumber ? getSet(examId, "schreiben", setNumber) : undefined;
  const task = set?.type === "writing-email" ? set : undefined;
  if (!task && !customTask) return NextResponse.json({ error: t.unknownTask }, { status: 404 });

  try {
    const feedback = await assessWriting(resolved.config, { task, customTask, subject, text, minutesUsed, locale }, req.signal);
    return NextResponse.json({ feedback });
  } catch (e) {
    logAiError("ai/schreiben", e);
    const err = toAiError(e, locale);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
