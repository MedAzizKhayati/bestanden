"use client";

import { BookMarked } from "lucide-react";
import { useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { GapWordbankSet } from "@/lib/content/schemas";
import { officialNumber } from "@/lib/exam/scoring";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { GapText } from "./gap-text";
import { Explanation, ItemNumber, LetterChip, type PlayerProps } from "./shared";

export function GapWordbankPlayer({ set, part, answers, onAnswer, review }: PlayerProps<GapWordbankSet>) {
  const isDesktop = useIsDesktop();
  const t = useT();
  const m = t.runner.gaps;
  const leftOver = set.words.length - set.gaps.length;
  const [active, setActive] = useState<number>(() => set.gaps.find((g) => !answers[g.n])?.n ?? 1);
  const [drawerFor, setDrawerFor] = useState<number | null>(null);
  const num = (n: number) => officialNumber(part, n);
  const word = (key?: string) => set.words.find((w) => w.key === key)?.text;

  const usedBy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [n, key] of Object.entries(answers)) m[key] = Number(n);
    return m;
  }, [answers]);

  const assign = (n: number, key: string) => {
    const other = usedBy[key];
    if (other && other !== n) onAnswer(other, null);
    onAnswer(n, key);
    const next = set.gaps.find((g) => g.n > n && !answers[g.n] && g.n !== other) ?? set.gaps.find((g) => !answers[g.n] && g.n !== n);
    if (next) setActive(next.n);
  };

  useEffect(() => {
    if (review) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input,textarea")) return;
      const k = e.key.toLowerCase();
      if (/^[a-o]$/.test(k)) {
        e.preventDefault();
        assign(active, k);
      } else if (k === "backspace" || k === "delete") onAnswer(active, null);
      else if (k === "tab" && !e.shiftKey) {
        e.preventDefault();
        setActive((a) => (a % set.gaps.length) + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const renderGap = (n: number) => {
    const given = answers[n];
    const result = review?.items.find((i) => i.n === n);
    const correct = set.gaps.find((g) => g.n === n)!.answer;
    const isActive = !review && active === n;
    return (
      <button
        type="button"
        disabled={!!review}
        onClick={() => {
          setActive(n);
          if (!isDesktop) setDrawerFor(n);
        }}
        className={cn(
          "mx-0.5 inline-flex items-baseline gap-1.5 rounded-md border px-1.5 align-baseline font-sans text-[0.92em] leading-normal transition-all disabled:cursor-default",
          !given && "border-dashed border-primary/50 bg-primary/5 text-primary",
          given && !review && "border-primary/30 bg-primary/10 font-semibold text-primary",
          isActive && "ring-2 ring-primary/50",
          result?.ok && "border-success/40 bg-success/12 font-semibold text-success",
          result && !result.ok && "border-destructive/40 bg-destructive/10 font-semibold text-destructive",
        )}
      >
        <span className="text-[0.78em] font-bold opacity-70 tabular">{num(n)}</span>
        <span className={cn(!given && "min-w-10")}>{given ? word(given) : "……"}</span>
        {result && !result.ok && <span className="text-success">→ {word(correct)}</span>}
      </button>
    );
  };

  const wordBank = (forGap: number | null, onPick?: (key: string) => void) => (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
      {set.words.map((w) => {
        const usedFor = usedBy[w.key];
        const isAnswer = review && set.gaps.some((g) => g.answer === w.key);
        const selected = forGap !== null && answers[forGap] === w.key;
        return (
          <button
            key={w.key}
            type="button"
            disabled={!!review}
            onClick={() => (onPick ? onPick(w.key) : assign(active, w.key))}
            className={cn(
              "relative flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[13px] font-semibold tracking-wide uppercase transition-all",
              !review && "hover:border-primary/50 hover:bg-primary/5",
              selected && "border-primary bg-primary/10 text-primary",
              !review && usedFor && !selected && "bg-muted/70 text-muted-foreground",
              review && (isAnswer ? "border-success/40 bg-success/7" : "opacity-50"),
            )}
          >
            <LetterChip letter={w.key} tone={selected ? "selected" : usedFor && !review ? "muted" : isAnswer ? "ok" : undefined} className="size-5 text-[10px]" />
            <span className="min-w-0 truncate">{w.text}</span>
            {!review && usedFor ? <span className="ml-auto text-[10px] font-bold text-primary tabular normal-case">{num(usedFor)}</span> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      <div className="space-y-4">
        {set.stimulus && (
          <div className="mx-auto max-w-md rounded-md border-2 border-paper-foreground/70 bg-paper p-4 text-center text-paper-foreground">
            <div className="font-reading text-lg font-bold">{set.stimulus.heading}</div>
            {set.stimulus.lines.map((l, i) => (
              <div key={i} className="text-sm">
                {l}
              </div>
            ))}
          </div>
        )}
        <div className="rounded-xl border bg-paper p-5 text-paper-foreground shadow-xs sm:p-8">
          <GapText text={set.text} renderGap={renderGap} className="reading" />
        </div>
        {review && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t.runner.review.explanations}</h3>
            {set.gaps.map((g) => {
              const result = review.items.find((i) => i.n === g.n)!;
              return (
                <Explanation
                  key={g.n}
                  ok={result.ok}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <ItemNumber n={num(g.n)} state={result.ok ? "ok" : "wrong"} className="h-6 min-w-6 text-xs" />
                      <span className="uppercase">{word(g.answer)}</span>
                      {!result.ok && result.given && <span className="text-destructive uppercase line-through">{word(result.given)}</span>}
                    </span>
                  }
                >
                  {g.explanation}{" "}
                  {g.grammar && (
                    <Link href={`/grammatik/${g.grammar}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                      <BookMarked className="size-3.5" /> {t.runner.review.grammar}
                    </Link>
                  )}
                </Explanation>
              );
            })}
          </div>
        )}
      </div>

      {isDesktop ? (
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Wörter a–o</h3>
              {!review && <span className="text-xs text-muted-foreground">{m.forGap(num(active))}</span>}
            </div>
            {wordBank(active)}
            {!review && <p className="mt-3 text-xs text-muted-foreground">{leftOver > 0 ? m.wordsLeft(leftOver) : m.drawerText}</p>}
          </div>
        </aside>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Wörter a–o</h3>
          {wordBank(active)}
        </div>
      )}

      <Drawer open={drawerFor !== null} onOpenChange={(o) => !o && setDrawerFor(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{drawerFor ? m.drawerTitle(num(drawerFor)) : ""}</DrawerTitle>
            <DrawerDescription>{m.drawerText}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {drawerFor !== null &&
              wordBank(drawerFor, (key) => {
                assign(drawerFor, key);
                setDrawerFor(null);
              })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
