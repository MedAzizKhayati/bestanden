import type { PlacementItem, PlacementSkill, PlacementTest } from "@/lib/content/schemas";

export type ItemLevel = "A2" | "B1" | "B2";
/** "B1-" = on the way to B1, "B1+" = solid B1 with B2 elements. */
export type EstimatedLevel = "A1" | "A2" | "B1-" | "B1" | "B1+" | "B2";
export type Readiness = "ready" | "almost" | "notYet";

export const SKILLS: PlacementSkill[] = ["grammatik", "wortschatz", "lesen", "hoeren"];
export const LEVEL_ORDER: EstimatedLevel[] = ["A1", "A2", "B1-", "B1", "B1+", "B2"];

type Tally = Record<ItemLevel, { correct: number; total: number }>;

export interface SkillResult {
  correct: number;
  total: number;
  level: EstimatedLevel;
  byLevel: Tally;
}

export interface PlacementResult {
  id: string;
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
 * Level from the share of correct items per level band: A2 must be mostly right before B1
 * counts, and B2 items separate a solid B1 from B1+ / B2.
 */
export function estimateLevel(byLevel: Tally): EstimatedLevel {
  const pct = (l: ItemLevel) => (byLevel[l].total ? byLevel[l].correct / byLevel[l].total : null);
  const a2 = pct("A2") ?? 1;
  const b1 = pct("B1") ?? 0;
  const b2 = pct("B2");
  if (a2 < 0.5) return "A1";
  if (b1 < 0.4) return "A2";
  if (b1 < 0.6) return "B1-";
  if (b2 === null) return b1 >= 0.85 ? "B1+" : "B1";
  if (b2 >= 0.6 && b1 >= 0.8) return "B2";
  if (b2 >= 0.35) return "B1+";
  return "B1";
}

const emptyTally = (): Tally => ({ A2: { correct: 0, total: 0 }, B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 } });

export function scorePlacement(test: PlacementTest, answers: PlacementAnswers, durationSec: number, now = Date.now()): PlacementResult {
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
    skills[skill] = { correct, total: groups[skill].length, level: estimateLevel(tally), byLevel: tally };
  }
  const overall = estimateLevel(all);
  const rank = (l: EstimatedLevel) => LEVEL_ORDER.indexOf(l);
  const weakest = Math.min(...SKILLS.map((s) => rank(skills[s].level)));
  const readiness: Readiness =
    rank(overall) >= rank("B1") && weakest >= rank("B1-") ? "ready" : rank(overall) >= rank("B1-") ? "almost" : "notYet";
  return {
    id: `p-${now}`,
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
