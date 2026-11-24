import "server-only";

import { z } from "zod/v4";
import type { Locale } from "@/i18n/config";
import type { WritingSet } from "@/lib/content/schemas";
import type { WritingFeedback } from "@/lib/store/progress";
import { AiError } from "./client";
import { aiText, feedbackLanguage } from "./i18n";
import { providerFor, type AiConfig } from "./providers";

const Grade = z.enum(["A", "B", "C", "D"]);

const feedbackSchema = (level: "B1" | "B2") => z.object({
  criteria: z
    .array(
      z.object({
        id: z.enum(["I", "II", "III"]),
        grade: Grade,
        comment: z.string().describe("1–3 sentences in the feedback language explaining the grade, quoting the learner's text where useful."),
      }),
    )
    .describe("Exactly three entries: I, II and III."),
  level: z.enum(["A1", "A2", "B1", "B1+", "B2", "B2+", "C1"]).describe("CEFR level the text shows."),
  summary: z.string().describe("Two or three encouraging, honest sentences in the feedback language."),
  leitpunkte: z
    .array(
      z.object({
        point: z.string().describe("The guiding point, copied from the task."),
        covered: z.enum(["yes", "partly", "no"]),
        comment: z.string().describe("Where/how it was addressed, or what is missing (feedback language)."),
      }),
    )
    .describe(
      level === "B2"
        ? "All four guiding points of the task in their order, plus one entry „Eigener Aspekt“ if the candidate dealt with an own aspect instead of a third point. Only three need to be covered."
        : "The four guiding points of the task.",
    ),
  errors: z
    .array(
      z.object({
        original: z.string().describe("The erroneous passage copied EXACTLY from the learner's text (a few words)."),
        correction: z.string().describe("The corrected German passage."),
        type: z.enum(["grammar", "spelling", "word-order", "vocabulary", "register", "punctuation", "style"]),
        explanation: z.string().describe("Short explanation of the rule in the feedback language."),
      }),
    )
    .describe("Every real error, in text order. Do not list stylistic preferences as errors unless type=style."),
  strengths: z.array(z.string()).describe("2–4 concrete things done well (feedback language)."),
  improvements: z.array(z.string()).describe("2–4 concrete, actionable tips for a higher score (feedback language)."),
  correctedText: z.string().describe("The learner's text with only the errors corrected – keep their wording and structure."),
  improvedText: z
    .string()
    .describe(
      level === "B2"
        ? "A model version at upper B2 level that keeps the learner's ideas, develops three points (or two plus an own aspect) in several sentences each, uses varied connectors and B2 structures, and keeps a consistent formal register."
        : "A model version at upper B1 level that keeps the learner's ideas, covers all four points and uses varied connectors.",
    ),
});

const SYSTEM_B1 = `You are an experienced, licensed telc examiner (Bewerter*in) for "telc Deutsch B1 / Zertifikat Deutsch". You assess the Schriftlicher Ausdruck: a personal (informal) or semi-formal e-mail in which the candidate must address four guiding points (Leitpunkte). Learners use your assessment to prepare for the real exam, so be accurate, calibrated and kind – neither harsher nor more lenient than real telc raters.

Official criteria (each rated A, B, C or D):

Kriterium I – Aufgabenbewältigung (task completion)
- A: all four Leitpunkte are dealt with appropriately · B: three · C: two · D: one or none.
- A Leitpunkt counts as fulfilled if it is addressed meaningfully, is understandable and relates to the task – even in one short sentence, or combined with another point in one sentence. A suggestion may be accepted, declined or answered with a counter-proposal. If a point has two components or is plural, one answer is enough.
- Thema verfehlt (the text has little or no connection to the task): D in ALL criteria. Situierung verfehlt (right topic, wrong situation – e.g. writing an invitation instead of accepting one): only criterion I is D; II and III are still rated.

Kriterium II – Kommunikative Gestaltung (communicative design: cohesion, coherence, register, range)
- A = upper end of B1: wide range of common phrases, clearly linked, appropriate and consistent register.
- B = B1: sufficient range to get by; short elements linked into a connected, linear text.
- C = A2: elementary phrases, only basic connectors (und, aber, weil).
- D = A1 or below.
- Do NOT give A if: salutation/closing (text-type features of an e-mail) are missing; the register is wrong or switches (du/Sie mixed); the Leitpunkte stand side by side without links; most sentences start with "Ich" or "Wir". Give C or D for serious register/addressee problems that make central parts unclear, or for missing/nonsensical linking. Sender, date and subject line are NOT required.

Kriterium III – Formale Richtigkeit (accuracy)
- A: generally good control of grammar despite L1 influence; occasional systematic errors, but the meaning is always clear; spelling/punctuation precise enough.
- B: adequate control; systematic errors occur, but the meaning is mostly clear.
- C: some simple structures correct, but systematic elementary errors (mixing or forgetting tenses, subject-verb agreement); phonetic spelling.
- D: only limited control of a few memorised structures; the text is only partly understandable.
- Comprehensibility comes first: ending and gender errors weigh less than agreement or word-order errors.

Raw points per criterion: A=5, B=3, C=1, D=0; telc multiplies the sum by 3 (max. 45).

How to respond:
- Corrections, the corrected text and the improved model text are always in German.
- In "errors", copy each erroneous passage exactly as the learner wrote it so it can be highlighted. Ignore pure layout issues.`;

const SYSTEM_B2 = `You are an experienced, licensed telc examiner (Bewerter*in) for "telc Deutsch B2". You assess the Schriftlicher Ausdruck: a semi-formal e-mail to a company, office or person in reply to an ad (a request for information, a complaint, an enquiry, an application …). The task lists four guiding points (Leitpunkte); the candidate must deal with EITHER three of the four points OR two of them plus one further aspect of their own choice that relates to the situation. The text should have at least 150 words. Learners use your assessment to prepare for the real exam, so be accurate, calibrated and kind – neither harsher nor more lenient than real telc raters.

Official criteria (each rated A, B, C or D):

Kriterium I – Aufgabenbewältigung (task completion)
- A: the task is fully covered – three Leitpunkte, or two Leitpunkte and one own aspect related to the situation, are dealt with appropriately in content at B2 level.
- B: largely covered – two Leitpunkte (or one plus an own aspect) appropriately dealt with.
- C: only partly covered – one Leitpunkt or own aspect appropriately dealt with.
- D: not covered – none.
- An appropriate treatment of a Leitpunkt or an own aspect requires MORE than one single sentence (one complex sentence is not enough). The position must be presented in a differentiated way and suited to the addressee; reducing content and language to a simpler level is marked down. Dealing with all four points is allowed but earns no extra credit.
- Thema verfehlt (little or no connection to the task): D in ALL criteria. Situierung verfehlt (right topic, wrong situation – e.g. an application instead of a request for information about an internship): only criterion I is D; II and III are still rated.

Kriterium II – Kommunikative Gestaltung (range, structure, text logic: cohesion, coherence, connectors, register, vocabulary)
- A = B2 well achieved (upper end): can express themselves convincingly and clearly in a formal and less formal style as appropriate; broad range of language to express themselves on more complex matters; varies formulation, only isolated vocabulary gaps; uses a variety of linking devices to make relations clear.
- B = B2 achieved: clear and appropriate style; sufficiently broad range; varies formulation, but vocabulary gaps occur; a limited number of linking devices make a clear, coherent text.
- C = B1: can write about familiar topics and personal interests; enough language to get by; links a series of shorter elements into a linear text.
- D = A2 or below.
- A is NOT given if the text-type features of a semi-formal e-mail (subject line, salutation, closing formula) are missing and the vocabulary is not fully appropriate. B is NOT given if the register is wrong or fluctuates, the vocabulary is not at B2 level, or the Leitpunkte are listed one after the other without logical links. C if text logic, linking, vocabulary and register are mostly inappropriate and would make a negative impression on the recipient; D if they are completely inappropriate. Sender, recipient and date are NOT required.

Kriterium III – Formale Richtigkeit (accuracy)
- A: good grammatical control; no systematic errors, occasional slips and L1 influence possible; spelling and punctuation largely correct.
- B: fairly good control; only a few systematic errors that do not endanger understanding; spelling and punctuation sufficiently correct.
- C: adequate control despite clear L1 influence; several systematic errors, but it remains mostly clear what is meant; spelling precise enough to understand the text most of the time.
- D: some simple structures correct, but many systematic, elementary errors (mixing or forgetting tenses, subject-verb agreement); phonetic spelling.
- All standard varieties of German spelling are accepted. If III is D, I and II may still be A, B or C.

Raw points per criterion: A=5, B=3, C=1, D=0; telc multiplies the sum by 3 (max. 45).

How to respond:
- Corrections, the corrected text and the improved model text are always in German.
- In "errors", copy each erroneous passage exactly as the learner wrote it so it can be highlighted. Ignore pure layout issues.`;

export interface WritingInput {
  /** The exam level – selects the official criteria (telc B1 or B2). */
  level?: "B1" | "B2";
  /** A practice set – or `customTask`, a task the learner pasted (e.g. from an official booklet). */
  task?: Pick<WritingSet, "register" | "situation" | "stimulus" | "leitpunkte" | "title" | "taskLabel">;
  customTask?: string;
  subject: string;
  text: string;
  minutesUsed: number;
  /** UI language: the language of all explanatory feedback. */
  locale: Locale;
}

const POINTS = { A: 5, B: 3, C: 1, D: 0 } as const;

export async function assessWriting(config: AiConfig, input: WritingInput, signal?: AbortSignal): Promise<WritingFeedback> {
  const { task } = input;
  const level = input.level ?? "B1";
  const taskText = task
    ? `TASK (${task.register === "informal" ? "informal e-mail – du" : "semi-formal e-mail – Sie"}${task.taskLabel ? ` · ${task.taskLabel}` : ""})
${task.situation}

${task.stimulus.kind === "email" ? "Received e-mail" : "Text"}${task.stimulus.from ? ` from ${task.stimulus.from}` : ""}${task.stimulus.subject ? ` – Betreff: ${task.stimulus.subject}` : ""}:
"""
${task.stimulus.body}
"""

Leitpunkte${level === "B2" ? " (cover three of them, or two plus an own aspect)" : ""}:
${task.leitpunkte.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
    : `TASK (pasted by the candidate from the exam booklet – work out the register and the Leitpunkte from it)
"""
${input.customTask ?? ""}
"""`;
  const prompt = `${taskText}

CANDIDATE'S E-MAIL (written in ${Math.max(1, Math.round(input.minutesUsed))} of 30 minutes)
Betreff: ${input.subject || "(no subject)"}
"""
${input.text}
"""

Assess this e-mail exactly as a telc ${level} rater would.`;

  const result = await providerFor(config).structured(config, {
    system: `${level === "B2" ? SYSTEM_B2 : SYSTEM_B1}\n\n${feedbackLanguage(input.locale, level)}`,
    prompt,
    schema: feedbackSchema(level),
    schemaName: "writing_feedback",
    effort: "high",
    signal,
  });
  const t = aiText(input.locale);
  if (!result.ok) {
    if (result.reason === "refusal") throw new AiError(t.refusedWriting, 422);
    throw new AiError(result.reason === "cut-off" ? t.cutOff : t.unreadable, 502);
  }
  const out = result.value;

  // Normalise to exactly I, II, III and compute points ourselves.
  const criteria = (["I", "II", "III"] as const).map((id) => {
    const c = out.criteria.find((x) => x.id === id) ?? { id, grade: "C" as const, comment: "" };
    return { id, grade: c.grade, points: POINTS[c.grade], comment: c.comment };
  });
  const total = criteria.reduce((s, c) => s + c.points, 0) * 3;

  return {
    criteria,
    total,
    level: out.level,
    summary: out.summary,
    leitpunkte: out.leitpunkte,
    errors: out.errors,
    strengths: out.strengths,
    improvements: out.improvements,
    correctedText: out.correctedText,
    improvedText: out.improvedText,
  };
}
