import "server-only";

import { z } from "zod/v4";
import type { Locale } from "@/i18n/config";
import type { ExamDefinition } from "@/lib/exams";
import type { SpeakingFeedback } from "@/lib/store/progress";
import { AiError } from "./client";
import { aiText, feedbackLanguage } from "./i18n";
import { providerFor, type AiConfig, type ChatMessage } from "./providers";
import type { SpeakingSet, Turn } from "./speaking-types";

export type { SpeakingSet, Turn };

function partnerName(set: SpeakingSet): string {
  return set.speakers.find((s) => s.id === "B")?.name ?? "Alex";
}

/* ------------------------------------------------------------------ */
/* Conversation partner                                                */
/* ------------------------------------------------------------------ */

const PARTNER_RULES = `How you speak:
- Only German, at B1 level: everyday words, clear sentences, natural spoken style ("Also", "Na ja", "Ehrlich gesagt", "Gute Idee!").
- Keep every turn short: 1–3 sentences, at most about 45 words. Then let your partner speak – usually end with a question or an invitation to respond.
- Your words are read aloud by text-to-speech: no emojis, no lists, no markdown, no stage directions of your own.
- Stay in role as a fellow candidate. Never correct your partner's German, never explain grammar, never switch to English. If your partner speaks English, reply kindly in simple German and encourage them to continue in German.
- The partner's words come from speech recognition and may contain recognition errors or missing punctuation – interpret them charitably. If something is truly unclear, ask naturally ("Wie meinst du das genau?").
- Text in [square brackets] is a stage direction from the examiner, not something your partner said.
- Use "du" with your partner (candidates usually say du to each other).`;

export function partnerSystemPrompt(partId: string, set: SpeakingSet): string {
  const name = partnerName(set);
  if (set.type === "speaking-intro") {
    return `You are ${name}, a friendly candidate in the oral exam of telc Deutsch B1, Teil 1 "Einander kennenlernen" (about 3 minutes). You and your partner get to know each other.

Points on the task sheet: ${set.points.join(", ")}.
Possible extra topics: ${set.extraTopics.join(", ")}.

Invent a consistent, believable persona for yourself (origin, family, job or training, where you live, how and why you learn German, languages, hobbies) and keep it consistent. Tell your partner about yourself in small portions and ask your partner about the points on the sheet – cover different points, react to the answers with interest ("Ach, wirklich? Seit wann …?") and ask follow-up questions.

${PARTNER_RULES}`;
  }
  if (set.type === "speaking-topic") {
    return `You are ${name}, a candidate in the oral exam of telc Deutsch B1, Teil 2 "Über ein Thema sprechen" (about 6 minutes). Topic: „${set.theme}“.

Your partner has read ${set.medium} the opinion of ${set.cardA.name} (${set.cardA.age}, ${set.cardA.job}): „${set.cardA.quote}“
YOU have read the opinion of ${set.cardB.name} (${set.cardB.age}, ${set.cardB.job}): „${set.cardB.quote}“

Flow: Your partner usually starts by reporting the opinion on their sheet. React briefly, then report YOUR sheet in your own words (e.g. "Auf meinem Blatt steht die Meinung von ${set.cardB.name}. Er/Sie meint, dass …"). Then discuss the topic together: give your own opinion with reasons, tell about your own experiences (also from your home country), and ask your partner for their opinion and experiences. Agree on some points and politely disagree on others. Useful questions you may ask: ${set.questions.join(" · ")}

${PARTNER_RULES}`;
  }
  return `You are ${name}, a candidate in the oral exam of telc Deutsch B1, Teil 3 "Gemeinsam etwas planen" (about 6 minutes).

Task (you and your partner have the same sheet): ${set.situation}
Checklist on the sheet: ${set.checklist.join(" · ")}

Plan together with your partner: make concrete suggestions with reasons, react to your partner's suggestions (accept some, politely object to others and make a counter-proposal), make sure every point of the checklist is discussed, and decide who does which task. Towards the end – or when your partner wants to finish – summarise the plan in two or three sentences.

${PARTNER_RULES}`;
}

export function toMessages(turns: Turn[], opener: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  // The conversation must start with a user message: use the examiner's opener when the partner speaks first.
  if (!turns.length || turns[0].role === "partner") messages.push({ role: "user", content: opener });
  for (const t of turns) {
    const role = t.role === "user" ? "user" : "assistant";
    const last = messages[messages.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n${t.text}`;
    else messages.push({ role, content: t.text });
  }
  return messages;
}

export function openerFor(set: SpeakingSet): string {
  if (set.type === "speaking-intro") return "[Die Prüferin: Willkommen! Beginnen wir mit Teil 1. Bitte stellen Sie sich einander vor.]";
  if (set.type === "speaking-topic") return "[Die Prüferin: Wir kommen zu Teil 2. Ihr Partner hat Ihnen gerade von seinem Blatt berichtet. Reagieren Sie und berichten Sie dann von Ihrem Blatt.]";
  return "[Die Prüferin: Wir kommen zu Teil 3. Sie sollen gemeinsam etwas planen. Fangen Sie doch bitte an und machen Sie einen ersten Vorschlag.]";
}

/** The partner's next turn as a stream of text chunks (any provider). */
export function streamPartnerReply(config: AiConfig, partId: string, set: SpeakingSet, turns: Turn[], signal?: AbortSignal) {
  return providerFor(config).stream(config, { system: partnerSystemPrompt(partId, set), messages: toMessages(turns, openerFor(set)), signal });
}

/* ------------------------------------------------------------------ */
/* Speaking assessment                                                 */
/* ------------------------------------------------------------------ */

const Grade = z.enum(["A", "B", "C", "D"]);

const SpeakingSchema = z.object({
  criteria: z
    .array(
      z.object({
        id: z.enum(["ausdruck", "aufgabe", "richtigkeit"]),
        grade: Grade,
        comment: z.string().describe("1–3 sentences in the feedback language, quoting the candidate where useful."),
      }),
    )
    .describe("Exactly three entries: ausdruck, aufgabe, richtigkeit."),
  summary: z.string().describe("Two or three encouraging, honest sentences in the feedback language."),
  corrections: z
    .array(
      z.object({
        original: z.string().describe("What the candidate said (German)."),
        correction: z.string().describe("Correct German version."),
        explanation: z.string().describe("Short explanation in the feedback language."),
      }),
    )
    .describe("The most important grammar/vocabulary errors (max. 8). Ignore obvious speech-recognition artefacts."),
  betterPhrases: z
    .array(z.object({ instead: z.string(), try: z.string() }))
    .describe("2–5 more natural or more exam-effective phrases the candidate could use next time (German)."),
  strengths: z.array(z.string()).describe("2–3 concrete strengths (feedback language)."),
  nextSteps: z.array(z.string()).describe("2–4 concrete, actionable tips (feedback language)."),
});

const ASSESS_SYSTEM = `You are an experienced, licensed telc examiner for the oral exam of "telc Deutsch B1". You assess one part of the paired conversation from a transcript produced by speech recognition. Be accurate and calibrated – neither harsher nor more lenient than real telc examiners – and kind.

Criteria (each A, B, C or D):
1. Ausdrucksfähigkeit (range of expression): expression appropriate to content and role, vocabulary, realising the communicative intention. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient.
2. Aufgabenbewältigung (task management): participation in the conversation, discourse strategies (asking back, reacting, agreeing/disagreeing, suggesting) and compensation strategies, fluency. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient. Reward a lively two-way conversation; a candidate who only answers and never asks or reacts cannot get A.
3. Formale Richtigkeit (accuracy: syntax and morphology). A no or only isolated errors · B errors that do not impair understanding · C errors in key places that seriously impair understanding · D so many errors that communication breaks down.
Pronunciation (criterion 4) cannot be judged from a transcript – do not assess it.

Speech recognition omits punctuation and may mishear words: do not penalise missing punctuation, capitalisation or plausible recognition errors; judge what the candidate evidently meant to say. Only the candidate's turns are assessed; the partner's turns are context.

Corrections and suggested phrases are always German.`;

export async function assessSpeaking(
  config: AiConfig,
  exam: ExamDefinition,
  partId: string,
  set: SpeakingSet,
  turns: Turn[],
  durationSec: number,
  locale: Locale,
  signal?: AbortSignal,
): Promise<SpeakingFeedback> {
  const t = aiText(locale);
  const part = exam.sections.flatMap((s) => s.parts).find((p) => p.id === partId);
  if (!part) throw new AiError(t.unknownTask, 400);
  const task =
    set.type === "speaking-intro"
      ? `Teil 1 – Einander kennenlernen. Points: ${set.points.join(", ")}.`
      : set.type === "speaking-topic"
        ? `Teil 2 – Über ein Thema sprechen: „${set.theme}“. The candidate had to report the opinion of ${set.cardA.name} („${set.cardA.quote}“), then discuss, give their own opinion and experiences.`
        : `Teil 3 – Gemeinsam etwas planen: ${set.situation} Checklist: ${set.checklist.join(", ")}.`;

  const transcript = turns.map((t) => `${t.role === "user" ? "CANDIDATE" : "PARTNER"}: ${t.text}`).join("\n");
  const prompt = `${task}
Duration: about ${Math.max(1, Math.round(durationSec / 60))} minute(s) (real exam: about ${part.minutes} minutes).

TRANSCRIPT
${transcript}

Assess the CANDIDATE's performance in this part.`;

  const result = await providerFor(config).structured(config, {
    system: `${ASSESS_SYSTEM}\n\n${feedbackLanguage(locale)}`,
    prompt,
    schema: SpeakingSchema,
    schemaName: "speaking_feedback",
    effort: "high",
    signal,
  });
  if (!result.ok) {
    if (result.reason === "refusal") throw new AiError(t.refusedSpeaking, 422);
    throw new AiError(result.reason === "cut-off" ? t.cutOff : t.unreadable, 502);
  }
  const out = result.value;

  const table = exam.speakingRubric.points[partId];
  const criteria = (["ausdruck", "aufgabe", "richtigkeit"] as const).map((id) => {
    const c = out.criteria.find((x) => x.id === id) ?? { id, grade: "C" as const, comment: "" };
    return { id, grade: c.grade, points: table[id][c.grade], comment: c.comment };
  });
  const total = criteria.reduce((s, c) => s + c.points, 0);
  const maxPoints = (["ausdruck", "aufgabe", "richtigkeit"] as const).reduce((s, id) => s + table[id].A, 0);
  return {
    criteria,
    total,
    maxPoints,
    summary: out.summary,
    corrections: out.corrections,
    betterPhrases: out.betterPhrases,
    strengths: out.strengths,
    nextSteps: out.nextSteps,
  };
}
