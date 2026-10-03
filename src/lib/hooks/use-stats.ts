"use client";

import { useMemo } from "react";
import type { ExamDefinition } from "@/lib/exams";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress, type AttemptRecord, type WritingRecord } from "@/lib/store/progress";

const GRADE_POINTS = { A: 5, B: 3, C: 1, D: 0 } as const;

/** AI score if available, otherwise the learner's self-assessment (×3, like telc). */
export function writingPoints(w: WritingRecord): number {
  if (w.feedback) return w.feedback.total;
  const g = w.selfGrades ?? {};
  return ((g.I ? GRADE_POINTS[g.I] : 0) + (g.II ? GRADE_POINTS[g.II] : 0) + (g.III ? GRADE_POINTS[g.III] : 0)) * 3;
}

export interface PartStats {
  partId: string;
  attempts: number;
  setsDone: number;
  /** Average percentage of the last five attempts (null if none). */
  recentPercent: number | null;
  bestPercent: number | null;
  /** Share of attempts finished within the recommended time. */
  onTimeRate: number | null;
}

/** Per-part statistics for automatically scored parts plus Schreiben/Sprechen. */
export function usePartStats(exam: ExamDefinition) {
  const hydrated = useHydrated();
  const attempts = useProgress((s) => s.attempts);
  const writing = useProgress((s) => s.writing);
  const speaking = useProgress((s) => s.speaking);

  return useMemo(() => {
    const byPart = new Map<string, PartStats>();
    const parts = exam.sections.flatMap((s) => s.parts);
    for (const part of parts) {
      let list: { percent: number; setId: string; onTime: boolean }[] = [];
      if (part.items) {
        list = attempts
          .filter((a: AttemptRecord) => a.examId === exam.id && a.partId === part.id)
          .map((a) => ({ percent: a.maxPoints ? (a.points / a.maxPoints) * 100 : 0, setId: a.setId, onTime: a.overtimeSec === 0 }));
      } else if (part.sectionId === "schreiben") {
        list = writing
          .filter((w) => w.examId === exam.id && (w.feedback || w.selfGrades))
          .map((w) => ({ percent: (writingPoints(w) / 45) * 100, setId: w.setId, onTime: w.durationSec <= w.limitSec }));
      } else {
        list = speaking
          .filter((s) => s.examId === exam.id && s.partId === part.id && s.feedback)
          .map((s) => ({ percent: (s.feedback!.total / s.feedback!.maxPoints) * 100, setId: s.setId, onTime: true }));
      }
      const recent = list.slice(-5);
      byPart.set(part.id, {
        partId: part.id,
        attempts: list.length,
        setsDone: new Set(list.map((l) => l.setId)).size,
        recentPercent: recent.length ? Math.round(recent.reduce((a, b) => a + b.percent, 0) / recent.length) : null,
        bestPercent: list.length ? Math.round(Math.max(...list.map((l) => l.percent))) : null,
        onTimeRate: list.length ? Math.round((list.filter((l) => l.onTime).length / list.length) * 100) : null,
      });
    }

    // Predicted written score: recent percentage per part × that part's points.
    const writtenParts = parts.filter((p) => p.sectionId !== "sprechen");
    const known = writtenParts.filter((p) => byPart.get(p.id)?.recentPercent != null);
    const predictedWritten = known.length
      ? Math.round(known.reduce((sum, p) => sum + ((byPart.get(p.id)!.recentPercent ?? 0) / 100) * p.maxPoints, 0) * 10) / 10
      : null;
    const coveredWrittenPoints = known.reduce((s, p) => s + p.maxPoints, 0);

    return { hydrated, byPart, predictedWritten, coveredWrittenPoints };
  }, [attempts, writing, speaking, exam, hydrated]);
}
