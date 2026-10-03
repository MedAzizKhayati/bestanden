import type { ExamId, ExamSetType, Level, SectionId } from "@/lib/content/schemas";

export interface AudioFlow {
  /** How many times each recording is played in the real exam. */
  plays: 1 | 2;
  /** Reading time before the first recording starts. */
  readingSeconds: number;
  /** Silence between the first and the second play (plays = 2). */
  repeatPauseSeconds: number;
  /** Silence after each item (Teil 1/3) so the candidate can mark the answer. */
  itemPauseSeconds: number;
  /** Time after the last recording before answers lock. */
  answerSeconds: number;
  /** Teil 3: every item is played twice right away, with the statement read before it. */
  perItem: boolean;
}

export interface SpeakingFlow {
  /** Approximate length of this part in the real exam. */
  minutes: number;
  /** Target length of the candidate's own monologue turn, if any. */
  monologueSeconds?: number;
}

export interface PartDefinition {
  id: string; // "lesen-1"
  sectionId: SectionId;
  slug: string; // URL segment, "teil-1"
  teil: number;
  name: string; // German skill name, "Globalverstehen"
  nameEn: string;
  setType: ExamSetType;
  items: number; // scored items (0 for productive skills)
  firstItem: number; // official numbering of the first item on the answer sheet
  pointsPerItem: number;
  maxPoints: number;
  /** Recommended working time. Timers enforce this. */
  minutes: number;
  instruction: string; // German, as phrased in the exam
  instructionEn: string;
  description: string; // English: what this part tests
  audio?: AudioFlow;
  speaking?: SpeakingFlow;
}

export interface SectionDefinition {
  id: SectionId;
  name: string; // "Leseverstehen"
  short: string; // "Lesen"
  nameEn: string; // "Reading"
  description: string;
  maxPoints: number;
  /** Official time for the section. Lesen and Sprachbausteine share one 90-minute block. */
  minutes: number;
  timeNote?: string;
  parts: PartDefinition[];
}

export interface RubricBand {
  grade: "A" | "B" | "C" | "D";
  points: number;
  descriptor: string; // English
}

export interface RubricCriterion {
  id: string;
  name: string; // German name
  nameEn: string;
  assesses: string[]; // English bullet points
  bands: RubricBand[];
}

export interface WritingRubric {
  criteria: RubricCriterion[];
  multiplier: number; // telc multiplies the raw sum by 3
  maxPoints: number;
  notes: string[];
}

export interface SpeakingRubric {
  /** Same four criteria for every part; points differ per part. */
  criteria: { id: string; name: string; nameEn: string; assesses: string[]; descriptors: Record<"A" | "B" | "C" | "D", string> }[];
  /** points[partId][criterionId][grade] */
  points: Record<string, Record<string, Record<"A" | "B" | "C" | "D", number>>>;
  maxPoints: number;
}

export interface GradeBand {
  min: number;
  label: string;
  labelEn: string;
}

export interface ExamDefinition {
  id: ExamId;
  slug: string; // URL segment
  name: string; // "telc Deutsch B1"
  alias?: string; // "Zertifikat Deutsch"
  level: Level;
  description: string;
  written: { maxPoints: number; passPoints: number; minutes: number };
  oral: { maxPoints: number; passPoints: number; minutes: number; prepMinutes: number };
  totalPoints: number;
  grades: GradeBand[];
  sections: SectionDefinition[];
  writingRubric: WritingRubric;
  speakingRubric: SpeakingRubric;
}

/** Exams shown in the level switcher before their content exists. */
export interface PlannedExam {
  slug: string;
  name: string;
  level: Level;
  status: "preparing" | "planned";
}
