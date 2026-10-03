"use client";

import { AlarmClockOff, ArrowRight, CircleCheck, Clock, RotateCcw, Target, Trophy } from "lucide-react";
import Link from "@/i18n/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { verdict, type ScoreResult } from "@/lib/exam/scoring";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/time";

export function ScoreRing({ percent, size = 112, stroke = 10, className, children }: { percent: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const locale = useLocale();
  const v = verdict(percent, locale);
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, percent) / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-out",
            v.tone === "success" ? "stroke-success" : v.tone === "warning" ? "stroke-warning" : "stroke-destructive",
          )}
        />
        {/* 60 % pass mark */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke + 4} strokeDasharray={`2 ${c}`} strokeDashoffset={-c * 0.6} className="stroke-foreground/50" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ResultSummary({
  result,
  durationSec,
  limitSec,
  autoSubmitted,
  best,
  attempts,
  onRetry,
  nextHref,
  partHref,
}: {
  result: ScoreResult;
  durationSec: number;
  limitSec: number;
  autoSubmitted: boolean;
  best?: number;
  attempts: number;
  onRetry: () => void;
  nextHref?: string;
  partHref: string;
}) {
  const locale = useLocale();
  const t = useT();
  const r = t.runner.result;
  const v = verdict(result.percent, locale);
  const overtime = Math.max(0, durationSec - limitSec);
  const improved = best !== undefined && result.points > best;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
        <ScoreRing percent={result.percent}>
          <div>
            <div className="text-2xl font-bold tabular">{t.exam.percent(result.percent)}</div>
            <div className="text-[11px] text-muted-foreground">{r.passMark(t.exam.percent(60))}</div>
          </div>
        </ScoreRing>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div
              className={cn(
                "text-xs font-semibold tracking-wider uppercase",
                v.tone === "success" ? "text-success" : v.tone === "warning" ? "text-warning" : "text-destructive",
              )}
            >
              {v.label}
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {r.points(formatPoints(result.points, locale), result.maxPoints)}
            </div>
            <div className="text-sm text-muted-foreground">
              {r.correctOf(result.correct, result.total)}
              {improved && <span className="ml-2 font-medium text-success">{r.newBest}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Stat
              icon={<Clock className="size-3.5" />}
              label={r.timeOf(formatDuration(durationSec, locale), t.common.minutes(Math.round(limitSec / 60)))}
              tone={overtime ? "warn" : "ok"}
            />
            {overtime > 0 && <Stat icon={<AlarmClockOff className="size-3.5" />} label={r.overtime(formatDuration(overtime, locale))} tone="warn" />}
            {autoSubmitted && <Stat icon={<AlarmClockOff className="size-3.5" />} label={r.autoSubmitted} tone="warn" />}
            {best !== undefined && <Stat icon={<Trophy className="size-3.5" />} label={r.bestBefore(formatPoints(best, locale))} />}
            <Stat icon={<Target className="size-3.5" />} label={r.attempt(attempts)} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3 sm:px-6">
        <Button onClick={onRetry} variant="outline">
          <RotateCcw /> {t.common.tryAgain}
        </Button>
        {nextHref ? (
          <Button asChild>
            <Link href={nextHref}>
              {r.nextSet} <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href={partHref}>
              <CircleCheck /> {r.allSets}
            </Link>
          </Button>
        )}
        {result.correct < result.total && (
          <span className="ml-auto text-xs text-muted-foreground">{r.addedToTrainer}</span>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, tone }: { icon: ReactNode; label: string; tone?: "ok" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "warn" ? "border-warning/40 bg-warning/10" : "bg-background",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

/**
 * 12.5 → "12.5" (en) / "12,5" (de). Without a locale it keeps the old behaviour (always a decimal comma),
 * so callers that don't pass one yet are unchanged.
 */
export function formatPoints(p: number, locale?: Locale) {
  if (Number.isInteger(p)) return String(p);
  return locale ? formatNumber(p, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : p.toFixed(1).replace(".", ",");
}
