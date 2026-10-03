"use client";

import { ScanSearch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { TextMcSet } from "@/lib/content/schemas";
import { officialNumber } from "@/lib/exam/scoring";
import { cn } from "@/lib/utils";
import { Explanation, Highlighted, ItemNumber, itemState, LetterChip, ResultIcon, type PlayerProps } from "./shared";

export function TextMcPlayer({ set, part, answers, onAnswer, review }: PlayerProps<TextMcSet>) {
  const t = useT();
  const [focusEvidence, setFocusEvidence] = useState<string | null>(null);
  const quotes = review ? set.questions.map((q) => ({ id: String(q.n), quote: q.evidence })) : [];

  const showInText = (n: number) => {
    setFocusEvidence(String(n));
    requestAnimationFrame(() =>
      document.querySelector(`[data-evidence="${n}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)]">
      <article className="rounded-xl border bg-paper p-5 text-paper-foreground shadow-xs sm:p-8">
        {set.article.source && (
          <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-paper-foreground/55 uppercase">{set.article.source}</div>
        )}
        <h2 className="font-reading text-2xl leading-tight font-bold text-balance sm:text-[1.75rem]">{set.article.headline}</h2>
        {set.article.lead && (
          <p className="reading mt-3 font-medium text-paper-foreground/85 italic">
            <Highlighted text={set.article.lead} quotes={quotes} activeId={focusEvidence} />
          </p>
        )}
        <div className="reading mt-5">
          {set.article.paragraphs.map((p, i) => (
            <p key={i}>
              <Highlighted text={p} quotes={quotes} activeId={focusEvidence} />
            </p>
          ))}
        </div>
      </article>

      <div className="space-y-3 lg:sticky lg:top-32 lg:max-h-[calc(100svh-9rem)] lg:self-start lg:overflow-y-auto lg:pb-4 scrollbar-thin">
        {set.questions.map((q) => {
          const given = answers[q.n];
          const result = review?.items.find((i) => i.n === q.n);
          return (
            <div key={q.n} id={`item-${q.n}`} className="scroll-mt-32 rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <ItemNumber n={officialNumber(part, q.n)} state={itemState(review, q.n, !!given)} />
                <p className="pt-0.5 leading-snug font-medium">{q.stem}</p>
              </div>
              <div className="mt-3 space-y-1.5" role="radiogroup" aria-label={`Aufgabe ${officialNumber(part, q.n)}`}>
                {q.options.map((o) => {
                  const selected = given === o.key;
                  const isCorrect = review && q.answer === o.key;
                  const isWrong = review && selected && !isCorrect;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!!review}
                      onClick={() => onAnswer(q.n, selected ? null : o.key)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm leading-snug transition-all",
                        !review && "hover:border-primary/50 hover:bg-primary/5",
                        selected && !review && "border-primary bg-primary/8 ring-1 ring-primary/30",
                        isCorrect && "border-success/50 bg-success/8",
                        isWrong && "border-destructive/40 bg-destructive/6",
                      )}
                    >
                      <LetterChip letter={o.key} tone={isCorrect ? "ok" : isWrong ? "wrong" : selected ? "selected" : undefined} />
                      <span className="pt-0.5">{o.text}</span>
                    </button>
                  );
                })}
              </div>
              {review && result && (
                <div className="mt-3 space-y-2">
                  <Explanation
                    ok={result.ok}
                    title={
                      <span className="flex items-center gap-2">
                        <ResultIcon ok={result.ok} />
                        {result.ok ? t.common.correct : `${t.common.correctAnswer}: ${q.answer}`}
                      </span>
                    }
                  >
                    {q.explanation}
                  </Explanation>
                  <Button variant="ghost" size="sm" onClick={() => showInText(q.n)}>
                    <ScanSearch /> {t.runner.textMc.showInText}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
