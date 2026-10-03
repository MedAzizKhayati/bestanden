"use client";

import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  CirclePlay,
  Flame,
  Languages,
  Lightbulb,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import Link from "@/i18n/link";
import { PredictedScore } from "@/components/exam/predicted-score";
import { FirstSteps, Welcome } from "@/components/onboarding/welcome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTION_UI } from "@/lib/exam/ui";
import { partHref } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { useNow } from "@/lib/hooks/use-now";
import { usePartStats } from "@/lib/hooks/use-stats";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";
import { currentStreak, dayKey } from "@/lib/utils/time";

export interface DashboardData {
  examSlug: string;
  /** partId → ordered list of sets with links */
  sets: Record<string, { id: string; href: string; title: string }[]>;
  counts: { grammar: number; words: number; phrases: number; sets: number };
}

export function Dashboard({ data }: { data: DashboardData }) {
  const hydrated = useHydrated();
  const locale = useLocale();
  const t = useT();
  const tr = t.dashboard;
  const exam = useExam(data.examSlug);
  const attempts = useProgress((s) => s.attempts);
  const inProgress = useProgress((s) => s.inProgress);
  const mistakes = useProgress((s) => s.mistakes);
  const activity = useProgress((s) => s.activity);
  const writing = useProgress((s) => s.writing);
  const cards = useVocab((s) => s.cards);
  const examDate = useSettings((s) => s.examDate);
  const goal = useSettings((s) => s.dailyGoalMinutes);
  const onboarded = useSettings((s) => s.onboarded);
  const { byPart } = usePartStats(exam);

  const now = useNow();
  const derived = (() => {
    const today = activity[dayKey(now)];
    const doneSets = new Set([...attempts.map((a) => a.setId), ...writing.map((w) => w.setId)]);
    // Resume an unfinished attempt first.
    const resumeKey = Object.keys(inProgress).find((k) => k.startsWith("practice:"));
    let resume: { href: string; title: string } | undefined;
    if (resumeKey) {
      const setId = resumeKey.split(":")[2];
      for (const list of Object.values(data.sets)) {
        const hit = list.find((s) => s.id === setId);
        if (hit) resume = { href: hit.href, title: hit.title };
      }
    }
    // Otherwise recommend the weakest (or least practised) part.
    const parts = exam.sections.flatMap((s) => s.parts).filter((p) => data.sets[p.id]?.length);
    const ranked = [...parts].sort((a, b) => {
      const sa = byPart.get(a.id);
      const sb = byPart.get(b.id);
      const pa = sa?.recentPercent ?? -1;
      const pb = sb?.recentPercent ?? -1;
      if (pa !== pb) return pa - pb;
      return (sa?.attempts ?? 0) - (sb?.attempts ?? 0);
    });
    const recPart = ranked[0];
    const recSet = recPart ? (data.sets[recPart.id].find((s) => !doneSets.has(s.id)) ?? data.sets[recPart.id][0]) : undefined;
    return {
      minutesToday: Math.round((today?.seconds ?? 0) / 60),
      streak: currentStreak(new Set(Object.keys(activity)), now),
      dueMistakes: Object.values(mistakes).filter((m) => !m.resolved && m.due <= now).length,
      dueCards: Object.values(cards).filter((c) => c.due <= now).length,
      learnedCards: Object.keys(cards).length,
      daysLeft: examDate ? Math.ceil((new Date(examDate).getTime() - new Date(dayKey(now)).getTime()) / 86_400_000) : null,
      resume,
      recPart,
      recSet,
      totalAttempts: attempts.length + writing.length,
    };
  })();

  if (!hydrated) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl lg:col-span-3" />
      </div>
    );
  }

  const isNew = derived.totalAttempts === 0;
  // A fresh profile starts with the welcome flow instead of an empty dashboard.
  if (!onboarded && isNew && derived.learnedCards === 0) return <Welcome />;
  const firstPart = exam.sections[0].parts[0];
  const goalPct = Math.min(100, Math.round((derived.minutesToday / Math.max(1, goal)) * 100));
  const rec = derived.recPart;
  const recUi = rec ? SECTION_UI[rec.sectionId] : null;

  return (
    <div className="space-y-6">
      <FirstSteps examSlug={data.examSlug} firstPartHref={partHref(exam, firstPart)} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Hero / next step */}
        <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-primary/15 via-card to-card p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-background/80 px-2.5 py-1 ring-1 ring-border">{exam.name}</span>
              {derived.daysLeft !== null && derived.daysLeft >= 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 ring-1 ring-border">
                  <CalendarDays className="size-3.5" /> {derived.daysLeft === 0 ? tr.examDay : tr.daysUntilExam(derived.daysLeft)}
                </span>
              ) : (
                <Link href="/lernplan" className="flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-primary ring-1 ring-border hover:underline">
                  <CalendarDays className="size-3.5" /> {tr.setExamDate}
                </Link>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {isNew ? tr.hero.titleNew : derived.streak > 1 ? tr.hero.titleStreak(derived.streak) : tr.hero.titleBack}
              </h1>
              <p className="mt-2 max-w-xl text-pretty text-muted-foreground">{isNew ? tr.hero.introNew(data.counts.sets) : tr.hero.introBack}</p>
            </div>

            {derived.resume ? (
              <NextCard
                href={derived.resume.href}
                kicker={tr.next.resume}
                title={derived.resume.title}
                icon={<CirclePlay className="size-5" />}
                tone="warning"
              />
            ) : rec && derived.recSet && recUi ? (
              <NextCard
                href={derived.recSet.href}
                kicker={isNew ? tr.next.startHere : tr.next.weakest}
                title={`${exam.sections.find((s) => s.id === rec.sectionId)!.short}${rec.items ? ` ${t.common.teil(rec.teil)}` : ""} · ${derived.recSet.title}`}
                icon={<recUi.icon className="size-5" />}
                iconClass={cn(recUi.bgSoft, recUi.text)}
              />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/${exam.slug}/modelltest`}>
                  <Trophy /> {tr.mockExam}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${exam.slug}`}>
                  <Target /> {t.nav.examOverview}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/lernplan">
                  <Sparkles /> {t.nav.studyPlan}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Today */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{tr.today.title}</div>
              <div className={cn("flex items-center gap-1 text-sm font-semibold", derived.streak ? "text-orange-500" : "text-muted-foreground")}>
                <Flame className="size-4" /> {derived.streak}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular">{derived.minutesToday}</span>
              <span className="text-muted-foreground">/ {t.common.minutes(goal)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-linear-to-r from-primary to-gold transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{goalPct >= 100 ? tr.today.goalReached : tr.today.autoCount}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QueueTile href="/fehlertrainer" icon={<RotateCcw className="size-4" />} count={derived.dueMistakes} label={tr.today.mistakesDue(derived.dueMistakes)} />
            <QueueTile href="/wortschatz/wiederholen" icon={<Languages className="size-4" />} count={derived.dueCards} label={tr.today.wordsDue(derived.dueCards)} />
          </div>
        </section>
      </div>

      {/* Sections */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{tr.practice.title}</h2>
          <Link href={`/${exam.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            {tr.practice.structure}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {exam.sections.map((s) => {
            const ui = SECTION_UI[s.id];
            const stats = s.parts.map((p) => byPart.get(p.id)).filter((x) => x?.recentPercent != null);
            const pct = stats.length ? Math.round(stats.reduce((a, b) => a + (b!.recentPercent ?? 0), 0) / stats.length) : null;
            return (
              <Link
                key={s.id}
                href={s.parts.length === 1 ? partHref(exam, s.parts[0]) : `/${exam.slug}/${s.id}`}
                className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={cn("grid size-10 place-items-center rounded-xl", ui.bgSoft, ui.text)}>
                    <ui.icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold tabular">{pct !== null ? formatNumber(pct / 100, locale, { style: "percent" }) : "–"}</span>
                </div>
                <div>
                  <div className="font-semibold">{s.short}</div>
                  <div className="text-xs text-muted-foreground">
                    {[locale === "en" ? s.nameEn : s.name !== s.short ? s.name : null, `${s.maxPoints} ${t.common.pointsShort}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", ui.bg)} style={{ width: `${pct ?? 0}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Learn */}
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">{tr.learn.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <LearnTile href="/grammatik" icon={<BookMarked className="size-5" />} title={t.nav.grammar} text={tr.learn.grammar(data.counts.grammar)} />
            <LearnTile href="/wortschatz" icon={<Languages className="size-5" />} title={t.nav.vocabulary} text={tr.learn.vocab(data.counts.words, derived.learnedCards)} />
            <LearnTile href="/redemittel" icon={<MessageSquareQuote className="size-5" />} title={tr.learn.phrasesTitle} text={tr.learn.phrases(data.counts.phrases)} />
            <LearnTile href={`/${exam.slug}/strategien`} icon={<Lightbulb className="size-5" />} title={t.nav.strategies} text={tr.learn.strategies} />
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">{tr.level}</h2>
          <PredictedScore examSlug={exam.slug} compact />
        </section>
      </div>
    </div>
  );
}

function NextCard({
  href,
  kicker,
  title,
  icon,
  iconClass,
  tone,
}: {
  href: string;
  kicker: string;
  title: string;
  icon: React.ReactNode;
  iconClass?: string;
  tone?: "warning";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border bg-background/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        tone === "warning" && "border-warning/50",
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", iconClass ?? "bg-warning/15 text-warning")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{kicker}</span>
        <span className="block truncate font-semibold">{title}</span>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function QueueTile({ href, icon, count, label }: { href: string; icon: React.ReactNode; count: number; label: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between text-muted-foreground">
        {icon}
        {count > 0 && <span className="size-2 rounded-full bg-primary" />}
      </div>
      <div className="mt-2 text-2xl font-bold tabular">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}

function LearnTile({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group flex gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <span>
        <span className="flex items-center gap-1 font-semibold">
          {title} <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}
