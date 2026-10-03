"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useT } from "@/i18n/client";
import type { HeadlineMatchingSet } from "@/lib/content/schemas";
import { officialNumber } from "@/lib/exam/scoring";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Explanation, Highlighted, ItemNumber, itemState, LetterChip, ResultIcon, type PlayerProps } from "./shared";

export function HeadlineMatchingPlayer({ set, part, answers, onAnswer, review }: PlayerProps<HeadlineMatchingSet>) {
  const isDesktop = useIsDesktop();
  const t = useT();
  const m = t.runner.headlines;
  const [active, setActive] = useState<number>(() => set.texts.find((t) => !answers[t.n])?.n ?? 1);
  const [drawerFor, setDrawerFor] = useState<number | null>(null);
  const num = (n: number) => officialNumber(part, n);

  const usedBy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [n, key] of Object.entries(answers)) m[key] = Number(n);
    return m;
  }, [answers]);

  const assign = (n: number, key: string) => {
    const other = usedBy[key];
    if (other && other !== n) onAnswer(other, null);
    onAnswer(n, key);
    const next = set.texts.find((t) => t.n > n && !answers[t.n] && t.n !== other) ?? set.texts.find((t) => !answers[t.n] && t.n !== n);
    if (next) setActive(next.n);
  };

  useEffect(() => {
    if (review) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input,textarea")) return;
      const k = e.key.toLowerCase();
      if (/^[a-j]$/.test(k)) {
        e.preventDefault();
        assign(active, k);
      } else if (k === "backspace" || k === "delete") onAnswer(active, null);
      else if (k === "arrowdown" || k === "arrowright") setActive((a) => Math.min(set.texts.length, a + 1));
      else if (k === "arrowup" || k === "arrowleft") setActive((a) => Math.max(1, a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const headlineText = (key?: string) => set.headlines.find((h) => h.key === key)?.text;
  const correctFor = (n: number) => set.texts.find((t) => t.n === n)?.answer;

  const headlineList = (forText: number | null, onPick?: (key: string) => void, readOnly = false) => (
    <ul className="space-y-1.5">
      {set.headlines.map((h) => {
        const usedFor = usedBy[h.key];
        const correctText = review ? set.texts.find((t) => t.answer === h.key)?.n : undefined;
        const distractor = review ? set.distractors.find((d) => d.key === h.key) : undefined;
        const selected = forText !== null && answers[forText] === h.key;
        return (
          <li key={h.key}>
            <button
              type="button"
              disabled={!!review || readOnly}
              onClick={() => (onPick ? onPick(h.key) : assign(active, h.key))}
              className={cn(
                "group flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                !review && !readOnly && "hover:border-primary/50 hover:bg-primary/5",
                readOnly && "cursor-default disabled:opacity-100",
                selected && "border-primary bg-primary/8 ring-1 ring-primary/30",
                !review && usedFor && !selected && "bg-muted/60 text-muted-foreground",
                review && correctText && "border-success/40 bg-success/6",
                review && !correctText && "opacity-80",
              )}
            >
              <LetterChip letter={h.key} tone={review ? (correctText ? "ok" : "muted") : selected ? "selected" : usedFor ? "muted" : undefined} />
              <span className="min-w-0 flex-1">
                <span className="block leading-snug font-medium">{h.text}</span>
                {distractor && (
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {m.trap} {distractor.why}
                  </span>
                )}
              </span>
              {!review && usedFor ? (
                <span className="shrink-0 rounded-md bg-background px-1.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                  → {num(usedFor)}
                </span>
              ) : null}
              {review && correctText ? (
                <span className="shrink-0 rounded-md bg-success/15 px-1.5 py-0.5 text-[11px] font-semibold text-success">Text {num(correctText)}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <div className="space-y-4">
        {!isDesktop && (
          <details className="group rounded-xl border bg-card p-4" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
              Überschriften a–j
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3">{headlineList(null, undefined, true)}</div>
          </details>
        )}

        {set.texts.map((text) => {
          const given = answers[text.n];
          const result = review?.items.find((i) => i.n === text.n);
          const isActive = !review && active === text.n;
          return (
            <article
              key={text.n}
              id={`item-${text.n}`}
              onClick={() => !review && setActive(text.n)}
              className={cn(
                "scroll-mt-32 rounded-xl border bg-paper p-4 text-paper-foreground shadow-xs transition-shadow sm:p-5",
                isActive && "ring-2 ring-primary/40",
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <ItemNumber n={num(text.n)} state={itemState(review, text.n, !!given, isActive)} />
                <button
                  type="button"
                  disabled={!!review}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(text.n);
                    if (!isDesktop) setDrawerFor(text.n);
                  }}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-left text-sm transition-colors",
                    !review && "hover:border-primary/60 hover:bg-primary/5",
                    given && "border-solid bg-background",
                    isActive && !given && "border-primary/60 bg-primary/5",
                  )}
                >
                  {given ? (
                    <>
                      <LetterChip letter={given} tone={result ? (result.ok ? "ok" : "wrong") : "selected"} />
                      <span className="truncate font-medium">{headlineText(given)}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">{isActive ? m.chooseNow : m.choose}</span>
                  )}
                </button>
                {given && !review && (
                  <button
                    type="button"
                    aria-label={t.runner.review.clearAnswer}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswer(text.n, null);
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {result && <ResultIcon ok={result.ok} />}
              </div>
              <p className="reading">
                <Highlighted text={text.text} quotes={review ? text.evidence.map((q) => ({ id: String(text.n), quote: q })) : []} />
              </p>
              {review && result && (
                <Explanation
                  ok={result.ok}
                  className="mt-4 font-sans"
                  title={
                    result.ok ? (
                      t.common.correct
                    ) : (
                      <>
                        {t.common.correctAnswer}: <span className="uppercase">{correctFor(text.n)}</span> – {headlineText(correctFor(text.n))}
                      </>
                    )
                  }
                >
                  {text.explanation}
                </Explanation>
              )}
            </article>
          );
        })}
      </div>

      {isDesktop && (
        <aside className="lg:sticky lg:top-32 lg:max-h-[calc(100svh-9rem)] lg:overflow-y-auto lg:pb-4 scrollbar-thin">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Überschriften</h3>
              {!review && <span className="text-xs text-muted-foreground">{m.forText(num(active))}</span>}
            </div>
            {headlineList(active)}
          </div>
        </aside>
      )}

      <Drawer open={drawerFor !== null} onOpenChange={(o) => !o && setDrawerFor(null)}>
        <DrawerContent className="max-h-[85svh]">
          <DrawerHeader>
            <DrawerTitle>{drawerFor ? m.drawerTitle(num(drawerFor)) : ""}</DrawerTitle>
            <DrawerDescription>{m.drawerText}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {drawerFor !== null &&
              headlineList(drawerFor, (key) => {
                assign(drawerFor, key);
                setDrawerFor(null);
              })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
