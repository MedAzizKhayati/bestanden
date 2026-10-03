"use client";

import { Check, Info, Lightbulb, X } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import type { GlossaryEntry } from "@/lib/content/schemas";
import type { ScoreResult } from "@/lib/exam/scoring";
import type { PartDefinition } from "@/lib/exams";
import type { Answers } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { highlight } from "@/lib/utils/text";

export interface PlayerProps<S> {
  set: S;
  part: PartDefinition;
  answers: Answers;
  onAnswer: (n: number, value: string | null) => void;
  review: ScoreResult | null;
}

export function ItemNumber({ n, state, className }: { n: number; state?: "ok" | "wrong" | "active" | "done"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1.5 text-[13px] font-semibold tabular",
        !state && "bg-muted text-muted-foreground",
        state === "done" && "bg-primary/12 text-primary",
        state === "active" && "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
        state === "ok" && "bg-success/15 text-success",
        state === "wrong" && "bg-destructive/12 text-destructive",
        className,
      )}
    >
      {n}
    </span>
  );
}

export function LetterChip({ letter, tone, className }: { letter: string; tone?: "ok" | "wrong" | "selected" | "muted"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-6 shrink-0 place-items-center rounded-md border text-xs font-bold uppercase",
        !tone && "border-border bg-background text-foreground",
        tone === "selected" && "border-primary bg-primary text-primary-foreground",
        tone === "ok" && "border-success/40 bg-success/15 text-success",
        tone === "wrong" && "border-destructive/40 bg-destructive/10 text-destructive",
        tone === "muted" && "border-transparent bg-muted text-muted-foreground",
        className,
      )}
    >
      {letter}
    </span>
  );
}

export function ResultIcon({ ok, className }: { ok: boolean; className?: string }) {
  return ok ? (
    <span className={cn("inline-grid size-5 place-items-center rounded-full bg-success text-success-foreground", className)}>
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-grid size-5 place-items-center rounded-full bg-destructive text-white", className)}>
      <X className="size-3.5" strokeWidth={3} />
    </span>
  );
}

export function Explanation({ ok, children, title, className }: { ok?: boolean; children: ReactNode; title?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
        ok === undefined && "border-border bg-muted/50",
        ok === true && "border-success/30 bg-success/7",
        ok === false && "border-destructive/25 bg-destructive/6",
        className,
      )}
    >
      <span className={cn("mt-0.5", ok === true ? "text-success" : ok === false ? "text-destructive" : "text-muted-foreground")}>
        {ok === undefined ? <Info className="size-4" /> : <Lightbulb className="size-4" />}
      </span>
      <div className="min-w-0 space-y-1">
        {title && <div className="font-medium">{title}</div>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

/** Render text with highlighted evidence quotes (review mode). */
export function Highlighted({ text, quotes, activeId }: { text: string; quotes: { id: string; quote: string }[]; activeId?: string | null }) {
  if (!quotes.length) return <>{text}</>;
  return (
    <>
      {highlight(text, quotes).map((seg, i) =>
        seg.mark ? (
          <mark
            key={i}
            data-evidence={seg.mark}
            className={cn("evidence transition-shadow", activeId === seg.mark && "ring-2 ring-warning")}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function Glossary({ items }: { items: GlossaryEntry[] }) {
  const t = useT();
  if (!items.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{t.runner.glossary.title}</h3>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((g) => (
          <div key={g.de} className="flex items-baseline justify-between gap-3 border-b border-dashed pb-1.5 text-sm">
            <dt className="font-medium">{g.de}</dt>
            <dd className="text-right text-muted-foreground">{g.en}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function itemState(review: ScoreResult | null, n: number, answered: boolean, active?: boolean) {
  if (review) return review.items.find((i) => i.n === n)?.ok ? "ok" : "wrong";
  if (active) return "active";
  return answered ? "done" : undefined;
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export type { Answers };
