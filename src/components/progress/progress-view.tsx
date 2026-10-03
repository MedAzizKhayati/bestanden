"use client";

import { Clock, Flame, Languages, Target } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber, formatShortDate } from "@/i18n/format";
import Link from "@/i18n/link";
import { useMemo } from "react";
import { PredictedScore } from "@/components/exam/predicted-score";
import { formatPoints } from "@/components/exam/result-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTION_UI } from "@/lib/exam/ui";
import { getPart, getSection, setHref } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { useNow } from "@/lib/hooks/use-now";
import { usePartStats, writingPoints } from "@/lib/hooks/use-stats";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress } from "@/lib/store/progress";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";
import { currentStreak, dayKey, formatDuration, relativeDay } from "@/lib/utils/time";

export function ProgressView() {
  const hydrated = useHydrated();
  const locale = useLocale();
  const t = useT();
  const tr = t.progress;
  const exam = useExam();
  const attempts = useProgress((s) => s.attempts);
  const writing = useProgress((s) => s.writing);
  const speaking = useProgress((s) => s.speaking);
  const activity = useProgress((s) => s.activity);
  const cards = useVocab((s) => s.cards);
  const { byPart } = usePartStats(exam);

  const percent = (n: number) => formatNumber(n / 100, locale, { style: "percent" });

  const now = useNow();
  const days = useMemo(() => {
    const out: { key: string; label: string; minutes: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const ms = now - i * 86_400_000;
      const key = dayKey(ms);
      out.push({ key, label: formatShortDate(ms, locale), minutes: Math.round((activity[key]?.seconds ?? 0) / 60) });
    }
    return out;
  }, [activity, now, locale]);

  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;

  const totalSeconds = Object.values(activity).reduce((s, d) => s + d.seconds, 0);
  const maxMinutes = Math.max(30, ...days.map((d) => d.minutes));
  const streak = currentStreak(new Set(Object.keys(activity)), now);
  const recent = [...attempts].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={<Clock className="size-5" />} value={formatDuration(totalSeconds, locale)} label={tr.tiles.totalTime} />
        <Tile icon={<Target className="size-5" />} value={String(attempts.length + writing.length + speaking.length)} label={tr.tiles.exercises} />
        <Tile icon={<Flame className="size-5" />} value={tr.tiles.streakDays(streak)} label={tr.tiles.streak} />
        <Tile icon={<Languages className="size-5" />} value={String(Object.keys(cards).length)} label={tr.tiles.words} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">{tr.chart.title}</h2>
          <div className="flex h-40 items-end gap-1">
            {days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className={cn("w-full rounded-t-sm transition-colors", d.minutes ? "bg-primary/70 group-hover:bg-primary" : "bg-muted")}
                  style={{ height: `${Math.max(3, (d.minutes / maxMinutes) * 100)}%` }}
                />
                <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-md ring-1 ring-border group-hover:block">
                  {d.label}: {t.common.minutes(d.minutes)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{days[0].label}</span>
            <span>{tr.chart.today}</span>
          </div>
        </section>
        <PredictedScore examSlug={exam.slug} />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold">{tr.byPart.title}</h2>
          <p className="text-sm text-muted-foreground">{tr.byPart.hint}</p>
        </div>
        <div className="divide-y">
          {exam.sections.flatMap((s) =>
            s.parts.map((p) => {
              const st = byPart.get(p.id);
              const ui = SECTION_UI[s.id];
              const pct = st?.recentPercent ?? null;
              return (
                <div key={p.id} className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[200px_minmax(0,1fr)_200px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <ui.icon className={cn("size-4 shrink-0", ui.text)} />
                    <span className="shrink-0 font-medium whitespace-nowrap">
                      {s.short}
                      {s.parts.length > 1 ? ` ${p.teil}` : ""}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{locale === "en" ? p.nameEn : p.name}</span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", pct === null ? "" : pct >= 60 ? "bg-success" : pct >= 45 ? "bg-warning" : "bg-destructive")} style={{ width: `${pct ?? 0}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: "60%" }} />
                  </div>
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground sm:justify-end">
                    <span>{pct !== null ? <strong className="text-foreground">{percent(pct)}</strong> : "–"}</span>
                    <span>{tr.byPart.attempts(st?.attempts ?? 0)}</span>
                    <span>{st?.onTimeRate != null ? tr.byPart.onTime(percent(st.onTimeRate)) : ""}</span>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">{tr.recent.title}</h2>
          {recent.length ? (
            <ul className="divide-y text-sm">
              {recent.map((a) => {
                const part = getPart(exam, a.partId);
                const section = part ? getSection(exam, part.sectionId) : undefined;
                const pct = a.maxPoints ? Math.round((a.points / a.maxPoints) * 100) : 0;
                const number = a.setId.slice(a.partId.length + 1);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span className={cn("w-12 text-right font-semibold tabular", pct >= 60 ? "text-success" : "text-destructive")}>{percent(pct)}</span>
                    <Link href={part ? setHref(exam, part, number) : "#"} className="min-w-0 flex-1 truncate hover:underline">
                      {section?.short} {section && part && section.parts.length > 1 ? t.common.teil(part.teil) : ""} · {t.common.setLabel(number)}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {formatPoints(a.points, locale)}/{a.maxPoints}
                      <span className="hidden sm:inline">
                        {" "}
                        · {formatDuration(a.durationSec, locale)}
                        {a.overtimeSec > 0 && <span className="text-warning"> (+{formatDuration(a.overtimeSec, locale)})</span>}
                      </span>
                    </span>
                    <span className="w-20 text-right text-xs text-muted-foreground">{relativeDay(a.finishedAt, now, locale)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{tr.recent.empty}</p>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">{tr.productive.title}</h2>
          {writing.length + speaking.length ? (
            <ul className="divide-y text-sm">
              {[...writing.map((w) => ({ kind: "Schreiben", id: w.id, setId: w.setId, at: w.finishedAt, score: w.feedback || w.selfGrades ? `${writingPoints(w)}/45` : "–" })), ...speaking.map((s) => ({ kind: "Sprechen", id: s.id, setId: s.setId, at: s.createdAt, score: s.feedback ? `${s.feedback.total}/${s.feedback.maxPoints}` : "–" }))]
                .sort((a, b) => b.at - a.at)
                .slice(0, 12)
                .map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2">
                    <span className={cn("w-20 text-xs font-semibold", r.kind === "Schreiben" ? "text-schreiben" : "text-sprechen")}>{r.kind}</span>
                    <span className="min-w-0 flex-1 truncate">{r.setId}</span>
                    <span className="font-medium tabular">{r.score}</span>
                    <span className="w-20 text-right text-xs text-muted-foreground">{relativeDay(r.at, now, locale)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{tr.productive.empty}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div>
        <div className="text-xl font-bold tabular">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
