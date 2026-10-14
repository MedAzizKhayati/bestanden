"use client";

import { ArrowRight, CirclePlay, History, Trophy } from "lucide-react";
import { formatPoints } from "@/components/exam/result-summary";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import { formatShortDate } from "@/i18n/format";
import Link from "@/i18n/link";
import { useHydrated } from "@/lib/store/hydration";
import { useMock } from "@/lib/store/mock";
import { cn } from "@/lib/utils";

export interface MockCard {
  id: string;
  title: string;
  href: string;
  topics: string[];
}

export function MockList({ mocks, written }: { mocks: MockCard[]; written: { maxPoints: number; passPoints: number } }) {
  const hydrated = useHydrated();
  const t = useT();
  const locale = useLocale();
  const tr = t.mock.list;
  const results = useMock((s) => s.results);
  const runs = useMock((s) => s.runs);
  if (!mocks.length) return <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{tr.empty}</div>;
  const byId = new Map(mocks.map((m) => [m.id, m]));
  const history = hydrated ? results.filter((r) => byId.has(r.mockId)).sort((a, b) => b.finishedAt - a.finishedAt) : [];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mocks.map((m) => {
          const mine = hydrated ? results.filter((r) => r.mockId === m.id) : [];
          const best = mine.length ? Math.max(...mine.map((r) => r.writtenPoints)) : null;
          const running = hydrated && !!runs[m.id];
          return (
            <Link key={m.id} href={m.href} className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-gold/15 text-gold">
                  <Trophy className="size-5" />
                </span>
                {running ? (
                  <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground dark:text-warning">
                    <CirclePlay className="size-3.5" /> {t.common.inProgress}
                  </span>
                ) : best !== null ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold tabular",
                      best >= written.passPoints ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {tr.best(Math.round(best), written.maxPoints)}
                  </span>
                ) : null}
              </div>
              <div>
                <div className="text-lg font-semibold">{m.title}</div>
                <div className="text-sm text-muted-foreground">{tr.parts}</div>
              </div>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {m.topics.slice(0, 4).map((topic) => (
                  <li key={topic} className="truncate">
                    • {topic}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
                {running ? t.common.continue : mine.length ? tr.takeAgain : t.common.start}{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
      {history.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <History className="size-4 text-gold" /> {tr.resultsTitle}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{tr.resultsHint}</p>
          <ul className="mt-3 divide-y">
            {history.map((r) => {
              const mock = byId.get(r.mockId)!;
              const passed = r.writtenPoints >= written.passPoints;
              return (
                <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{formatShortDate(r.finishedAt, locale)}</span>
                    <span className="text-muted-foreground"> · {mock.title} · </span>
                    <span className="font-medium tabular">
                      {formatPoints(r.writtenPoints, locale)}/{written.maxPoints}
                    </span>
                    <span className={cn(passed ? "text-success" : "text-destructive")}> · {passed ? tr.passedShort : tr.failedShort}</span>
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${mock.href}?result=${r.id}`}>{tr.openResult}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
