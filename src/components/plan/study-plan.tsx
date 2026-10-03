"use client";

import { CalendarDays, Check, ChevronDown, Circle } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { formatShortDate } from "@/i18n/format";
import Link from "@/i18n/link";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTION_UI } from "@/lib/exam/ui";
import { DEFAULT_EXAM } from "@/lib/exams";
import { usePartStats } from "@/lib/hooks/use-stats";
import { buildPlan, type PlanInventory, type PlanTask } from "@/lib/plan/build-plan";
import { useHydrated } from "@/lib/store/hydration";
import { useMock } from "@/lib/store/mock";
import { useProgress } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";

export function StudyPlan({ inventory, grammarCounts, vocabWords }: { inventory: PlanInventory; grammarCounts: Record<string, number>; vocabWords: Record<string, string[]> }) {
  const hydrated = useHydrated();
  const locale = useLocale();
  const t = useT();
  const examDate = useSettings((s) => s.examDate);
  const daily = useSettings((s) => s.dailyGoalMinutes);
  const update = useSettings((s) => s.update);
  const attempts = useProgress((s) => s.attempts);
  const writing = useProgress((s) => s.writing);
  const speaking = useProgress((s) => s.speaking);
  const grammar = useProgress((s) => s.grammar);
  const mockResults = useMock((s) => s.results);
  const cards = useVocab((s) => s.cards);
  const { byPart } = usePartStats(DEFAULT_EXAM);
  const [open, setOpen] = useState<number | null>(null);
  const [today] = useState(() => new Date());

  const weakness = useMemo(() => Object.fromEntries(inventory.parts.map((p) => [p.partId, byPart.get(p.partId)?.recentPercent ?? null])), [inventory, byPart]);
  const weeks = useMemo(
    () => buildPlan({ today, examDate: examDate ? new Date(examDate) : undefined, dailyMinutes: daily, weakness, inventory, locale }),
    [today, examDate, daily, weakness, inventory, locale],
  );

  const done = (task: PlanTask) => {
    switch (task.kind) {
      case "set":
        return attempts.some((a) => a.setId === task.refId) || writing.some((w) => w.setId === task.refId) || speaking.some((s) => s.setId === task.refId);
      case "grammar": {
        const r = grammar[task.refId]?.results;
        return !!r && Object.values(r).filter(Boolean).length / (grammarCounts[task.refId] || 1) >= 0.8;
      }
      case "vocab": {
        const ids = vocabWords[task.refId] ?? [];
        return ids.length > 0 && ids.filter((id) => cards[id]).length / ids.length >= 0.8;
      }
      case "mock":
        return mockResults.some((r) => r.mockId === task.refId);
      default:
        return false;
    }
  };

  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;

  const current = weeks[0];
  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - new Date(today.toDateString()).getTime()) / 86_400_000) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-5">
        <label className="space-y-1.5">
          <span className="block text-sm font-medium">{t.plan.examDate}</span>
          <input type="date" value={examDate ?? ""} onChange={(e) => update({ examDate: e.target.value || undefined })} className="h-9 rounded-lg border bg-background px-3 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-sm font-medium">{t.plan.perDay}</span>
          <Select value={String(daily)} onValueChange={(v) => update({ dailyGoalMinutes: Number(v) })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {t.common.minutes(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          {daysLeft !== null ? (
            daysLeft >= 0 ? (
              <>
                <strong className="text-foreground">{daysLeft}</strong> {t.plan.daysLeft(daysLeft)} · {t.plan.weeks(weeks.length)}
              </>
            ) : (
              t.plan.pastDate
            )
          ) : (
            t.plan.noDate
          )}
        </div>
      </div>

      {current && <WeekCard week={current} done={done} highlight />}

      <div className="space-y-2">
        {weeks.slice(1).map((w) => (
          <div key={w.index} className="rounded-2xl border bg-card">
            <button type="button" onClick={() => setOpen(open === w.index ? null : w.index)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-sm font-bold">{w.index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {t.plan.week(w.index + 1)} · {w.phaseName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatShortDate(w.start, locale)} – {formatShortDate(w.end, locale)} · {t.plan.tasks(w.tasks.length)} · {t.plan.done(w.tasks.filter(done).length)}
                </span>
              </span>
              <ChevronDown className={cn("size-4 transition-transform", open === w.index && "rotate-180")} />
            </button>
            {open === w.index && (
              <div className="border-t px-4 py-3">
                <TaskList tasks={w.tasks} done={done} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekCard({ week, done, highlight }: { week: ReturnType<typeof buildPlan>[number]; done: (t: PlanTask) => boolean; highlight?: boolean }) {
  const locale = useLocale();
  const t = useT();
  const finished = week.tasks.filter(done).length;
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", highlight && "border-primary/40 ring-1 ring-primary/20")}>
      <div className="flex flex-wrap items-center gap-3 border-b bg-linear-to-r from-primary/10 to-transparent px-5 py-4">
        <CalendarDays className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {t.plan.thisWeek} · {week.phaseName}{" "}
            <span className="font-normal text-muted-foreground">
              ({formatShortDate(week.start, locale)} – {formatShortDate(week.end, locale)})
            </span>
          </div>
          <div className="text-sm text-muted-foreground">{week.focus}</div>
        </div>
        <div className="text-sm font-semibold tabular">
          {finished}/{week.tasks.length}
        </div>
      </div>
      <div className="px-5 py-3">
        <TaskList tasks={week.tasks} done={done} />
      </div>
    </div>
  );
}

function TaskList({ tasks, done }: { tasks: PlanTask[]; done: (t: PlanTask) => boolean }) {
  return (
    <ul className="divide-y">
      {tasks.map((t) => {
        const ok = done(t);
        const ui = t.sectionId ? SECTION_UI[t.sectionId as keyof typeof SECTION_UI] : undefined;
        return (
          <li key={t.key}>
            <Link href={t.href} className="flex items-center gap-3 py-2.5 text-sm hover:opacity-80">
              {ok ? (
                <span className="grid size-5 place-items-center rounded-full bg-success text-success-foreground">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : (
                <Circle className="size-5 text-muted-foreground/50" />
              )}
              {ui && <ui.icon className={cn("size-4 shrink-0", ui.text)} />}
              <span className={cn("min-w-0 flex-1 truncate", ok && "text-muted-foreground line-through")}>{t.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{t.detail}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
