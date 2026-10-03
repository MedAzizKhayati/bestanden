"use client";

import { ArrowLeft, Headphones, Languages, Lightbulb, Play, Send, ShieldCheck, Timer, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { SectionId } from "@/lib/content/schemas";
import { mistakeCard, scoreSet, type ScoredSet, type ScoreResult } from "@/lib/exam/scoring";
import { SECTION_UI } from "@/lib/exam/ui";
import type { PartDefinition } from "@/lib/exams";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useHydrated } from "@/lib/store/hydration";
import { attemptKey, useProgress, type Answers, type AttemptRecord } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./countdown-timer";
import { Glossary } from "./players/shared";
import { formatPoints, ResultSummary } from "./result-summary";
import { ScoredPlayer } from "./scored-player";

export interface ExerciseRunnerProps {
  examId: string;
  sectionId: SectionId;
  sectionName: string;
  part: PartDefinition;
  set: ScoredSet;
  setNumber: string;
  position: { index: number; count: number };
  links: { part: string; next?: string; prev?: string };
  tips: string[];
  /** Mock exams embed the runner and take over submission. */
  embedded?: boolean;
}

type Phase = "intro" | "running" | "review";

export function ExerciseRunner(props: ExerciseRunnerProps) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }
  return <Runner {...props} />;
}

function Runner({ examId, sectionId, sectionName, part, set, setNumber, position, links, tips }: ExerciseRunnerProps) {
  const locale = useLocale();
  const t = useT();
  const r = t.runner;
  // English glosses of the official German texts are only shown in the English UI.
  const glosses = locale === "en";
  const isAudio = !!part.audio;
  const key = attemptKey(examId, set.id);
  const limitSec = part.minutes * 60;

  const strictSetting = useSettings((s) => s.strictTimer);
  const showEnglishDefault = useSettings((s) => s.showEnglish);
  const updateSettings = useSettings((s) => s.update);
  const inProgress = useProgress((s) => s.inProgress[key]);
  const startAttempt = useProgress((s) => s.startAttempt);
  const storeAnswers = useProgress((s) => s.setAnswers);
  const discardAttempt = useProgress((s) => s.discardAttempt);
  const finishAttempt = useProgress((s) => s.finishAttempt);
  const allAttempts = useProgress((s) => s.attempts);
  const previous = useMemo(() => allAttempts.filter((a) => a.setId === set.id && a.examId === examId && a.context === "practice"), [allAttempts, set.id, examId]);

  const [phase, setPhase] = useState<Phase>(() => (inProgress && !isAudio ? "running" : "intro"));
  const [answers, setAnswers] = useState<Answers>(() => (inProgress && !isAudio ? inProgress.answers : {}));
  const [result, setResult] = useState<{ score: ScoreResult; record: AttemptRecord } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showEnglish, setShowEnglish] = useState(showEnglishDefault);
  const [audioMode, setAudioMode] = useState<"exam" | "training">(strictSetting ? "exam" : "training");
  const submitting = useRef(false);
  const ui = SECTION_UI[sectionId];

  useFocusMode(phase === "running");

  // An interrupted listening simulation cannot be resumed – start over cleanly (checked once, on mount).
  const checkedInterrupted = useRef(false);
  useEffect(() => {
    if (checkedInterrupted.current) return;
    checkedInterrupted.current = true;
    if (isAudio && useProgress.getState().inProgress[key]) discardAttempt(key);
  }, [isAudio, discardAttempt, key]);

  const attempt = useProgress((s) => s.inProgress[key]);

  const submit = useCallback(
    (auto: boolean) => {
      if (submitting.current) return;
      const current = useProgress.getState().inProgress[key];
      if (!current) return;
      submitting.current = true;
      const now = Date.now();
      const score = scoreSet(set, part, answers);
      const elapsed = Math.round((now - current.startedAt) / 1000);
      // A strict attempt that hit the limit cannot have used extra time (answers lock at 0:00).
      const durationSec = auto && current.strict ? Math.min(elapsed, current.limitSec) : elapsed;
      const record = finishAttempt(
        key,
        {
          examId,
          partId: part.id,
          setId: set.id,
          startedAt: current.startedAt,
          finishedAt: now,
          durationSec,
          limitSec: current.limitSec,
          overtimeSec: Math.max(0, durationSec - current.limitSec),
          strict: current.strict,
          autoSubmitted: auto,
          correct: score.correct,
          total: score.total,
          points: score.points,
          maxPoints: score.maxPoints,
          answers,
          context: "practice",
        },
        score.items.filter((i) => !i.ok).map((i) => mistakeCard(set, part, i.n, i.given, locale)),
        score.items.filter((i) => i.ok).map((i) => `${set.id}:${i.n}`),
      );
      setResult({ score, record });
      setPhase("review");
      setConfirmOpen(false);
      submitting.current = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [answers, examId, finishAttempt, key, part, set, locale],
  );

  // Resumed attempt whose time ran out while the learner was away.
  useEffect(() => {
    if (phase !== "running" || !attempt?.strict || isAudio) return;
    if (Date.now() - attempt.startedAt < attempt.limitSec * 1000) return;
    const id = setTimeout(() => submit(true), 0);
    return () => clearTimeout(id);
  }, [phase, attempt, isAudio, submit]);

  const start = () => {
    startAttempt(key, limitSec, isAudio ? audioMode === "exam" : strictSetting);
    setAnswers({});
    setResult(null);
    setPhase("running");
    window.scrollTo({ top: 0 });
  };

  const retry = () => {
    discardAttempt(key);
    setAnswers({});
    setResult(null);
    setPhase("intro");
    window.scrollTo({ top: 0 });
  };

  const onAnswer = (n: number, value: string | null) => {
    if (phase !== "running") return;
    // Functional update: players may change two items in one go (moving a headline between texts).
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === null) delete next[String(n)];
      else next[String(n)] = value;
      return next;
    });
  };

  // Persist answers so a reload resumes the attempt with the clock still running.
  useEffect(() => {
    if (phase === "running") storeAnswers(key, answers);
  }, [answers, phase, key, storeAnswers]);

  const answered = Object.keys(answers).length;
  const total = part.items;

  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (answered < total) setConfirmOpen(true);
        else submit(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answered, total, submit]);

  const best = previous.length ? Math.max(...previous.filter((a) => !result || a.id !== result.record.id).map((a) => a.points), -1) : undefined;

  const player = (
    <ScoredPlayer
      set={set}
      part={part}
      answers={answers}
      onAnswer={onAnswer}
      review={phase === "review" ? (result?.score ?? null) : null}
      audio={{ mode: audioMode, started: phase === "running", onComplete: () => audioMode === "exam" && submit(true) }}
    />
  );

  /* ---------------- Intro ---------------- */
  if (phase === "intro") {
    const bestScore = previous.length ? Math.max(...previous.map((a) => a.points)) : null;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className={cn("overflow-hidden rounded-2xl border bg-linear-to-br", ui.gradient)}>
          <div className="space-y-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("bg-background", ui.text)}>
                <ui.icon /> {sectionName} · {t.common.teil(part.teil)}
              </Badge>
              <Badge variant="secondary">{t.common.difficulty[set.difficulty]}</Badge>
              <Badge variant="secondary">{r.intro.setOf(setNumber, position.count)}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{set.title}</h1>
              <p className="mt-1 text-muted-foreground">
                {part.name}
                {glosses && ` · ${part.nameEn}`}
              </p>
            </div>
            <div className="rounded-xl border bg-background/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Aufgabe</span>
                {glosses && (
                  <button onClick={() => setShowEnglish((s) => !s)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Languages className="size-3.5" /> {showEnglish ? t.common.hideEnglish : t.common.showEnglish}
                  </button>
                )}
              </div>
              <p className="leading-relaxed font-medium">{part.instruction}</p>
              {glosses && showEnglish && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{part.instructionEn}</p>}
            </div>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <Fact label={t.common.items} value={String(part.items)} />
              <Fact label={t.common.points} value={String(part.maxPoints)} />
              <Fact label={isAudio ? r.intro.played : t.common.time} value={isAudio ? r.intro.times(part.audio!.plays) : t.common.minutes(part.minutes)} />
            </dl>
          </div>

          <div className="space-y-4 border-t bg-background/70 p-5 sm:p-7">
            {isAudio ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeCard
                  active={audioMode === "exam"}
                  onClick={() => setAudioMode("exam")}
                  icon={<ShieldCheck className="size-4" />}
                  title={r.intro.examMode}
                  text={r.intro.examModeText(part.audio!.plays)}
                />
                <ModeCard
                  active={audioMode === "training"}
                  onClick={() => setAudioMode("training")}
                  icon={<Headphones className="size-4" />}
                  title={r.intro.trainingMode}
                  text={r.intro.trainingModeText(part.audio!.plays)}
                />
              </div>
            ) : (
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border bg-card p-4">
                <span className="space-y-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" /> {r.intro.strict}
                  </span>
                  <span className="block text-sm text-muted-foreground">{strictSetting ? r.intro.strictOn(part.minutes) : r.intro.strictOff}</span>
                </span>
                <Switch checked={strictSetting} onCheckedChange={(v) => updateSettings({ strictTimer: v })} />
              </label>
            )}

            {tips.length > 0 && (
              <div className="rounded-xl border border-dashed p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="size-4 text-gold" /> {r.intro.strategy}
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={start} className="px-6">
                <Play /> {isAudio && audioMode === "exam" ? r.intro.startListening : r.intro.startNow}
              </Button>
              <Button variant="ghost" asChild>
                <Link href={links.part}>
                  <ArrowLeft /> {r.intro.allSets}
                </Link>
              </Button>
              {bestScore !== null && (
                <span className="ml-auto text-sm text-muted-foreground">
                  {r.intro.best} <strong className="text-foreground">{formatPoints(bestScore, locale)}</strong> / {part.maxPoints} · {r.intro.attempts(previous.length)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Running / review ---------------- */
  return (
    <div className="space-y-5">
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/85 px-4 py-2.5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild className="shrink-0">
            <Link href={links.part} aria-label={r.bar.backToSets}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className={cn("truncate text-xs font-semibold", ui.text)}>
              {sectionName} · {t.common.teil(part.teil)} · {t.common.setLabel(setNumber)}
            </div>
            <div className="truncate text-sm font-medium">{set.title}</div>
          </div>
          {phase === "running" && (
            <>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <div className="font-semibold text-foreground tabular">
                  {answered}/{total}
                </div>
                {r.bar.answered}
              </div>
              {!isAudio && attempt && (
                <CountdownTimer startedAt={attempt.startedAt} limitSec={attempt.limitSec} strict={attempt.strict} onExpire={() => attempt.strict && submit(true)} />
              )}
              {isAudio && (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {audioMode === "exam" ? <ShieldCheck /> : <Headphones />} {audioMode === "exam" ? r.intro.examMode : r.intro.trainingMode}
                </Badge>
              )}
              <Button onClick={() => (answered < total ? setConfirmOpen(true) : submit(false))} className="shrink-0">
                <Send /> <span className="hidden sm:inline">{t.common.submit}</span>
              </Button>
            </>
          )}
          {phase === "review" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={links.part}>
                <X /> {t.common.close}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {phase === "review" && result && (
        <ResultSummary
          result={result.score}
          durationSec={result.record.durationSec}
          limitSec={result.record.limitSec}
          autoSubmitted={result.record.autoSubmitted}
          best={best !== undefined && best >= 0 ? best : undefined}
          attempts={previous.length}
          onRetry={retry}
          nextHref={links.next}
          partHref={links.part}
        />
      )}

      {phase === "running" && (
        <details className="group rounded-xl border bg-card px-4 py-3 text-sm">
          <summary className="cursor-pointer list-none font-medium">
            <span className="text-muted-foreground">Aufgabe: </span>
            <span className="line-clamp-1 group-open:line-clamp-none">{part.instruction}</span>
          </summary>
          {glosses && <p className="mt-2 text-muted-foreground">{part.instructionEn}</p>}
        </details>
      )}

      {player}

      {phase === "review" && <Glossary items={set.glossary} />}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{r.confirm.title(total - answered)}</AlertDialogTitle>
            <AlertDialogDescription>{r.confirm.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{r.confirm.keepWorking}</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit(false)}>{r.confirm.submitAnyway}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/80 px-3 py-2.5">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

function ModeCard({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start justify-start rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40",
        active && "border-primary ring-2 ring-primary/25",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon} {title}
      </span>
      <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
    </button>
  );
}
