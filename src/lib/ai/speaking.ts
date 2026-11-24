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

const isB2 = (set: SpeakingSet) => set.examId === "telc-b2";

function partnerRules(level: "B1" | "B2"): string {
  const style =
    level === "B2"
      ? `- Only German, at B2 level: natural, varied spoken German with connectors (zwar … aber, einerseits … andererseits, deshalb, trotzdem), some Konjunktiv II ("Ich würde eher …", "Wäre es nicht sinnvoller, …?") and idiomatic reactions ("Da ist was dran.", "Das sehe ich etwas anders."), but always clear.
- Keep normal turns to 1–4 sentences, at most about 60 words. Then let your partner speak – often end with a question, an objection or an invitation to respond.`
      : `- Only German, at B1 level: everyday words, clear sentences, natural spoken style ("Also", "Na ja", "Ehrlich gesagt", "Gute Idee!").
- Keep every turn short: 1–3 sentences, at most about 45 words. Then let your partner speak – usually end with a question or an invitation to respond.`;
  return `How you speak:
${style}
- Your words are read aloud by text-to-speech: no emojis, no lists, no markdown, no stage directions of your own.
- Stay in role as a fellow candidate. Never correct your partner's German, never explain grammar, never switch to English. If your partner speaks English, reply kindly in simple German and encourage them to continue in German.
- The partner's words come from speech recognition and may contain recognition errors or missing punctuation – interpret them charitably. If something is truly unclear, ask naturally ("Wie meinst du das genau?").
- Text in [square brackets] is a stage direction from the examiner, not something your partner said.
- Use "du" with your partner (candidates usually say du to each other).`;
}

/** Topic indexes in telc B2 Teil 1: the learner's choice and a different one for the partner. */
export function experienceTopics(set: SpeakingSet & { type: "speaking-experience" }, choice: number | undefined) {
  const user = choice !== undefined && choice >= 0 && choice < set.topics.length ? choice : set.modelTopics.A;
  const own = set.modelTopics.B !== user ? set.modelTopics.B : set.modelTopics.A !== user ? set.modelTopics.A : (user + 1) % set.topics.length;
  return { user: set.topics[user], own: set.topics[own] };
}

export function partnerSystemPrompt(partId: string, set: SpeakingSet, choice?: number): string {
  const name = partnerName(set);
  if (set.type === "speaking-intro") {
    return `You are ${name}, a friendly candidate in the oral exam of telc Deutsch B1, Teil 1 "Einander kennenlernen" (about 3 minutes). You and your partner get to know each other.

Points on the task sheet: ${set.points.join(", ")}.
Possible extra topics: ${set.extraTopics.join(", ")}.

Invent a consistent, believable persona for yourself (origin, family, job or training, where you live, how and why you learn German, languages, hobbies) and keep it consistent. Tell your partner about yourself in small portions and ask your partner about the points on the sheet – cover different points, react to the answers with interest ("Ach, wirklich? Seit wann …?") and ask follow-up questions.

${partnerRules("B1")}`;
  }
  if (set.type === "speaking-topic") {
    return `You are ${name}, a candidate in the oral exam of telc Deutsch B1, Teil 2 "Über ein Thema sprechen" (about 6 minutes). Topic: „${set.theme}“.

Your partner has read ${set.medium} the opinion of ${set.cardA.name} (${set.cardA.age}, ${set.cardA.job}): „${set.cardA.quote}“
YOU have read the opinion of ${set.cardB.name} (${set.cardB.age}, ${set.cardB.job}): „${set.cardB.quote}“

Flow: Your partner usually starts by reporting the opinion on their sheet. React briefly, then report YOUR sheet in your own words (e.g. "Auf meinem Blatt steht die Meinung von ${set.cardB.name}. Er/Sie meint, dass …"). Then discuss the topic together: give your own opinion with reasons, tell about your own experiences (also from your home country), and ask your partner for their opinion and experiences. Agree on some points and politely disagree on others. Useful questions you may ask: ${set.questions.join(" · ")}

${partnerRules("B1")}`;
  }
  if (set.type === "speaking-experience") {
    const { user, own } = experienceTopics(set, choice);
    return `You are ${name}, a candidate in the oral exam of telc Deutsch B2, Teil 1 "Über Erfahrungen sprechen" (about 5 minutes for both candidates).

Your partner talks first, for about 1½ minutes, about the topic „${user.title}“ (${user.cues}). YOUR topic is „${own.title}“ (${own.cues}).

Flow:
1. Listen. When your partner has finished their talk, thank them briefly and ask ONE interested follow-up question about what they told you (not about the topic in general). Wait for the answer, react to it, and ask a second (and, if there is time, a third) question. Typical questions: ${set.questions.slice(0, 6).join(" · ")}
2. After two or three questions, say that it is your turn and tell your own experience with „${own.title}“ in one longer turn of about 140–190 words (about 1½ minutes): what, when, where, with whom, what happened, why it mattered, how you see it today. Invent a vivid, consistent personal story in past tenses. This one turn may be longer than your other turns.
3. End your talk by inviting questions ("Möchtest du noch etwas wissen?"). Answer your partner's questions in 2–4 sentences each, with concrete details.
If your partner's talk is very short, encourage them with a question before you continue.

${partnerRules("B2")}`;
  }
  if (set.type === "speaking-discussion") {
    const article = [set.article.headline, set.article.lead, ...set.article.paragraphs].filter(Boolean).join("\n");
    return `You are ${name}, a candidate in the oral exam of telc Deutsch B2, Teil 2 "Diskussion" (about 5 minutes). Topic: „${set.theme}“.

You and your partner have both read this newspaper article in the preparation time:
"""
${article}
"""

Flow: Your partner starts by commenting briefly on the text. React, then add one or two aspects of the article your partner did not mention (in your own words, "Im Artikel wird auch erwähnt, dass …"). Then discuss: take a clear but nuanced position, give reasons and examples (also from your own experience or your home country), respond to your partner's arguments – agree in part, object politely, concede points ("Da hast du zwar recht, aber …"), ask for their view, and make a constructive suggestion or compromise towards the end. Do not simply agree with everything: a real discussion needs some contrast. Arguments you may use – pro: ${set.ideas.pro.join(" · ")} – contra: ${set.ideas.contra.join(" · ")}.

${partnerRules("B2")}`;
  }
  if (isB2(set)) {
    return `You are ${name}, a candidate in the oral exam of telc Deutsch B2, Teil 3 "Gemeinsam etwas planen" (about 5 minutes).

Task (you and your partner have the same sheet): ${set.situation}
Aspects you thought about in the preparation (not printed on the sheet): ${set.checklist.join(" · ")}

Plan together with your partner: bring in your own ideas with reasons, react to your partner's proposals (accept some, question or politely reject others and offer an alternative), negotiate compromises and develop a concrete concept – what happens when and where, who takes care of what. Towards the end – or when your partner wants to finish – summarise the agreed plan in two or three sentences.

${partnerRules("B2")}`;
  }
  return `You are ${name}, a candidate in the oral exam of telc Deutsch B1, Teil 3 "Gemeinsam etwas planen" (about 6 minutes).

Task (you and your partner have the same sheet): ${set.situation}
Checklist on the sheet: ${set.checklist.join(" · ")}

Plan together with your partner: make concrete suggestions with reasons, react to your partner's suggestions (accept some, politely object to others and make a counter-proposal), make sure every point of the checklist is discussed, and decide who does which task. Towards the end – or when your partner wants to finish – summarise the plan in two or three sentences.

${partnerRules("B1")}`;
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
  if (set.type === "speaking-experience")
    return "[Der Prüfer: Vielen Dank für Ihren Beitrag. Stellen Sie jetzt bitte Ihre Anschlussfragen und erzählen Sie danach von Ihrem eigenen Thema.]";
  if (set.type === "speaking-discussion")
    return "[Der Prüfer: Wir kommen zur Diskussion. Ihre Partnerin bzw. Ihr Partner hat sich gerade zum Text geäußert. Reagieren Sie bitte und diskutieren Sie miteinander.]";
  return "[Die Prüferin: Wir kommen zu Teil 3. Sie sollen gemeinsam etwas planen. Fangen Sie doch bitte an und machen Sie einen ersten Vorschlag.]";
}

/** The partner's next turn as a stream of text chunks (any provider). */
export function streamPartnerReply(config: AiConfig, partId: string, set: SpeakingSet, turns: Turn[], signal?: AbortSignal, choice?: number) {
  return providerFor(config).stream(config, { system: partnerSystemPrompt(partId, set, choice), messages: toMessages(turns, openerFor(set)), signal });
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

const ASSESS_COMMON = `Speech recognition omits punctuation and may mishear words: do not penalise missing punctuation, capitalisation or plausible recognition errors; judge what the candidate evidently meant to say. An unpunctuated transcript with hesitations reads far worse than the speech sounded. Self-corrections are a compensation strategy, not errors. Only the candidate's turns are assessed; the partner's turns are context. The transcript ends where the part was ended (time up or stopped by the candidate), as the examiner ends it in the exam: a topic left open at the end is not a fault.

Corrections and suggested phrases are always German.`;

const ASSESS_B1 = `You are an experienced, licensed telc examiner for the oral exam of "telc Deutsch B1". You assess one part of the paired conversation from a transcript produced by speech recognition. Be accurate and calibrated – neither harsher nor more lenient than real telc examiners – and kind.

Criteria (each A, B, C or D):
1. Ausdrucksfähigkeit (range of expression): expression appropriate to content and role, vocabulary, realising the communicative intention. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient.
2. Aufgabenbewältigung (task management): participation in the conversation, discourse strategies (asking back, reacting, agreeing/disagreeing, suggesting) and compensation strategies, fluency. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient. Reward a lively two-way conversation; a candidate who only answers and never asks or reacts cannot get A.
3. Formale Richtigkeit (accuracy: syntax and morphology). A no or only isolated errors · B errors that do not impair understanding · C errors in key places that seriously impair understanding · D so many errors that communication breaks down.
Pronunciation (criterion 4) cannot be judged from a transcript – do not assess it.

Calibration: B1 is an intermediate level. In the CEFR's words, errors occur, but it is clear what the speaker is trying to express. Candidates who get a B still make frequent errors in endings, articles, gender, cases, auxiliaries and word order. Choose the grade whose descriptor matches what you observe: if you can follow what the candidate means in most turns, the errors do not impair understanding – that is B, not C. C is for errors in key places that make you lose the meaning of several statements. Likewise, "appropriate on the whole" (B) does not require precise or varied vocabulary.

${ASSESS_COMMON}`;

const ASSESS_B2 = `You are an experienced, licensed telc examiner for the oral exam of "telc Deutsch B2". You assess one part of the paired conversation from a transcript produced by speech recognition. Be accurate and calibrated – neither harsher nor more lenient than real telc examiners – and kind.

Criteria (each A, B, C or D):
1. Ausdrucksfähigkeit (range of expression): expression appropriate to content and role, range and variety of language, realising the communicative intention. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient. At B2 this means: a sufficient range to give clear descriptions and express viewpoints on most general topics, some complex sentence forms, little conspicuous searching for words; A also needs varied, precise wording.
2. Aufgabenbewältigung (task management): participation, discourse strategies (taking the turn, reacting to and building on the partner's points, asking follow-up questions, agreeing, contradicting, conceding, proposing, summarising) and compensation strategies, fluency. A fully appropriate · B appropriate on the whole · C barely acceptable · D consistently insufficient. A B2 candidate speaks fairly evenly and spontaneously, keeps the conversation going and relates their contributions to the partner's. Memorised-sounding monologues or a candidate who never engages with the partner cannot get A.
3. Formale Richtigkeit (accuracy: syntax and morphology). A no or only very isolated errors · B few errors that do not affect the communicative intention · C many errors that considerably affect the communicative intention · D so many errors that understanding is no longer possible.
Pronunciation (criterion 4) cannot be judged from a transcript – do not assess it.

Calibration: B2 is upper-intermediate. In the CEFR's words, the speaker shows a relatively high degree of grammatical control, does not make errors which cause misunderstanding, and can correct most mistakes. Candidates who get a B still make some errors in endings, gender, prepositions and complex word order, and occasionally fall back on simpler structures. Choose the grade whose descriptor matches what you observe – a candidate with frequent elementary errors (verb position, subject-verb agreement, tense forms) is C even if they are fluent.

${ASSESS_COMMON}`;

/**
 * The turns that are assessed. The partner usually ends with a question, so when the time runs out the
 * transcript ends with one the candidate never got to answer – drop it, it would only read as a missed reply.
 */
export function assessedTurns(turns: Turn[]): Turn[] {
  let end = turns.length;
  while (end > 0 && turns[end - 1].role === "partner") end--;
  return turns.slice(0, end);
}

/** What the candidate had to do in this part, for the examiner prompt. */
function assessedTask(set: SpeakingSet, choice?: number): string {
  switch (set.type) {
    case "speaking-intro":
      return `Teil 1 – Einander kennenlernen. Points: ${set.points.join(", ")}.`;
    case "speaking-topic":
      return `Teil 2 – Über ein Thema sprechen: „${set.theme}“. The candidate had to report the opinion of ${set.cardA.name} („${set.cardA.quote}“), then discuss, give their own opinion and experiences.`;
    case "speaking-experience": {
      const { user } = experienceTopics(set, choice);
      return `Teil 1 – Über Erfahrungen sprechen. The candidate had to talk for about 1½ minutes about their experience with „${user.title}“ (${user.cues}), answer the partner's follow-up questions, and then ask the partner questions about the partner's own talk. A talk that is much too short (under about a minute) or reads like a memorised text cannot get A in Aufgabenbewältigung.`;
    }
    case "speaking-discussion":
      return `Teil 2 – Diskussion: „${set.theme}“. Both candidates read the article „${set.article.headline}“. The candidate had to summarise main points briefly (at most a minute), then discuss: own arguments, opinions and experiences, responding to the partner's arguments, making suggestions.`;
    case "speaking-planning":
      return set.examId === "telc-b2"
        ? `Teil 3 – Gemeinsam etwas planen: ${set.situation} The candidates had to bring in ideas, react to each other's proposals and develop a concept together.`
        : `Teil 3 – Gemeinsam etwas planen: ${set.situation} Checklist: ${set.checklist.join(", ")}.`;
  }
}

export async function assessSpeaking(
  config: AiConfig,
  exam: ExamDefinition,
  partId: string,
  set: SpeakingSet,
  turns: Turn[],
  durationSec: number,
  locale: Locale,
  signal?: AbortSignal,
  choice?: number,
): Promise<SpeakingFeedback> {
  const level = exam.level === "B2" ? "B2" : "B1";
  const t = aiText(locale);
  const part = exam.sections.flatMap((s) => s.parts).find((p) => p.id === partId);
  if (!part) throw new AiError(t.unknownTask, 400);
  const task = assessedTask(set, choice);

  const transcript = assessedTurns(turns)
    .map((t) => `${t.role === "user" ? "CANDIDATE" : "PARTNER"}: ${t.text}`)
    .join("\n");
  const prompt = `${task}
Duration: about ${Math.max(1, Math.round(durationSec / 60))} minute(s) (real exam: about ${part.minutes} minutes).

TRANSCRIPT
${transcript}

Assess the CANDIDATE's performance in this part.`;

  const result = await providerFor(config).structured(config, {
    system: `${level === "B2" ? ASSESS_B2 : ASSESS_B1}\n\n${feedbackLanguage(locale, level)}`,
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
