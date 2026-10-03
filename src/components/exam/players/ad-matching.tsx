"use client";

import { Ban, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useT } from "@/i18n/client";
import type { Ad, AdMatchingSet } from "@/lib/content/schemas";
import { officialNumber } from "@/lib/exam/scoring";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Explanation, ItemNumber, itemState, LetterChip, ResultIcon, type PlayerProps } from "./shared";

const AD_STYLES = [
  { box: "border-2 border-paper-foreground/80 text-center", head: "text-lg font-black tracking-tight", sub: "italic" },
  { box: "border-t-4 border-paper-foreground/70 border-x border-b", head: "text-sm font-bold tracking-[0.18em] uppercase", sub: "" },
  { box: "border overflow-hidden", head: "-mx-4 -mt-4 mb-2 bg-paper-foreground px-4 py-2 text-paper font-bold", sub: "font-medium" },
  { box: "border-2 border-dashed border-paper-foreground/50", head: "font-reading text-lg font-bold", sub: "font-reading italic" },
  { box: "border bg-paper-foreground/4 text-center", head: "font-reading text-xl font-semibold italic", sub: "text-xs tracking-wide uppercase" },
  { box: "border-l-4 border-paper-foreground/70 border-y border-r", head: "text-base font-extrabold uppercase", sub: "text-xs" },
] as const;

export function AdCard({
  ad,
  index,
  tone,
  badge,
  onClick,
  compact,
}: {
  ad: Ad;
  index: number;
  tone?: "selected" | "ok" | "muted";
  badge?: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const style = AD_STYLES[index % AD_STYLES.length];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative mb-4 block w-full break-inside-avoid rounded-md bg-paper p-4 text-left text-paper-foreground transition-all",
        style.box,
        onClick && "hover:-translate-y-0.5 hover:shadow-md",
        tone === "selected" && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        tone === "ok" && "ring-2 ring-success/60",
        tone === "muted" && "opacity-55",
        compact && "mb-3 p-3",
      )}
    >
      <span className="absolute -top-2.5 -left-2.5 z-10">
        <LetterChip letter={ad.key} tone={tone === "selected" ? "selected" : tone === "ok" ? "ok" : undefined} className="size-7 rounded-full text-sm shadow-sm" />
      </span>
      {badge && (
        <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
          {badge}
        </span>
      )}
      <div className={cn("leading-tight", style.head)}>{ad.heading}</div>
      {ad.subheading && <div className={cn("mt-1 text-sm text-paper-foreground/80", style.sub)}>{ad.subheading}</div>}
      <ul className={cn("mt-2 space-y-0.5 text-[13.5px] leading-snug", style.box.includes("text-center") && "text-center")}>
        {ad.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {ad.footer && <div className="mt-2 border-t border-paper-foreground/15 pt-1.5 text-xs font-medium text-paper-foreground/75">{ad.footer}</div>}
    </Comp>
  );
}

export function AdMatchingPlayer({ set, part, answers, onAnswer, review }: PlayerProps<AdMatchingSet>) {
  const isDesktop = useIsDesktop();
  const t = useT();
  const m = t.runner.ads;
  const [active, setActive] = useState<number>(() => set.situations.find((s) => !answers[s.n])?.n ?? 1);
  const [drawerFor, setDrawerFor] = useState<number | null>(null);
  const num = (n: number) => officialNumber(part, n);

  const usedBy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [n, key] of Object.entries(answers)) if (key !== "x") m[key] = Number(n);
    return m;
  }, [answers]);

  const assign = (n: number, key: string) => {
    const other = key !== "x" ? usedBy[key] : undefined;
    if (other && other !== n) onAnswer(other, null);
    onAnswer(n, key);
    const next = set.situations.find((s) => s.n > n && !answers[s.n] && s.n !== other) ?? set.situations.find((s) => !answers[s.n] && s.n !== n);
    if (next) setActive(next.n);
  };

  useEffect(() => {
    if (review) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input,textarea")) return;
      const k = e.key.toLowerCase();
      if (/^[a-l]$/.test(k) || k === "x") {
        e.preventDefault();
        assign(active, k);
      } else if (k === "backspace" || k === "delete") onAnswer(active, null);
      else if (k === "arrowdown") setActive((a) => Math.min(set.situations.length, a + 1));
      else if (k === "arrowup") setActive((a) => Math.max(1, a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const adTone = (key: string): "selected" | "ok" | "muted" | undefined => {
    if (review) return set.situations.some((s) => s.answer === key) ? "ok" : "muted";
    if (answers[active] === key) return "selected";
    return usedBy[key] ? "muted" : undefined;
  };
  const adBadge = (key: string) => {
    if (review) {
      const s = set.situations.find((x) => x.answer === key);
      return s ? `Situation ${num(s.n)}` : undefined;
    }
    return usedBy[key] ? `→ ${num(usedBy[key])}` : undefined;
  };

  const situationList = (
    <ol className="space-y-2">
      {set.situations.map((s) => {
        const given = answers[s.n];
        const result = review?.items.find((i) => i.n === s.n);
        const isActive = !review && active === s.n;
        return (
          <li key={s.n} id={`item-${s.n}`} className="scroll-mt-32">
            <div
              role={review ? undefined : "button"}
              tabIndex={review ? undefined : 0}
              onClick={() => {
                if (review) return;
                setActive(s.n);
                if (!isDesktop) setDrawerFor(s.n);
              }}
              onKeyDown={(e) => e.key === "Enter" && !review && setActive(s.n)}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-3 text-sm transition-all",
                !review && "cursor-pointer hover:border-primary/40",
                isActive && "border-primary/60 ring-2 ring-primary/25",
              )}
            >
              <ItemNumber n={num(s.n)} state={itemState(review, s.n, !!given, isActive)} />
              <p className="min-w-0 flex-1 pt-0.5 leading-snug">{s.text}</p>
              <div className="flex shrink-0 items-center gap-1">
                {given ? (
                  <LetterChip letter={given} tone={result ? (result.ok ? "ok" : "wrong") : "selected"} className="size-7 text-sm" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-md border border-dashed text-xs text-muted-foreground">?</span>
                )}
                {given && !review && (
                  <button
                    type="button"
                    aria-label={t.runner.review.clearAnswer}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswer(s.n, null);
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            {review && result && (
              <Explanation
                ok={result.ok}
                className="mt-1.5 ml-10"
                title={
                  <span className="flex items-center gap-2">
                    <ResultIcon ok={result.ok} />
                    {result.ok ? t.common.correct : `${t.common.correctAnswer}: ${s.answer === "x" ? m.noAdFits : s.answer}`}
                  </span>
                }
              >
                {s.explanation}
              </Explanation>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-32 lg:max-h-[calc(100svh-9rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:pb-4 scrollbar-thin">
        <h3 className="mb-2 text-sm font-semibold">Situationen</h3>
        {situationList}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Anzeigen a–l</h3>
          {!review && isDesktop && (
            <button
              type="button"
              onClick={() => assign(active, "x")}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-sm transition-colors hover:border-primary/60 hover:bg-primary/5",
                answers[active] === "x" && "border-solid border-primary bg-primary/8",
              )}
            >
              <Ban className="size-4" /> {m.noAdForSituation(num(active))}
            </button>
          )}
        </div>
        <div className="columns-1 gap-4 pt-2 pl-2 sm:columns-2 2xl:columns-3">
          {set.ads.map((ad, i) => (
            <AdCard
              key={ad.key}
              ad={ad}
              index={i}
              tone={adTone(ad.key)}
              badge={adBadge(ad.key)}
              onClick={!review && isDesktop ? () => assign(active, ad.key) : undefined}
            />
          ))}
        </div>
      </div>

      <Drawer open={drawerFor !== null} onOpenChange={(o) => !o && setDrawerFor(null)}>
        <DrawerContent className="max-h-[88svh]">
          <DrawerHeader>
            <DrawerTitle>{drawerFor ? m.drawerTitle(num(drawerFor)) : ""}</DrawerTitle>
            <DrawerDescription className="text-pretty">{set.situations.find((s) => s.n === drawerFor)?.text}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-5 pt-3 pb-8">
            <button
              type="button"
              onClick={() => {
                if (drawerFor) assign(drawerFor, "x");
                setDrawerFor(null);
              }}
              className="mb-4 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm"
            >
              <Ban className="size-4" /> {m.noAd}
            </button>
            {drawerFor !== null &&
              set.ads.map((ad, i) => (
                <AdCard
                  key={ad.key}
                  ad={ad}
                  index={i}
                  compact
                  tone={answers[drawerFor] === ad.key ? "selected" : usedBy[ad.key] ? "muted" : undefined}
                  badge={usedBy[ad.key] ? `→ ${num(usedBy[ad.key])}` : undefined}
                  onClick={() => {
                    assign(drawerFor, ad.key);
                    setDrawerFor(null);
                  }}
                />
              ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
