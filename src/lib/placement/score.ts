import type { PlacementItem, PlacementSkill, PlacementTest } from "@/lib/content/schemas";

export type ItemLevel = "A2" | "B1" | "B2" | "C1";
/** "B1-" = on the way to B1, "B1+" = solid B1 with B2 elements (same for B2). */
export type EstimatedLevel = "A1" | "A2" | "B1-" | "B1" | "B1+" | "B2-" | "B2" | "B2+" | "C1";
export type Readiness = "ready" | "almost" | "notYet";

export const SKILLS: PlacementSkill[] = ["grammatik", "wortschatz", "lesen", "hoeren"];
export const LEVEL_ORDER: EstimatedLevel[] = ["A1", "A2", "B1-", "B1", "B1+", "B2-", "B2", "B2+", "C1"];

/** The item levels of a test: one below the exam level, the exam level, one above. */
export type Bands = [ItemLevel, ItemLevel, ItemLevel];
export const B1_BANDS: Bands = ["A2", "B1", "B2"];
export const B2_BANDS: Bands = ["B1", "B2", "C1"];
export const bandsFor = (examId: string): Bands => (examId === "telc-b2" ? B2_BANDS : B1_BANDS);

const BELOW: Record<ItemLevel, EstimatedLevel> = { A2: "A1", B1: "A2", B2: "B1", C1: "B2" };

type Tally = Record<ItemLevel, { correct: number; total: number }>;

export interface SkillResult {
  correct: number;
  total: number;
  level: EstimatedLevel;
  byLevel: Tally;
}

export interface PlacementResult {
  id: string;
  /** The exam whose level check this was (older results: telc B1). */
  examId?: string;
  at: number;
  version: number;
  durationSec: number;
  skills: Record<PlacementSkill, SkillResult>;
  overall: EstimatedLevel;
  readiness: Readiness;
  /** Grammar topics of missed grammar items, most frequent first. */
  missedGrammar: string[];
}

/** Answers: item id → option index (mc) or "r" / "f" (tf). */
export type PlacementAnswers = Record<string, number | "r" | "f">;

export function itemsBySkill(test: PlacementTest): Record<PlacementSkill, PlacementItem[]> {
  const out = { grammatik: [], wortschatz: [], lesen: [], hoeren: [] } as Record<PlacementSkill, PlacementItem[]>;
  for (const s of test.sections) {
    if (s.skill === "grammatik" || s.skill === "wortschatz") out[s.skill].push(...s.items);
    else if (s.skill === "lesen") for (const t of s.texts) out.lesen.push(...t.items);
    else for (const r of s.recordings) out.hoeren.push(...r.items);
  }
  return out;
}

export function isCorrect(item: PlacementItem, answer: number | "r" | "f" | undefined): boolean {
  if (answer === undefined) return false;
  return item.type === "mc" ? answer === item.answer : answer === (item.answer ? "r" : "f");
}

/**
 * Level from the share of correct items per level band (B1 test: A2/B1/B2, B2 test: B1/B2/C1): the lower
 * band must be mostly right before the exam level counts, and the upper band separates a solid level from "+".
 */
export function estimateLevel(byLevel: Tally, bands: Bands = B1_BANDS): EstimatedLevel {
  const [lowLevel, target, high] = bands;
  const pct = (l: ItemLevel) => (byLevel[l].total ? byLevel[l].correct / byLevel[l].total : null);
  const low = pct(lowLevel) ?? 1;
  const mid = pct(target) ?? 0;
  const up = pct(high);
  const minus = `${target}-` as EstimatedLevel;
  const plus = `${target}+` as EstimatedLevel;
  if (low < 0.5) return BELOW[lowLevel];
  if (mid < 0.4) return lowLevel as EstimatedLevel;
  if (mid < 0.6) return minus;
  if (up === null) return mid >= 0.85 ? plus : (target as EstimatedLevel);
  if (up >= 0.6 && mid >= 0.8) return high as EstimatedLevel;
  if (up >= 0.35) return plus;
  return target as EstimatedLevel;
}

const emptyTally = (): Tally => ({
  A2: { correct: 0, total: 0 },
  B1: { correct: 0, total: 0 },
  B2: { correct: 0, total: 0 },
  C1: { correct: 0, total: 0 },
});

export function scorePlacement(test: PlacementTest, answers: PlacementAnswers, durationSec: number, now = Date.now()): PlacementResult {
  const bands = bandsFor(test.examId);
  const groups = itemsBySkill(test);
  const all = emptyTally();
  const skills = {} as Record<PlacementSkill, SkillResult>;
  const missed = new Map<string, number>();
  for (const skill of SKILLS) {
    const tally = emptyTally();
    let correct = 0;
    for (const item of groups[skill]) {
      const ok = isCorrect(item, answers[item.id]);
      tally[item.level].total++;
      all[item.level].total++;
      if (ok) {
        correct++;
        tally[item.level].correct++;
        all[item.level].correct++;
      } else if (item.type === "mc" && item.grammar) missed.set(item.grammar, (missed.get(item.grammar) ?? 0) + 1);
    }
    skills[skill] = { correct, total: groups[skill].length, level: estimateLevel(tally, bands), byLevel: tally };
  }
  const overall = estimateLevel(all, bands);
  const rank = (l: EstimatedLevel) => LEVEL_ORDER.indexOf(l);
  const weakest = Math.min(...SKILLS.map((s) => rank(skills[s].level)));
  const target = bands[1] as EstimatedLevel;
  const minus = `${bands[1]}-` as EstimatedLevel;
  const readiness: Readiness =
    rank(overall) >= rank(target) && weakest >= rank(minus) ? "ready" : rank(overall) >= rank(minus) ? "almost" : "notYet";
  return {
    id: `p-${now}`,
    examId: test.examId,
    at: now,
    version: test.version,
    durationSec: Math.round(durationSec),
    skills,
    overall,
    readiness,
    missedGrammar: [...missed.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
  };
}

/** Skills ordered from weakest to strongest (ties: lower share of correct answers first). */
export function weakestSkills(result: PlacementResult): PlacementSkill[] {
  const rank = (s: PlacementSkill) => LEVEL_ORDER.indexOf(result.skills[s].level);
  const share = (s: PlacementSkill) => result.skills[s].correct / Math.max(1, result.skills[s].total);
  return [...SKILLS].sort((a, b) => rank(a) - rank(b) || share(a) - share(b));
}
