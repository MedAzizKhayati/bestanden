"use client";

import { TrendingUp } from "lucide-react";
import Link from "@/i18n/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { gradeFor } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { usePartStats } from "@/lib/hooks/use-stats";
import { cn } from "@/lib/utils";

export function PredictedScore({ examSlug, compact }: { examSlug: string; compact?: boolean }) {
  const exam = useExam(examSlug);
  const t = useT();
  const m = t.exam.predicted;
  const { predictedWritten, coveredWrittenPoints, hydrated } = usePartStats(exam);
  const written = exam.written;
  const coverage = Math.round((coveredWrittenPoints / written.maxPoints) * 100);

  if (!hydrated) return <div className="h-40 animate-pulse rounded-2xl border bg-card" />;

  if (predictedWritten === null) {
    return (
      <div className={cn("rounded-2xl border bg-card p-5", compact && "p-4")}>
        <div className="flex items-center gap-2 font-semibold">
          <TrendingUp className="size-4 text-primary" /> {m.emptyTitle}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{m.emptyText}</p>
      </div>
    );
  }

  // Scale the known parts up to a full written exam for the estimate.
  const scaled = coveredWrittenPoints ? (predictedWritten / coveredWrittenPoints) * written.maxPoints : 0;
  const pass = scaled >= written.passPoints;
  const pct = Math.round((scaled / written.maxPoints) * 100);
  const passPct = (written.passPoints / written.maxPoints) * 100;
  const grade = gradeFor(exam, scaled + (scaled / written.maxPoints) * exam.oral.maxPoints);

  return (
    <div className={cn("rounded-2xl border bg-card p-5", compact && "p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <TrendingUp className="size-4 text-primary" /> {m.title}
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", pass ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
          {pass ? m.onTrack : m.below}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight tabular">{Math.round(scaled)}</span>
        <span className="text-muted-foreground">{m.outOf(written.maxPoints)}</span>
      </div>
      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", pass ? "bg-success" : "bg-warning")} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${passPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{m.basedOn(t.exam.percent(coverage))}</span>
        <span className="shrink-0">{m.pass(written.passPoints)}</span>
      </div>
      {!compact && (
        <p className="mt-3 text-sm text-muted-foreground">
          {m.gradeLead} <strong className="text-foreground">„{grade.label}“</strong>. {m.gradeRest}
        </p>
      )}
      {!compact && (
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={`/${exam.slug}/modelltest`}>{m.takeMock}</Link>
        </Button>
      )}
    </div>
  );
}
