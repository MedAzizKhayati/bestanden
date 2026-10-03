"use client";

import { ArrowRight, CircleDashed, CirclePlay, Trophy } from "lucide-react";
import Link from "@/i18n/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale, useT } from "@/i18n/client";
import { TOPICS, type TopicKey as Topic } from "@/lib/content/constants";
import { writingPoints } from "@/lib/hooks/use-stats";
import { useHydrated } from "@/lib/store/hydration";
import { attemptKey, useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { formatPoints } from "./result-summary";

export interface SetCardData {
  id: string;
  number: string;
  title: string;
  topic: string;
  difficulty: 1 | 2 | 3;
  href: string;
  badge?: string;
}

export function SetGrid({ examId, sets, maxPoints, accent }: { examId: string; sets: SetCardData[]; maxPoints: number; accent: string }) {
  const hydrated = useHydrated();
  const t = useT();
  const locale = useLocale();
  const attempts = useProgress((s) => s.attempts);
  const inProgress = useProgress((s) => s.inProgress);
  const writing = useProgress((s) => s.writing);
  const speaking = useProgress((s) => s.speaking);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const stats = useMemo(() => {
    const m = new Map<string, { best: number; count: number }>();
    for (const a of attempts) {
      if (a.examId !== examId || a.context !== "practice") continue;
      const prev = m.get(a.setId);
      m.set(a.setId, { best: Math.max(prev?.best ?? 0, a.points), count: (prev?.count ?? 0) + 1 });
    }
    for (const w of writing) {
      if (w.examId !== examId) continue;
      const prev = m.get(w.setId);
      m.set(w.setId, { best: Math.max(prev?.best ?? 0, writingPoints(w)), count: (prev?.count ?? 0) + 1 });
    }
    for (const s of speaking) {
      if (s.examId !== examId) continue;
      const prev = m.get(s.setId);
      m.set(s.setId, { best: Math.max(prev?.best ?? 0, s.feedback?.total ?? 0), count: (prev?.count ?? 0) + 1 });
    }
    return m;
  }, [attempts, writing, speaking, examId]);

  const visible = sets.filter((s) => {
    if (!hydrated || filter === "all") return true;
    const done = stats.has(s.id);
    return filter === "done" ? done : !done;
  });

  if (!sets.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t.exam.setGrid.empty}</div>
    );
  }

  const doneCount = hydrated ? sets.filter((s) => stats.has(s.id)).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{doneCount}</span> {t.exam.setGrid.practised(sets.length)}
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)}>
          <ToggleGroupItem value="all">{t.common.all}</ToggleGroupItem>
          <ToggleGroupItem value="todo">{t.common.notDone}</ToggleGroupItem>
          <ToggleGroupItem value="done">{t.common.doneFilter}</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => {
          const st = hydrated ? stats.get(s.id) : undefined;
          const running = hydrated && !!inProgress[attemptKey(examId, s.id)];
          const pct = st && maxPoints ? Math.round((st.best / maxPoints) * 100) : 0;
          return (
            <Link
              key={s.id}
              href={s.href}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl text-sm font-bold tabular", accent)}>{s.number}</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {s.badge && <Badge variant="outline">{s.badge}</Badge>}
                  {running && (
                    <Badge className="bg-warning/15 text-warning-foreground dark:text-warning">
                      <CirclePlay /> {t.common.inProgress}
                    </Badge>
                  )}
                  <Badge variant="secondary">{t.common.difficulty[s.difficulty]}</Badge>
                </div>
              </div>
              <div className="min-w-0">
                <div className="line-clamp-2 leading-snug font-medium">{s.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{TOPICS[s.topic as Topic] ?? s.topic}</div>
              </div>
              <div className="mt-auto flex items-center gap-3 text-xs">
                {st ? (
                  <>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", pct >= 60 ? "bg-success" : pct >= 45 ? "bg-warning" : "bg-destructive")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="flex items-center gap-1 font-medium tabular">
                      <Trophy className="size-3.5 text-gold" />
                      {maxPoints ? `${formatPoints(st.best, locale)}/${maxPoints}` : `${st.count}×`}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CircleDashed className="size-3.5" /> {t.common.notStarted}
                  </span>
                )}
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
