"use client";

import { BookMarked } from "lucide-react";
import { useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { GapMcSet } from "@/lib/content/schemas";
import { officialNumber } from "@/lib/exam/scoring";
import { cn } from "@/lib/utils";
import { GapText } from "./gap-text";
import { Explanation, ItemNumber, itemState, LetterChip, ResultIcon, type PlayerProps } from "./shared";

const KEY_TO_OPTION: Record<string, string> = { "1": "a", "2": "b", "3": "c", a: "a", b: "b", c: "c" };

export function GapMcPlayer({ set, part, answers, onAnswer, review }: PlayerProps<GapMcSet>) {
  const t = useT();
  const rv = t.runner.review;
  const [open, setOpen] = useState<number | null>(null);
  const num = (n: number) => officialNumber(part, n);
  const gap = (n: number) => set.gaps.find((g) => g.n === n)!;
  const optionText = (n: number, key?: string) => gap(n).options.find((o) => o.key === key)?.text;

  const choose = (n: number, key: string) => {
    onAnswer(n, answers[n] === key && !review ? null : key);
    setOpen(null);
    requestAnimationFrame(() => (document.querySelector(`[data-gap="${n + 1}"]`) as HTMLElement | null)?.focus());
  };

  const renderGap = (n: number) => {
    const given = answers[n];
    const result = review?.items.find((i) => i.n === n);
    const g = gap(n);
    return (
      <Popover open={open === n} onOpenChange={(o) => setOpen(o ? n : null)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-gap={n}
            onKeyDown={(e) => {
              const k = KEY_TO_OPTION[e.key.toLowerCase()];
              if (k && !review) {
                e.preventDefault();
                choose(n, k);
              }
            }}
            className={cn(
              "mx-0.5 inline-flex items-baseline gap-1.5 rounded-md border px-1.5 py-0 align-baseline font-sans text-[0.92em] leading-normal transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              !given && "border-dashed border-primary/50 bg-primary/5 text-primary",
              given && !review && "border-primary/30 bg-primary/10 font-semibold text-primary",
              result?.ok && "border-success/40 bg-success/12 font-semibold text-success",
              result && !result.ok && "border-destructive/40 bg-destructive/10 font-semibold text-destructive",
            )}
          >
            <span className="text-[0.78em] font-bold opacity-70 tabular">{num(n)}</span>
            <span className={cn(!given && "min-w-10")}>{given ? optionText(n, given) : "……"}</span>
            {result && !result.ok && <span className="text-success">→ {optionText(n, g.answer)}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2">
          {review && result ? (
            <div className="space-y-2 p-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ResultIcon ok={result.ok} /> {result.ok ? t.common.correct : `${t.common.correctAnswer}: ${g.answer}) ${optionText(n, g.answer)}`}
              </div>
              <p className="text-sm text-foreground/85">{g.explanation}</p>
              {g.grammar && (
                <Link href={`/grammatik/${g.grammar}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <BookMarked className="size-3.5" /> {rv.reviewGrammar}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">{t.runner.gaps.hint(num(n))}</div>
              {g.options.map((o, i) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => choose(n, o.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                    given === o.key && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  <LetterChip letter={o.key} tone={given === o.key ? "selected" : undefined} />
                  <span className="flex-1">{o.text}</span>
                  <kbd className="text-[10px] text-muted-foreground">{i + 1}</kbd>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
      <div className="space-y-4">
        <div className="rounded-xl border bg-paper p-5 text-paper-foreground shadow-xs sm:p-8">
          <GapText text={set.text} renderGap={renderGap} className="reading" />
        </div>
        {review && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{rv.explanations}</h3>
            {set.gaps.map((g) => {
              const result = review.items.find((i) => i.n === g.n)!;
              return (
                <Explanation
                  key={g.n}
                  ok={result.ok}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <ItemNumber n={num(g.n)} state={result.ok ? "ok" : "wrong"} className="h-6 min-w-6 text-xs" />
                      {optionText(g.n, g.answer)}
                      {!result.ok && result.given && <span className="text-destructive line-through">{optionText(g.n, result.given)}</span>}
                    </span>
                  }
                >
                  {g.explanation}{" "}
                  {g.grammar && (
                    <Link href={`/grammatik/${g.grammar}`} className="font-medium text-primary hover:underline">
                      {rv.grammar} →
                    </Link>
                  )}
                </Explanation>
              );
            })}
          </div>
        )}
      </div>

      <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Antwortbogen</h3>
          <ol className="space-y-1.5">
            {set.gaps.map((g) => {
              const given = answers[g.n];
              const result = review?.items.find((i) => i.n === g.n);
              return (
                <li key={g.n} className="flex items-center gap-2">
                  <ItemNumber n={num(g.n)} state={itemState(review, g.n, !!given)} className="h-6 min-w-7 text-xs" />
                  <div className="flex flex-1 gap-1">
                    {g.options.map((o) => {
                      const selected = given === o.key;
                      const correct = review && g.answer === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          disabled={!!review}
                          title={o.text}
                          onClick={() => choose(g.n, o.key)}
                          className={cn(
                            "min-w-0 flex-1 truncate rounded-md border px-1.5 py-1 text-xs transition-colors",
                            !review && "hover:border-primary/50",
                            selected && !review && "border-primary bg-primary text-primary-foreground",
                            correct && "border-success/50 bg-success/15 font-semibold text-success",
                            review && selected && !correct && "border-destructive/40 bg-destructive/10 text-destructive line-through",
                          )}
                        >
                          {o.text}
                        </button>
                      );
                    })}
                  </div>
                  {result && <ResultIcon ok={result.ok} className="size-4" />}
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
