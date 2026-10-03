"use client";

import { ArrowRight, Check, CircleCheckBig, RotateCcw, Trash2, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { formatShortDate } from "@/i18n/format";
import Link from "@/i18n/link";
import type { Messages } from "@/i18n/messages";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SECTION_UI } from "@/lib/exam/ui";
import { DEFAULT_EXAM, getExam, getPart, getSection, setHref } from "@/lib/exams";
import { useNow } from "@/lib/hooks/use-now";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress, type MistakeCard } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { daysBetween } from "@/lib/utils/time";

function partLabel(m: MistakeCard, t: Messages) {
  const exam = getExam(m.examId) ?? DEFAULT_EXAM;
  const part = getPart(exam, m.partId);
  const section = part ? getSection(exam, part.sectionId) : undefined;
  if (!part || !section) return { label: m.partId, href: undefined, sectionId: undefined };
  const number = m.setId.slice(m.partId.length + 1);
  return {
    label: `${section.short}${section.parts.length > 1 ? ` ${t.common.teil(part.teil)}` : ""}`,
    href: setHref(exam, part, number),
    sectionId: section.id,
    number,
  };
}

export function MistakeTrainer() {
  const hydrated = useHydrated();
  const locale = useLocale();
  const t = useT();
  const tr = t.mistakes;
  const mistakes = useProgress((s) => s.mistakes);
  const reviewMistake = useProgress((s) => s.reviewMistake);
  const removeMistake = useProgress((s) => s.removeMistake);
  const [sessionIds, setSessionIds] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const now = useNow();
  const { due, open, resolved } = useMemo(() => {
    const all = Object.values(mistakes);
    return {
      due: all.filter((m) => !m.resolved && m.due <= now).sort((a, b) => a.due - b.due),
      open: all.filter((m) => !m.resolved).sort((a, b) => a.partId.localeCompare(b.partId) || a.createdAt - b.createdAt),
      resolved: all.filter((m) => m.resolved).length,
    };
  }, [mistakes, now]);

  if (!hydrated) return <Skeleton className="h-80 rounded-2xl" />;

  const ids = sessionIds ?? due.map((m) => m.id);
  const card = sessionIds ? mistakes[ids[index]] : undefined;

  const startSession = () => {
    setSessionIds(due.slice(0, 20).map((m) => m.id));
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  const answer = (key: string) => {
    if (!card || picked) return;
    setPicked(key);
    const ok = key === card.correct;
    if (ok) setScore((s) => s + 1);
    reviewMistake(card.id, ok);
  };

  const byPart = open.reduce<Record<string, MistakeCard[]>>((acc, m) => {
    (acc[m.partId] ??= []).push(m);
    return acc;
  }, {});

  return (
    <Tabs defaultValue="review">
      <TabsList>
        <TabsTrigger value="review">{tr.tabs.review(due.length)}</TabsTrigger>
        <TabsTrigger value="all">{tr.tabs.all(open.length)}</TabsTrigger>
      </TabsList>

      <TabsContent value="review" className="mt-5">
        {!sessionIds ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center">
            {due.length ? (
              <>
                <div className="text-5xl font-bold tabular">{due.length}</div>
                <p className="max-w-md text-muted-foreground">
                  {tr.start.due(due.length)} {tr.start.schedule}
                </p>
                <Button size="lg" onClick={startSession}>
                  {tr.start.button} <ArrowRight />
                </Button>
              </>
            ) : (
              <>
                <CircleCheckBig className="size-12 text-success" />
                <div className="text-lg font-semibold">{open.length ? tr.start.nothingDue : tr.start.noMistakes}</div>
                <p className="max-w-md text-sm text-muted-foreground">{open.length ? tr.start.scheduled(open.length, resolved) : tr.start.howItWorks}</p>
              </>
            )}
          </div>
        ) : card ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{tr.session.progress(index + 1, ids.length, score)}</span>
              <MistakeSource card={card} />
            </div>
            <div className="space-y-4 rounded-3xl border bg-card p-5 sm:p-6">
              {card.context && <div className="reading max-h-60 overflow-y-auto rounded-xl bg-muted/50 p-4 text-[15px] leading-relaxed">{card.context}</div>}
              <div className="reading text-lg font-semibold">{card.prompt}</div>
              <div className="space-y-2">
                {(card.options ?? []).map((o) => {
                  const isRight = o.key === card.correct;
                  const isPicked = picked === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => answer(o.key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                        !picked && "hover:border-primary/50 hover:bg-primary/5",
                        picked && isRight && "border-success/50 bg-success/10",
                        isPicked && !isRight && "border-destructive/40 bg-destructive/10",
                      )}
                    >
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-xs font-bold uppercase">{o.key === "r" ? "R" : o.key === "f" ? "F" : o.key}</span>
                      <span className="flex-1">{o.text}</span>
                      {picked && isRight && <Check className="size-4 text-success" />}
                      {isPicked && !isRight && <X className="size-4 text-destructive" />}
                    </button>
                  );
                })}
              </div>
              {picked && (
                <div className={cn("rounded-xl px-4 py-3 text-sm", picked === card.correct ? "bg-success/8" : "bg-destructive/6")}>
                  <div className="mb-1 font-medium">{picked === card.correct ? tr.session.right : tr.session.correctIs(card.correctText)}</div>
                  <div className="text-foreground/85">{card.explanation}</div>
                </div>
              )}
            </div>
            {picked && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setPicked(null);
                  setIndex((i) => i + 1);
                }}
              >
                {t.common.next}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
            <div className="text-4xl font-bold tabular">
              {score}/{ids.length}
            </div>
            <p className="text-muted-foreground">{tr.session.done}</p>
            <Button variant="outline" onClick={() => setSessionIds(null)}>
              <RotateCcw /> {t.common.back}
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="all" className="mt-5 space-y-5">
        {Object.entries(byPart).map(([partId, list]) => {
          const info = partLabel(list[0], t);
          const ui = info.sectionId ? SECTION_UI[info.sectionId] : undefined;
          return (
            <section key={partId} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                {ui && <ui.icon className={cn("size-4", ui.text)} />}
                <span className="font-semibold">{info.label}</span>
                <span className="text-sm text-muted-foreground">· {list.length}</span>
              </div>
              <ul className="divide-y">
                {list.map((m) => {
                  const src = partLabel(m, t);
                  return (
                    <li key={m.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-medium">{m.prompt}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {tr.list.correct(`${m.correctText.slice(0, 90)}${m.correctText.length > 90 ? "…" : ""}`)} · {tr.list.streak(m.streak)} ·{" "}
                          {daysBetween(m.due, now) >= 0 ? tr.list.dueNow : tr.list.dueOn(formatShortDate(m.due, locale))}
                        </div>
                      </div>
                      {src.href && (
                        <Link href={src.href} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                          {t.common.setLabel(src.number)}
                        </Link>
                      )}
                      <button type="button" aria-label={t.common.remove} onClick={() => removeMistake(m.id)} className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {!open.length && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tr.list.empty}</div>}
      </TabsContent>
    </Tabs>
  );
}

function MistakeSource({ card }: { card: MistakeCard }) {
  const t = useT();
  const info = partLabel(card, t);
  return info.href ? (
    <Link href={info.href} className="hover:text-foreground">
      {info.label} · {t.common.setLabel(info.number)}
    </Link>
  ) : (
    <span>{info.label}</span>
  );
}
