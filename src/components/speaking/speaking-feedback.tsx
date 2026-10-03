"use client";

import { ArrowRight, Info, Sparkles, ThumbsUp, TrendingUp } from "lucide-react";
import { ScoreRing } from "@/components/exam/result-summary";
import { Badge } from "@/components/ui/badge";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import type { SpeakingRubric } from "@/lib/exams";
import type { SpeakingFeedback } from "@/lib/store/progress";
import { cn } from "@/lib/utils";

export function SpeakingFeedbackView({ feedback, rubric, partId }: { feedback: SpeakingFeedback; rubric: SpeakingRubric; partId: string }) {
  const t = useT();
  const locale = useLocale();
  const f = t.speaking.feedback;
  const percent = Math.round((feedback.total / feedback.maxPoints) * 100);
  const pronunciationMax = rubric.points[partId]?.aussprache.A ?? 0;
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <ScoreRing percent={percent}>
            <div>
              <div className="text-2xl font-bold tabular">{feedback.total}</div>
              <div className="text-[11px] text-muted-foreground">{f.of(feedback.maxPoints)}</div>
            </div>
          </ScoreRing>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Sparkles /> {f.estimate}
              </Badge>
              <Badge variant="secondary">{formatNumber(percent / 100, locale, { style: "percent" })}</Badge>
            </div>
            <p className="text-[15px] leading-relaxed">{feedback.summary}</p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {f.pronunciation(pronunciationMax)}
            </p>
          </div>
        </div>
        <div className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {feedback.criteria.map((c) => {
            const def = rubric.criteria.find((r) => r.id === c.id);
            return (
              <div key={c.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {(locale === "en" ? def?.nameEn : def?.name) ?? c.id}
                  </span>
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg text-sm font-bold",
                      c.grade === "A" && "bg-success/15 text-success",
                      c.grade === "B" && "bg-primary/12 text-primary",
                      c.grade === "C" && "bg-warning/15 text-warning-foreground dark:text-warning",
                      c.grade === "D" && "bg-destructive/12 text-destructive",
                    )}
                  >
                    {c.grade}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {/* The German UI already shows the German name in the heading. */}
                  {locale === "en" && <>{def?.name} · </>}
                  {c.points} {t.common.pointsShort}
                </div>
                <p className="text-sm text-muted-foreground">{c.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {feedback.corrections.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">{f.corrections}</h3>
            <ul className="space-y-3">
              {feedback.corrections.map((c, i) => (
                <li key={i} className="text-sm">
                  <div>
                    <span className="text-destructive line-through decoration-destructive/60">{c.original}</span>
                  </div>
                  <div className="flex items-start gap-1.5 font-medium text-success">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0" /> {c.correction}
                  </div>
                  <div className="text-muted-foreground">{c.explanation}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-5">
          {feedback.betterPhrases.length > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">{f.betterPhrases}</h3>
              <ul className="space-y-2 text-sm">
                {feedback.betterPhrases.map((p, i) => (
                  <li key={i} className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-muted-foreground">{f.insteadOf(p.instead)}</div>
                    <div className="font-medium">{f.tryThis(p.try)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ThumbsUp className="size-4 text-success" /> {f.whatWorked}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h3 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> {f.nextTime}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.nextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
