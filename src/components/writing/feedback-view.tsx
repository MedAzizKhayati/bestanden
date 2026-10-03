"use client";

import { CheckCircle2, CircleAlert, CircleX, Sparkles, ThumbsUp, TrendingUp } from "lucide-react";
import { useState } from "react";
import { ScoreRing } from "@/components/exam/result-summary";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import type { WritingSet } from "@/lib/content/schemas";
import type { WritingRubric } from "@/lib/exams";
import type { WritingFeedback } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { highlight } from "@/lib/utils/text";

const ERROR_TONE: Record<string, string> = {
  grammar: "decoration-destructive",
  "word-order": "decoration-destructive",
  spelling: "decoration-warning",
  punctuation: "decoration-warning",
  vocabulary: "decoration-sprachbausteine",
  register: "decoration-sprechen",
  style: "decoration-primary",
};

/** The learner's own text with every reported error underlined; click to see the correction. */
export function AnnotatedText({ text, errors }: { text: string; errors: WritingFeedback["errors"] }) {
  const types: Record<string, string> = useT().writing.feedback.errorTypes;
  const segments = highlight(
    text,
    errors.map((e, i) => ({ id: String(i), quote: e.original })),
  );
  return (
    <div className="reading text-[15.5px] whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (!seg.mark) return <span key={i}>{seg.text}</span>;
        const err = errors[Number(seg.mark)];
        return (
          <Popover key={i}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-sm bg-destructive/6 underline decoration-wavy decoration-2 underline-offset-4 transition-colors hover:bg-destructive/15",
                  ERROR_TONE[err.type] ?? "decoration-destructive",
                )}
              >
                {seg.text}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-2 text-sm">
              <Badge variant="secondary" className="capitalize">
                {types[err.type] ?? err.type.replace("-", " ")}
              </Badge>
              <div>
                <span className="text-destructive line-through">{err.original}</span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className="font-semibold text-success">{err.correction}</span>
              </div>
              <p className="text-muted-foreground">{err.explanation}</p>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

export function WritingFeedbackView({
  feedback,
  text,
  subject,
  task,
  rubric,
}: {
  feedback: WritingFeedback;
  text: string;
  subject: string;
  /** The practice set – without it (e.g. an official booklet task) there is no model answer tab. */
  task?: WritingSet;
  rubric: WritingRubric;
}) {
  const t = useT();
  const locale = useLocale();
  const f = t.writing.feedback;
  const percent = Math.round((feedback.total / rubric.maxPoints) * 100);
  const [tab, setTab] = useState("annotated");
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <ScoreRing percent={percent}>
            <div>
              <div className="text-2xl font-bold tabular">{feedback.total}</div>
              <div className="text-[11px] text-muted-foreground">{f.of(rubric.maxPoints)}</div>
            </div>
          </ScoreRing>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">{f.level(feedback.level)}</Badge>
              <Badge variant="secondary">{formatNumber(percent / 100, locale, { style: "percent" })}</Badge>
              <Badge variant="outline">
                <Sparkles /> {f.estimate}
              </Badge>
            </div>
            <p className="text-[15px] leading-relaxed">{feedback.summary}</p>
          </div>
        </div>
        <div className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {feedback.criteria.map((c) => {
            const def = rubric.criteria.find((r) => r.id === c.id)!;
            return (
              <div key={c.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{f.criterionHeading(c.id, def.nameEn)}</div>
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
                  {def.name} · {c.points * rubric.multiplier} / {5 * rubric.multiplier} {t.common.pointsShort}
                </div>
                <p className="text-sm text-muted-foreground">{c.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border bg-card">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="annotated">{f.tabs.annotated(feedback.errors.length)}</TabsTrigger>
                <TabsTrigger value="corrected">{f.tabs.corrected}</TabsTrigger>
                <TabsTrigger value="improved">{f.tabs.improved}</TabsTrigger>
                {task && <TabsTrigger value="model">{f.tabs.model}</TabsTrigger>}
              </TabsList>
            </div>
            <div className="p-5 sm:p-6">
              <TabsContent value="annotated" className="space-y-3">
                {subject && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Betreff:</span> <span className="font-medium">{subject}</span>
                  </div>
                )}
                {feedback.errors.length ? (
                  <p className="text-xs text-muted-foreground">{f.clickHint}</p>
                ) : (
                  <p className="text-sm font-medium text-success">{f.noErrors}</p>
                )}
                <AnnotatedText text={text} errors={feedback.errors} />
              </TabsContent>
              <TabsContent value="corrected">
                <p className="mb-3 text-xs text-muted-foreground">{f.correctedHint}</p>
                <div className="reading text-[15.5px] whitespace-pre-wrap">{feedback.correctedText}</div>
              </TabsContent>
              <TabsContent value="improved">
                <p className="mb-3 text-xs text-muted-foreground">{f.improvedHint}</p>
                <div className="reading text-[15.5px] whitespace-pre-wrap">{feedback.improvedText}</div>
              </TabsContent>
              {task && (
                <TabsContent value="model" className="space-y-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Betreff:</span> <span className="font-medium">{task.model.subject}</span>
                  </div>
                  <div className="reading text-[15.5px] whitespace-pre-wrap">{task.model.text}</div>
                  <ul className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
                    {task.modelNotes.map((n) => (
                      <li key={n} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {n}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Leitpunkte</h3>
            <ul className="space-y-2.5">
              {feedback.leitpunkte.map((l) => (
                <li key={l.point} className="flex gap-2.5 text-sm">
                  {l.covered === "yes" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : l.covered === "partly" ? (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  ) : (
                    <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <span>
                    <span className="font-medium">{l.point}</span>
                    <span className="block text-xs text-muted-foreground">{l.comment}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ThumbsUp className="size-4 text-success" /> {f.whatWorked}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/85">
              {feedback.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h3 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> {f.nextTime}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/85">
              {feedback.improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
