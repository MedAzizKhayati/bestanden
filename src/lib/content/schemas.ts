/**
 * Content contract for every piece of learning material on the site.
 *
 * All content lives as JSON under /content and is validated against these
 * schemas by `bun run content:validate` (see scripts/validate-content.ts).
 * Cross-field rules (unique answers, gap markers, evidence quotes, …) are
 * checked in ./checks.ts so the schemas stay readable and infer clean types.
 */
import { z } from "zod";
import { GRAMMAR_CATEGORIES, TOPICS } from "./constants";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export const EXAM_IDS = ["telc-b1"] as const;
export const ExamId = z.enum(EXAM_IDS);
export type ExamId = z.infer<typeof ExamId>;

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const Level = z.enum(LEVELS);
export type Level = z.infer<typeof Level>;

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
function letters(n: number) {
  return z.enum(ALPHABET.slice(0, n) as [string, ...string[]]);
}
export const LetterC = letters(3); // a–c
export const LetterJ = letters(10); // a–j
export const LetterL = letters(12); // a–l
export const LetterO = letters(15); // a–o

export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");
const Text = z.string().trim().min(1);

export { TOPICS, GRAMMAR_CATEGORIES } from "./constants";
export const Topic = z.enum(Object.keys(TOPICS) as [keyof typeof TOPICS, ...(keyof typeof TOPICS)[]]);
export type Topic = z.infer<typeof Topic>;

export const GlossaryEntry = z.object({ de: Text, en: Text });

/**
 * German versions of English explanation fields (shown in the German UI).
 * Convention: `fooDe` translates `foo`; the loader swaps them for locale "de"
 * and strips every `…De` field otherwise. See content/AUTHORING.md → Translations.
 */
const De = z.string().trim().min(1).optional();
const DeList = z.array(Text).optional();
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;

/** Fields shared by every exam practice set. */
const SetBase = z.object({
  id: Slug, // "<partId>-<nn>", e.g. "lesen-1-03"
  examId: ExamId,
  title: Text, // short German title shown in lists, e.g. "Urlaub mit der Bahn"
  topic: Topic,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]), // 1 easy · 2 exam level · 3 hard
  glossary: z.array(GlossaryEntry).default([]),
});

/* ------------------------------------------------------------------ */
/* Leseverstehen                                                       */
/* ------------------------------------------------------------------ */

/** Lesen Teil 1 – match 5 short texts to 10 headlines (a–j). */
export const HeadlineMatchingSet = SetBase.extend({
  type: z.literal("headline-matching"),
  headlines: z.array(z.object({ key: LetterJ, text: Text })).length(10),
  texts: z
    .array(
      z.object({
        n: z.number().int().min(1).max(5),
        text: Text,
        answer: LetterJ,
        explanation: Text, // English: why this headline fits
        explanationDe: De,
        evidence: z.array(Text).min(1), // exact substrings of `text` that signal the answer
      }),
    )
    .length(5),
  /** Why each unused headline is a trap. Exactly the 5 keys not used as answers. */
  distractors: z.array(z.object({ key: LetterJ, why: Text, whyDe: De })).length(5),
});
export type HeadlineMatchingSet = z.infer<typeof HeadlineMatchingSet>;

/** Lesen Teil 2 – one longer article, 5 multiple-choice items (a/b/c). */
export const TextMcSet = SetBase.extend({
  type: z.literal("text-mc"),
  article: z.object({
    headline: Text,
    lead: z.string().trim().optional(),
    paragraphs: z.array(Text).min(4).max(10),
    source: z.string().trim().optional(), // fictional publication, e.g. "Rheinische Wochenschau"
  }),
  questions: z
    .array(
      z.object({
        n: z.number().int().min(1).max(5),
        stem: Text,
        options: z.array(z.object({ key: LetterC, text: Text })).length(3),
        answer: LetterC,
        explanation: Text,
        explanationDe: De,
        evidence: Text, // exact substring of one paragraph (or the lead)
      }),
    )
    .length(5),
});
export type TextMcSet = z.infer<typeof TextMcSet>;

export const Ad = z.object({
  key: LetterL,
  heading: Text,
  subheading: z.string().trim().optional(),
  lines: z.array(Text).min(1).max(8),
  footer: z.string().trim().optional(), // address / phone / web
});
export type Ad = z.infer<typeof Ad>;

/** Lesen Teil 3 – 10 situations, 12 ads (a–l); "x" if no ad fits. */
export const AdMatchingSet = SetBase.extend({
  type: z.literal("ad-matching"),
  situations: z
    .array(
      z.object({
        n: z.number().int().min(1).max(10),
        text: Text,
        answer: z.union([LetterL, z.literal("x")]),
        explanation: Text,
        explanationDe: De,
      }),
    )
    .length(10),
  ads: z.array(Ad).length(12),
});
export type AdMatchingSet = z.infer<typeof AdMatchingSet>;

/* ------------------------------------------------------------------ */
/* Sprachbausteine                                                     */
/* ------------------------------------------------------------------ */

export const TextType = z.enum([
  "email-informal",
  "email-semiformal",
  "letter-formal",
  "letter-informal",
  "article",
  "notice",
]);
export type TextType = z.infer<typeof TextType>;

/** Sprachbausteine Teil 1 – grammar: 10 gaps, options a/b/c. Gaps marked [[1]]…[[10]] in `text`. */
export const GapMcSet = SetBase.extend({
  type: z.literal("gap-mc"),
  textType: TextType,
  text: Text,
  gaps: z
    .array(
      z.object({
        n: z.number().int().min(1).max(10),
        options: z.array(z.object({ key: LetterC, text: Text })).length(3),
        answer: LetterC,
        explanation: Text,
        explanationDe: De,
        grammar: Slug.optional(), // id of a grammar topic in /content/grammar
      }),
    )
    .length(10),
});
export type GapMcSet = z.infer<typeof GapMcSet>;

/** Sprachbausteine Teil 2 – vocabulary: 10 gaps, 15 words (a–o), each word at most once. */
export const GapWordbankSet = SetBase.extend({
  type: z.literal("gap-wordbank"),
  textType: TextType,
  /** Optional ad or notice the letter refers to (shown above the text). */
  stimulus: z.object({ heading: Text, lines: z.array(Text).min(1) }).optional(),
  text: Text,
  words: z.array(z.object({ key: LetterO, text: Text })).length(15),
  gaps: z
    .array(
      z.object({
        n: z.number().int().min(1).max(10),
        answer: LetterO,
        explanation: Text,
        explanationDe: De,
        grammar: Slug.optional(),
      }),
    )
    .length(10),
});
export type GapWordbankSet = z.infer<typeof GapWordbankSet>;

/* ------------------------------------------------------------------ */
/* Hörverstehen                                                        */
/* ------------------------------------------------------------------ */

export const Speaker = z.object({
  id: z.string().regex(/^[A-Za-z0-9]+$/), // referenced by Line.s
  name: z.string().trim().optional(), // shown in transcripts, e.g. "Frau Seiffert"
  gender: z.enum(["f", "m"]),
  age: z.enum(["young", "adult", "senior"]).default("adult"),
  role: z.string().trim().optional(), // "Moderatorin", "Lautsprecheransage", …
});
export type Speaker = z.infer<typeof Speaker>;

/** A real recording shipped in /public/audio (always preferred over synthetic voices). */
const Recording = z.string().regex(/^\/audio\/[\w./-]+\.(mp3|m4a|ogg|wav)$/, "must be a file under /audio/");

/** One utterance. Keep it to 1–3 sentences so TTS and transcript highlighting stay precise. */
export const Line = z.object({ s: z.string(), t: Text });
export type Line = z.infer<typeof Line>;

/** Hören Teil 1 & Teil 3 – five short recordings, one richtig/falsch statement each. */
export const AudioShortSet = SetBase.extend({
  type: z.literal("audio-short"),
  speakers: z.array(Speaker).min(1),
  intro: z.array(Line).default([]), // e.g. radio presenter introducing a street survey (Teil 1)
  introRecording: Recording.optional(),
  items: z
    .array(
      z.object({
        n: z.number().int().min(1).max(5),
        label: z.string().trim().optional(), // revealed after submission, e.g. "Durchsage am Bahnhof"
        script: z.array(Line).min(1),
        /** Real recording of this text; the script stays the transcript. */
        recording: Recording.optional(),
        statement: Text,
        answer: z.boolean(), // true = richtig
        explanation: Text,
        explanationDe: De,
        evidence: Text, // exact substring of one script line
      }),
    )
    .length(5),
});
export type AudioShortSet = z.infer<typeof AudioShortSet>;

/** Hören Teil 2 – one long conversation/interview, ten richtig/falsch statements in order. */
export const AudioLongSet = SetBase.extend({
  type: z.literal("audio-long"),
  context: Text, // e.g. "Radiosendung „Leben in der Stadt“: Interview mit einer Tierärztin"
  speakers: z.array(Speaker).min(2),
  script: z.array(Line).min(16),
  /** Real recording of the whole conversation; the script stays the transcript. */
  recording: Recording.optional(),
  statements: z
    .array(
      z.object({
        n: z.number().int().min(1).max(10),
        text: Text,
        answer: z.boolean(),
        explanation: Text,
        explanationDe: De,
        evidence: Text, // exact substring of one script line
      }),
    )
    .length(10),
});
export type AudioLongSet = z.infer<typeof AudioLongSet>;

/* ------------------------------------------------------------------ */
/* Schriftlicher Ausdruck                                              */
/* ------------------------------------------------------------------ */

export const WritingSet = SetBase.extend({
  type: z.literal("writing-email"),
  register: z.enum(["informal", "semiformal"]),
  situation: Text, // German task framing, e.g. "Sie haben von Ihrer Freundin Lena folgende E-Mail erhalten:"
  stimulus: z.object({
    kind: z.enum(["email", "ad", "notice"]),
    from: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    body: Text, // full text, "\n" for line breaks (emails include salutation + signature)
  }),
  leitpunkte: z.array(Text).length(4),
  model: z.object({ subject: Text, text: Text }), // model answer incl. Anrede and Gruß
  modelNotes: z.array(Text).min(2), // English: what makes the model answer score well
  modelNotesDe: DeList,
  phrases: z.array(GlossaryEntry).min(4), // task-specific Redemittel
});
export type WritingSet = z.infer<typeof WritingSet>;

/* ------------------------------------------------------------------ */
/* Mündlicher Ausdruck                                                 */
/* ------------------------------------------------------------------ */

export const OpinionCard = z.object({
  name: Text,
  age: z.number().int().min(16).max(90),
  job: Text,
  quote: Text,
});
export type OpinionCard = z.infer<typeof OpinionCard>;

/** Sprechen Teil 1 – Einander kennenlernen. */
export const SpeakingIntroSet = SetBase.extend({
  type: z.literal("speaking-intro"),
  points: z.array(Text).min(5), // Stichpunkte on the task sheet
  extraTopics: z.array(Text).min(1), // extra topics the examiner may raise
  questions: z.array(z.object({ point: Text, items: z.array(Text).min(1) })).min(5),
  speakers: z.array(Speaker).min(2),
  model: z.array(Line).min(12),
  phrases: z.array(GlossaryEntry).min(6),
});
export type SpeakingIntroSet = z.infer<typeof SpeakingIntroSet>;

/** Sprechen Teil 2 – Über ein Thema sprechen (two opinion cards A/B). */
export const SpeakingTopicSet = SetBase.extend({
  type: z.literal("speaking-topic"),
  theme: Text, // "Gruppenreisen"
  medium: Text, // "in einer Zeitschrift"
  cardA: OpinionCard,
  cardB: OpinionCard,
  ideas: z.object({ pro: z.array(Text).min(3), contra: z.array(Text).min(3) }),
  questions: z.array(Text).min(3), // examiner follow-up / discussion questions
  speakers: z.array(Speaker).min(2),
  model: z.array(Line).min(14),
  phrases: z.array(GlossaryEntry).min(6),
  vocabulary: z.array(GlossaryEntry).min(5),
});
export type SpeakingTopicSet = z.infer<typeof SpeakingTopicSet>;

/** Sprechen Teil 3 – Gemeinsam etwas planen. */
export const SpeakingPlanningSet = SetBase.extend({
  type: z.literal("speaking-planning"),
  situation: Text,
  checklist: z.array(Text).min(4),
  speakers: z.array(Speaker).min(2),
  model: z.array(Line).min(16),
  phrases: z.array(GlossaryEntry).min(6),
  vocabulary: z.array(GlossaryEntry).min(5),
});
export type SpeakingPlanningSet = z.infer<typeof SpeakingPlanningSet>;

/* ------------------------------------------------------------------ */
/* Union of all exam practice sets                                     */
/* ------------------------------------------------------------------ */

export const ExamSet = z.discriminatedUnion("type", [
  HeadlineMatchingSet,
  TextMcSet,
  AdMatchingSet,
  GapMcSet,
  GapWordbankSet,
  AudioShortSet,
  AudioLongSet,
  WritingSet,
  SpeakingIntroSet,
  SpeakingTopicSet,
  SpeakingPlanningSet,
]);
export type ExamSet = z.infer<typeof ExamSet>;
export type ExamSetType = ExamSet["type"];

/* ------------------------------------------------------------------ */
/* Strategy guides (per exam part)                                     */
/* ------------------------------------------------------------------ */

export const StrategyGuide = z.object({
  partId: Text, // "lesen-1" … or "allgemein"
  title: Text,
  titleDe: De,
  summary: Text,
  summaryDe: De,
  whatIsTested: Text,
  whatIsTestedDe: De,
  steps: z.array(z.object({ title: Text, titleDe: De, detail: Text, detailDe: De })).min(3),
  traps: z.array(Text).min(3),
  trapsDe: DeList,
  timeAdvice: Text,
  timeAdviceDe: De,
  checklist: z.array(Text).min(3),
  checklistDe: DeList,
});
export type StrategyGuide = z.infer<typeof StrategyGuide>;
export const StrategyFile = z.object({ examId: ExamId, guides: z.array(StrategyGuide).min(1) });

/* ------------------------------------------------------------------ */
/* Grammar                                                             */
/* ------------------------------------------------------------------ */

export const GrammarCategory = z.enum(
  Object.keys(GRAMMAR_CATEGORIES) as [keyof typeof GRAMMAR_CATEGORIES, ...(keyof typeof GRAMMAR_CATEGORIES)[]],
);
export type GrammarCategory = z.infer<typeof GrammarCategory>;

export const SECTION_IDS = ["lesen", "sprachbausteine", "hoeren", "schreiben", "sprechen"] as const;
export const SectionId = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionId>;

/**
 * Explanation blocks. `md` supports a small Markdown subset:
 * paragraphs, **bold**, *italic*, `code`, "- " bullet lists and "1. " numbered lists.
 */
export const GrammarBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), heading: z.string().trim().optional(), headingDe: De, md: Text, mdDe: De }),
  z.object({
    type: z.literal("table"),
    heading: z.string().trim().optional(),
    headingDe: De,
    columns: z.array(Text).min(2),
    /** Only when a header contains English. */
    columnsDe: DeList,
    rows: z.array(z.array(z.string())).min(1),
    /** Only when a cell contains English: the complete rows, translated. */
    rowsDe: z.array(z.array(z.string())).optional(),
    note: z.string().trim().optional(),
    noteDe: De,
  }),
  z.object({
    type: z.literal("examples"),
    heading: z.string().trim().optional(),
    headingDe: De,
    items: z.array(z.object({ de: Text, en: Text })).min(1), // **bold** marks the focus words
  }),
  z.object({ type: z.literal("rule"), md: Text, mdDe: De }),
  z.object({ type: z.literal("tip"), md: Text, mdDe: De }),
  z.object({ type: z.literal("warning"), md: Text, mdDe: De }),
]);
export type GrammarBlock = z.infer<typeof GrammarBlock>;

export const GrammarExercise = z.discriminatedUnion("type", [
  /** `prompt` contains "___" where the answer goes. */
  z.object({
    type: z.literal("mc"),
    prompt: Text,
    options: z.array(Text).min(2).max(4),
    answer: z.number().int().min(0).max(3),
    explanation: Text,
    explanationDe: De,
  }),
  z.object({
    type: z.literal("gap"),
    prompt: Text, // contains "___"
    answers: z.array(Text).min(1), // every accepted answer
    hint: z.string().trim().optional(), // e.g. infinitive "(fahren)"
    /** Only when the hint contains English. */
    hintDe: De,
    explanation: Text,
    explanationDe: De,
  }),
  z.object({
    type: z.literal("order"),
    words: z.array(Text).min(3), // tokens in scrambled order (punctuation attached to tokens)
    answers: z.array(Text).min(1), // accepted full sentences
    explanation: Text,
    explanationDe: De,
  }),
  z.object({
    type: z.literal("transform"),
    instruction: Text, // English, e.g. "Combine with 'obwohl'."
    instructionDe: De,
    prompt: Text,
    answers: z.array(Text).min(1),
    explanation: Text,
    explanationDe: De,
  }),
]);
export type GrammarExercise = z.infer<typeof GrammarExercise>;

export const GrammarTopic = z.object({
  id: Slug,
  level: Level,
  category: GrammarCategory,
  order: z.number().int(), // sort order inside its category
  title: Text, // German, e.g. "Nebensätze mit weil, da und dass"
  titleEn: Text,
  summary: Text, // English one-liner
  summaryDe: De,
  examRelevance: z.array(SectionId).min(1),
  blocks: z.array(GrammarBlock).min(3),
  mistakes: z.array(z.object({ wrong: Text, right: Text, why: Text, whyDe: De })).min(2),
  exercises: z.array(GrammarExercise).min(8),
  related: z.array(Slug).default([]),
});
export type GrammarTopic = z.infer<typeof GrammarTopic>;

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

export const PartOfSpeech = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "preposition",
  "conjunction",
  "other",
]);

export const VocabWord = z.object({
  id: Slug, // unique across all themes, e.g. "wohnen-miete"
  de: Text, // lemma WITHOUT article: "Miete", "umziehen", "sich bewerben"
  article: z.enum(["der", "die", "das"]).optional(), // required for nouns
  plural: z.string().trim().optional(), // full plural "Mieten"; "–" if no plural
  pos: PartOfSpeech,
  forms: z.string().trim().optional(), // verbs: "zieht um – zog um – ist umgezogen"
  en: Text,
  example: Text, // German example sentence
  exampleEn: Text,
  tags: z.array(z.string()).default([]),
});
export type VocabWord = z.infer<typeof VocabWord>;

export const VocabTheme = z.object({
  id: Slug,
  level: Level,
  order: z.number().int(),
  title: Text, // German
  titleEn: Text,
  description: Text, // English
  descriptionDe: De,
  icon: Text, // lucide-react icon name, e.g. "Home"
  words: z.array(VocabWord).min(30),
});
export type VocabTheme = z.infer<typeof VocabTheme>;

/* ------------------------------------------------------------------ */
/* Redemittel (phrase banks)                                           */
/* ------------------------------------------------------------------ */

export const PhraseBank = z.object({
  id: Slug,
  order: z.number().int(),
  context: z.enum(["schreiben", "sprechen-1", "sprechen-2", "sprechen-3", "allgemein"]),
  title: Text,
  titleEn: Text,
  description: Text,
  descriptionDe: De,
  groups: z
    .array(
      z.object({
        title: Text,
        titleEn: Text,
        register: z.enum(["informal", "formal", "neutral"]).default("neutral"),
        phrases: z.array(z.object({ de: Text, en: Text, note: z.string().trim().optional(), noteDe: De })).min(3),
      }),
    )
    .min(3),
});
export type PhraseBank = z.infer<typeof PhraseBank>;

/* ------------------------------------------------------------------ */
/* Reference lists                                                     */
/* ------------------------------------------------------------------ */

const ListBase = z.object({ id: Slug, order: z.number().int(), title: Text, titleEn: Text, description: Text, descriptionDe: De });

export const VerbPrepositionList = ListBase.extend({
  kind: z.literal("verb-preposition"),
  items: z
    .array(
      z.object({
        verb: Text, // "warten", "sich freuen"
        prep: Text, // "auf"
        case: z.enum(["Akk", "Dat"]),
        en: Text,
        example: Text,
      }),
    )
    .min(30),
});

export const IrregularVerbList = ListBase.extend({
  kind: z.literal("irregular-verbs"),
  items: z
    .array(
      z.object({
        inf: Text, // "fahren"
        present: Text, // "er fährt"
        past: Text, // "er fuhr"
        perfect: Text, // "er ist gefahren"
        en: Text,
      }),
    )
    .min(30),
});

export const ConnectorList = ListBase.extend({
  kind: z.literal("connectors"),
  items: z
    .array(
      z.object({
        word: Text, // "obwohl", "sowohl … als auch"
        group: z.enum(["hauptsatz", "nebensatz", "adverb", "zweiteilig", "praeposition"]),
        meaning: Text, // English
        meaningDe: De,
        wordOrder: Text, // short English note, e.g. "verb at the end"
        wordOrderDe: De,
        example: Text,
      }),
    )
    .min(20),
});

export const PhraseList = ListBase.extend({
  kind: z.literal("phrases"), // Nomen-Verb-Verbindungen, Adjektive mit Präpositionen, …
  items: z.array(z.object({ de: Text, en: Text, example: Text })).min(20),
});

export const ReferenceList = z.discriminatedUnion("kind", [
  VerbPrepositionList,
  IrregularVerbList,
  ConnectorList,
  PhraseList,
]);
export type ReferenceList = z.infer<typeof ReferenceList>;

/* ------------------------------------------------------------------ */
/* Placement test (Einstufungstest)                                    */
/* ------------------------------------------------------------------ */

const PlacementLevel = z.enum(["A2", "B1", "B2"]);

/** Multiple choice. Grammar/vocabulary prompts contain "___" for the gap. */
export const PlacementMcItem = z.object({
  id: Slug,
  level: PlacementLevel,
  type: z.literal("mc"),
  prompt: Text,
  options: z.array(Text).min(3).max(4),
  answer: z.number().int().min(0).max(3),
  explanation: Text, // English
  explanationDe: De,
  /** Grammar topic to recommend when this item is missed. */
  grammar: Slug.optional(),
});
export type PlacementMcItem = z.infer<typeof PlacementMcItem>;

/** richtig / falsch statement about a text or recording. */
export const PlacementTfItem = z.object({
  id: Slug,
  level: PlacementLevel,
  type: z.literal("tf"),
  statement: Text,
  answer: z.boolean(),
  explanation: Text,
  explanationDe: De,
});
export type PlacementTfItem = z.infer<typeof PlacementTfItem>;

export const PlacementItem = z.discriminatedUnion("type", [PlacementMcItem, PlacementTfItem]);
export type PlacementItem = z.infer<typeof PlacementItem>;

export const PlacementSection = z.discriminatedUnion("skill", [
  z.object({ skill: z.literal("grammatik"), items: z.array(PlacementMcItem).min(8) }),
  z.object({ skill: z.literal("wortschatz"), items: z.array(PlacementMcItem).min(6) }),
  z.object({
    skill: z.literal("lesen"),
    texts: z
      .array(
        z.object({
          id: Slug,
          level: PlacementLevel,
          title: Text,
          paragraphs: z.array(Text).min(1).max(6),
          items: z.array(PlacementItem).min(2),
        }),
      )
      .min(2),
  }),
  z.object({
    skill: z.literal("hoeren"),
    recordings: z
      .array(
        z.object({
          id: Slug,
          level: PlacementLevel,
          context: Text, // German, e.g. „Ansage am Bahnhof“
          speakers: z.array(Speaker).min(1),
          script: z.array(Line).min(2),
          items: z.array(PlacementTfItem).min(1),
        }),
      )
      .min(3),
  }),
]);
export type PlacementSection = z.infer<typeof PlacementSection>;
export type PlacementSkill = PlacementSection["skill"];

export const PlacementTest = z.object({
  examId: ExamId,
  version: z.number().int().min(1),
  /** Recommended working time; the timer enforces it like every other task. */
  minutes: z.number().int().min(5).max(40),
  sections: z.array(PlacementSection).length(4),
});
export type PlacementTest = z.infer<typeof PlacementTest>;
