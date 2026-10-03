"use client";

import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  CircleX,
  ClipboardList,
  ExternalLink,
  FastForward,
  Headphones,
  Loader2,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Rewind,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { CountdownTimer } from "@/components/exam/countdown-timer";
import { WritingFeedbackView } from "@/components/writing/feedback-view";
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
import { useLocale, useT } from "@/i18n/client";
import { formatLongDate, formatNumber } from "@/i18n/format";
import { aiFetch, useAiAvailability } from "@/lib/ai/request";
import { READING_MINUTES, WRITING_MINUTES } from "@/lib/exam/mock";
import { useExam } from "@/lib/exams/use-exam";
import { answerSheet, completeKey, scoreSheet, type SheetAnswers, type SheetPart } from "@/lib/official/sheet";
import { useHydrated } from "@/lib/store/hydration";
import { OFFICIAL_STAGES, useOfficial, type OfficialRun, type OfficialStage, type OfficialWriting } from "@/lib/store/official";
import type { WritingFeedback } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";

export interface OfficialTestView {
  id: string;
  title: string;
  source?: string;
  pages: Partial<Record<"lesen" | "sprachbausteine" | "hoeren" | "schreiben" | "sprechen" | "loesungen" | "hoertexte", number>>;
  key?: SheetAnswers;
  audioUrl?: string;
  bookletUrl?: string;
}

const STAGE_SECTIONS: Record<OfficialStage, string[]> = { lesen: ["lesen", "sprachbausteine"], hoeren: ["hoeren"], schreiben: [] };
const STAGE_ICONS = { lesen: BookOpen, hoeren: Headphones, schreiben: PenLine };
/** Seconds to finish marking after the recording ended (exam conditions). */
const MARKING_SECONDS = 60;

/* ------------------------------------------------------------------ */

export function OfficialTestRunner(props: { test: OfficialTestView; examSlug: string }) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-[32rem] rounded-2xl" />;
  return <Runner {...props} />;
}

function Runner({ test, examSlug }: { test: OfficialTestView; examSlug: string }) {
  const exam = useExam(examSlug);
  const run = useOfficial((s) => s.runs[test.id]);
  const storedKey = useOfficial((s) => s.keys[test.id]);
  const results = useOfficial((s) => s.results[test.id]);
  const key = completeKey(exam, test.key) ? test.key : completeKey(exam, storedKey) ? storedKey : undefined;
  const [view, setView] = useState<"overview" | "result">("overview");

  if (run) return <StageView test={test} run={run} examSlug={examSlug} onDone={() => setView("result")} />;
  if (view === "result" && results?.length)
    return <ResultView test={test} examSlug={examSlug} answerKey={key} resultIndex={results.length - 1} onAgain={() => setView("overview")} />;
  return <Overview test={test} examSlug={examSlug} answerKey={key} onShowResult={() => setView("result")} />;
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function useAudioMinutes(url?: string) {
  const [minutes, setMinutes] = useState<number | null>(null);
  useEffect(() => {
    if (!url) return;
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => setMinutes(Math.round(audio.duration / 60));
    audio.src = url;
    return () => {
      audio.onloadedmetadata = null;
      audio.src = "";
    };
  }, [url]);
  return minutes;
}

function Overview({ test, examSlug, answerKey, onShowResult }: { test: OfficialTestView; examSlug: string; answerKey?: SheetAnswers; onShowResult: () => void }) {
  const t = useT();
  const to = t.official;
  const locale = useLocale();
  const exam = useExam(examSlug);
  const start = useOfficial((s) => s.start);
  const results = useOfficial((s) => s.results[test.id]);
  const strict = useSettings((s) => s.strictTimer);
  const [mode, setMode] = useState<OfficialRun["mode"]>(strict ? "exam" : "training");
  const audioMinutes = useAudioMinutes(test.audioUrl);
  const minutes: Record<OfficialStage, number> = { lesen: READING_MINUTES, hoeren: audioMinutes ?? 25, schreiben: WRITING_MINUTES };
  const available = (s: OfficialStage) => (s === "hoeren" ? !!test.audioUrl : true);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-linear-to-br from-hoeren/12 via-card to-card p-6 sm:p-8">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="size-3.5" /> {to.badge}
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{test.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{to.lead}</p>
        {test.source && (
          <a href={test.source} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            {to.source} <ExternalLink className="size-3.5" />
          </a>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {(["exam", "training"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-2xl border p-4 text-left transition-colors", mode === m ? "border-primary bg-primary/5" : "bg-background/70 hover:bg-muted")}
            >
              <div className="font-semibold">{to.modes[m]}</div>
              <div className="text-sm text-muted-foreground">{m === "exam" ? to.modes.examHint : to.modes.trainingHint}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {OFFICIAL_STAGES.map((stage) => {
            const Icon = STAGE_ICONS[stage];
            return (
              <div key={stage} className="flex flex-col rounded-2xl border bg-background/70 p-4">
                <Icon className="size-5 text-primary" />
                <div className="mt-2 font-semibold">{to.stages[stage]}</div>
                <div className="flex-1 text-sm text-muted-foreground">{to.stageHints[stage](minutes[stage])}</div>
                <Button variant="outline" size="sm" className="mt-3 self-start" disabled={!available(stage)} onClick={() => start(test.id, mode, [stage])}>
                  {to.startStage}
                </Button>
              </div>
            );
          })}
        </div>
        <Button size="lg" className="mt-5" onClick={() => start(test.id, mode, OFFICIAL_STAGES.filter(available))}>
          {to.startAll} <ArrowRight />
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">{to.notice}</p>
      </section>

      {!answerKey && <KeyEntry testId={test.id} examSlug={examSlug} page={test.pages.loesungen} />}

      {results?.length ? (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">{to.result.attempts}</h2>
          <ul className="mt-3 divide-y text-sm">
            {[...results].reverse().slice(0, 8).map((r) => {
              const score = answerKey ? scoreSheet(exam, r.answers, answerKey, r.stages.flatMap((s) => STAGE_SECTIONS[s])) : null;
              return (
                <li key={r.at} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{formatLongDate(r.at, locale)}</span>
                  <span className="text-muted-foreground">{r.stages.map((s) => to.stages[s]).join(" · ")}</span>
                  {score && <span className="font-medium tabular">{to.card.lastResult(formatNumber(score.points, locale), score.maxPoints)}</span>}
                </li>
              );
            })}
          </ul>
          <Button variant="ghost" size="sm" className="mt-2" onClick={onShowResult}>
            {to.result.title} <ArrowRight />
          </Button>
        </section>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One part of the exam                                                */
/* ------------------------------------------------------------------ */

function StageView({ test, run, examSlug, onDone }: { test: OfficialTestView; run: OfficialRun; examSlug: string; onDone: () => void }) {
  const t = useT();
  const to = t.official;
  const exam = useExam(examSlug);
  const startStage = useOfficial((s) => s.startStage);
  const finishStage = useOfficial((s) => s.finishStage);
  const discard = useOfficial((s) => s.discard);
  const setAnswer = useOfficial((s) => s.setAnswer);
  const [confirm, setConfirm] = useState(false);
  const [pane, setPane] = useState<"booklet" | "sheet">("sheet");
  const stage = run.stages[run.current];
  const startedAt = run.startedAt[stage];
  const sheet = useMemo(() => answerSheet(exam).filter((sp) => STAGE_SECTIONS[stage].includes(sp.part.sectionId)), [exam, stage]);
  const numbers = sheet.flatMap((sp) => sp.numbers);
  const open = numbers.filter((n) => run.answers[n] === undefined).length;
  const page = stage === "lesen" ? test.pages.lesen : stage === "hoeren" ? test.pages.hoeren : test.pages.schreiben;
  const strict = run.mode === "exam";
  const writing = useWritingCorrection(test.id, examSlug);

  // Reading and writing start with the part; the recording starts when the learner presses play.
  useEffect(() => {
    if (stage !== "hoeren") startStage(test.id);
  }, [stage, test.id, startStage]);

  const finish = () => {
    setConfirm(false);
    if (stage === "schreiben") writing.request(run.writing);
    const last = run.current === run.stages.length - 1;
    finishStage(test.id);
    window.scrollTo({ top: 0 });
    if (last) onDone();
  };

  const limit = stage === "lesen" ? READING_MINUTES * 60 : stage === "schreiben" ? WRITING_MINUTES * 60 : null;

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-muted-foreground">
            {test.title} · {to.modes[run.mode]}
          </div>
          <div className="font-semibold">{to.stages[stage]}</div>
        </div>
        {numbers.length > 0 && <span className="text-xs text-muted-foreground tabular">{to.answered(numbers.length - open, numbers.length)}</span>}
        {limit && startedAt && <CountdownTimer startedAt={startedAt} limitSec={limit} strict={strict} onExpire={strict ? finish : undefined} compact />}
        <Button size="sm" onClick={() => (open > 0 ? setConfirm(true) : finish())}>
          {to.finishStage}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => discard(test.id)}>
          {to.discard}
        </Button>
      </div>

      <div className="flex gap-2 lg:hidden">
        {(["booklet", "sheet"] as const).map((p) => (
          <Button key={p} size="sm" variant={pane === p ? "secondary" : "ghost"} onClick={() => setPane(p)}>
            {p === "booklet" ? <BookOpen /> : <ClipboardList />} {p === "booklet" ? to.booklet : to.sheet}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn(pane === "booklet" ? "block" : "hidden", "lg:block")}>
          <Booklet url={test.bookletUrl} page={page} />
        </div>
        <div className={cn(pane === "sheet" ? "block" : "hidden", "space-y-4 lg:block")}>
          {stage === "hoeren" && test.audioUrl && (
            <OfficialAudio
              url={test.audioUrl}
              mode={run.mode}
              startedAt={startedAt}
              onStart={() => startStage(test.id)}
              onMarkingOver={finish}
            />
          )}
          {stage === "schreiben" ? (
            <WritingPanel testId={test.id} writing={run.writing} taskPage={test.pages.schreiben} />
          ) : (
            <AnswerSheet parts={sheet} answers={run.answers} onAnswer={(n, v) => setAnswer(test.id, n, v)} />
          )}
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{to.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{to.confirmText(open)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{to.keepWorking}</AlertDialogCancel>
            <AlertDialogAction onClick={finish}>{to.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Booklet({ url, page }: { url?: string; page?: number }) {
  const to = useT().official;
  if (!url) return null;
  const src = `${url}#page=${page ?? 1}&view=FitH`;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
        <span>{page ? to.page(page) : to.booklet}</span>
        <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      {/* key: jump to the right page when the part changes */}
      <iframe key={src} src={src} title={to.booklet} className="h-[calc(100svh-13rem)] min-h-[32rem] w-full bg-white" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Answer sheet (Antwortbogen)                                         */
/* ------------------------------------------------------------------ */

const LABEL: Record<string, string> = { r: "richtig", f: "falsch" };

function AnswerSheet({
  parts,
  answers,
  onAnswer,
  answerKey,
}: {
  parts: SheetPart[];
  answers: SheetAnswers;
  onAnswer?: (n: number, value: string | null) => void;
  /** Review mode: show the key and mark answers right/wrong. */
  answerKey?: SheetAnswers;
}) {
  return (
    <div className="space-y-4">
      {parts.map(({ part, numbers, options }) => (
        <section key={part.id} className="rounded-2xl border bg-card p-3">
          <h3 className="px-1 pb-2 text-sm font-semibold">
            {part.sectionId === "lesen" ? "Leseverstehen" : part.sectionId === "sprachbausteine" ? "Sprachbausteine" : "Hörverstehen"} · Teil {part.teil}{" "}
            <span className="font-normal text-muted-foreground tabular">
              ({numbers[0]}–{numbers[numbers.length - 1]})
            </span>
          </h3>
          <ol className="space-y-1.5">
            {numbers.map((n) => {
              const given = answers[n];
              const correct = answerKey?.[n];
              const ok = correct !== undefined && given === correct;
              return (
                <li key={n} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-semibold tabular",
                      answerKey ? (ok ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive") : given ? "bg-primary/12 text-primary" : "bg-muted",
                    )}
                  >
                    {n}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-1">
                    {options.map((o) => {
                      const selected = given === o;
                      const isKey = answerKey && correct === o;
                      return (
                        <button
                          key={o}
                          type="button"
                          disabled={!onAnswer}
                          aria-pressed={selected}
                          onClick={() => onAnswer?.(n, selected ? null : o)}
                          className={cn(
                            "h-8 rounded-lg border px-2 text-sm transition-colors",
                            o.length === 1 ? "min-w-8" : "px-3",
                            !answerKey && (selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"),
                            answerKey && isKey && "border-success bg-success/15 font-semibold",
                            answerKey && selected && !isKey && "border-destructive bg-destructive/10 line-through",
                            answerKey && !selected && !isKey && "opacity-40",
                          )}
                        >
                          {LABEL[o] ?? o}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The real recording                                                  */
/* ------------------------------------------------------------------ */

function OfficialAudio({
  url,
  mode,
  startedAt,
  onStart,
  onMarkingOver,
}: {
  url: string;
  mode: OfficialRun["mode"];
  startedAt?: number;
  onStart: () => void;
  onMarkingOver: () => void;
}) {
  const to = useT().official;
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const exam = mode === "exam";

  const play = () => {
    const audio = ref.current;
    if (!audio) return;
    // After a reload in exam mode the recording continues where the clock says it is.
    if (exam && startedAt) audio.currentTime = Math.min((Date.now() - startedAt) / 1000, audio.duration || Infinity);
    void audio.play();
    onStart();
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-hoeren/12 via-card to-card p-4">
      <audio
        ref={ref}
        src={url}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setEndedAt(Date.now());
        }}
      />
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-hoeren text-white">
          <Headphones className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{endedAt ? to.audio.ended : playing ? to.audio.running : to.audio.start}</div>
          <div className="font-mono text-xs text-muted-foreground tabular">
            {formatClock(time)} / {formatClock(duration)}
          </div>
        </div>
        {endedAt && exam ? (
          <CountdownTimer startedAt={endedAt} limitSec={MARKING_SECONDS} strict onExpire={onMarkingOver} compact />
        ) : exam ? (
          !playing && (
            <Button size="sm" className="bg-hoeren text-white hover:bg-hoeren/90" onClick={play}>
              <Play /> {startedAt ? to.resume : to.audio.start}
            </Button>
          )
        ) : (
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" aria-label={to.audio.back} onClick={() => ref.current && (ref.current.currentTime = Math.max(0, ref.current.currentTime - 10))}>
              <Rewind />
            </Button>
            <Button size="icon-sm" className="bg-hoeren text-white hover:bg-hoeren/90" aria-label={playing ? to.audio.pause : to.audio.play} onClick={() => (playing ? ref.current?.pause() : play())}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={to.audio.forward} onClick={() => ref.current && (ref.current.currentTime += 10)}>
              <FastForward />
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hoeren/15">
        <div className="h-full rounded-full bg-hoeren transition-[width]" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
      </div>
      {!exam && duration > 0 && (
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={time}
          onChange={(e) => ref.current && (ref.current.currentTime = Number(e.target.value))}
          className="mt-2 w-full accent-hoeren"
          aria-label={to.audio.start}
        />
      )}
      {exam && !startedAt && <p className="mt-3 text-xs text-muted-foreground">{to.audio.startHint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schriftlicher Ausdruck                                              */
/* ------------------------------------------------------------------ */

function WritingPanel({ testId, writing, taskPage }: { testId: string; writing: OfficialWriting; taskPage?: number }) {
  const to = useT().official;
  const setWriting = useOfficial((s) => s.setWriting);
  const ai = useAiAvailability();
  const words = writing.text.trim() ? writing.text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <label className="block text-sm font-medium">
        {to.writing.subject}
        <input
          value={writing.subject}
          onChange={(e) => setWriting(testId, { subject: e.target.value })}
          lang="de"
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <textarea
        value={writing.text}
        onChange={(e) => setWriting(testId, { text: e.target.value })}
        placeholder={to.writing.placeholder}
        lang="de"
        spellCheck={false}
        className="min-h-80 w-full rounded-xl border bg-background p-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="text-right text-xs text-muted-foreground tabular">{to.writing.words(words)}</div>
      {ai.available && (
        <details className="rounded-xl border p-3" open={!!writing.task}>
          <summary className="cursor-pointer text-sm font-medium">
            <Sparkles className="mr-1 inline size-3.5 text-primary" /> {to.writing.taskLabel}
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">{to.writing.taskHint(taskPage ?? 1)}</p>
          <textarea
            value={writing.task}
            onChange={(e) => setWriting(testId, { task: e.target.value })}
            placeholder={to.writing.taskPlaceholder}
            lang="de"
            className="mt-2 min-h-28 w-full rounded-lg border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </details>
      )}
    </div>
  );
}

/** Corrections in flight (not persisted: a reload simply offers the correction again). */
const useCorrections = create<{ pending: Record<string, boolean>; error: Record<string, string | undefined> }>(() => ({ pending: {}, error: {} }));

/** AI correction of the booklet task – runs in the background and lands in the run or the saved result. */
function useWritingCorrection(testId: string, examSlug: string) {
  const locale = useLocale();
  const failed = useT().official.writing.correctionFailed;
  const setWriting = useOfficial((s) => s.setWriting);
  const isPending = useCorrections((s) => !!s.pending[testId]);
  const error = useCorrections((s) => s.error[testId]);
  const mark = (pending: boolean, err?: string) =>
    useCorrections.setState((s) => ({ pending: { ...s.pending, [testId]: pending }, error: { ...s.error, [testId]: err } }));
  return {
    pending: isPending,
    error,
    request: (w: OfficialWriting) => {
      if (w.task.trim().length < 40 || w.text.trim().length < 20 || useCorrections.getState().pending[testId]) return;
      mark(true);
      void aiFetch("/api/ai/schreiben", { examId: examSlug, customTask: w.task, subject: w.subject, text: w.text, minutesUsed: WRITING_MINUTES, locale })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as { feedback?: WritingFeedback; error?: string };
          if (data.feedback) {
            setWriting(testId, { feedback: data.feedback });
            mark(false);
          } else mark(false, data.error || failed);
        })
        .catch(() => mark(false, failed));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

function ResultView({
  test,
  examSlug,
  answerKey,
  resultIndex,
  onAgain,
}: {
  test: OfficialTestView;
  examSlug: string;
  answerKey?: SheetAnswers;
  resultIndex: number;
  onAgain: () => void;
}) {
  const t = useT();
  const to = t.official;
  const locale = useLocale();
  const exam = useExam(examSlug);
  const result = useOfficial((s) => s.results[test.id]?.[resultIndex]);
  const setWriting = useOfficial((s) => s.setWriting);
  const correction = useWritingCorrection(test.id, examSlug);
  if (!result) return null;

  const sections = result.stages.flatMap((s) => STAGE_SECTIONS[s]);
  const score = answerKey ? scoreSheet(exam, result.answers, answerKey, sections) : null;
  const writingPoints = result.writing ? (result.writing.feedback?.total ?? result.writing.selfPoints) : undefined;
  const allStages = OFFICIAL_STAGES.every((s) => result.stages.includes(s));
  const written = score && allStages && writingPoints !== undefined ? score.points + writingPoints : null;
  const sectionName = (id: string) => exam.sections.find((s) => s.id === id)?.name ?? id;
  const sheet = answerSheet(exam).filter((sp) => sections.includes(sp.part.sectionId));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-linear-to-br from-primary/12 via-card to-card p-6 sm:p-8">
        <div className="text-xs font-semibold tracking-wider text-primary uppercase">{to.result.title}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{test.title}</h1>
        {written !== null && (
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold tabular">{formatNumber(written, locale)}</span>
            <span className="text-muted-foreground">/ {exam.written.maxPoints}</span>
            <Badge className={written >= exam.written.passPoints ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive"}>
              {written >= exam.written.passPoints ? to.result.passed : to.result.notPassed}
            </Badge>
            <span className="text-sm text-muted-foreground">{to.result.passMark(exam.written.passPoints)}</span>
          </div>
        )}
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {score &&
            Object.entries(score.bySection).map(([id, s]) => (
              <div key={id} className="rounded-xl border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground">{sectionName(id)}</div>
                <div className="text-xl font-semibold tabular">
                  {formatNumber(s.points, locale)} <span className="text-sm font-normal text-muted-foreground">/ {s.maxPoints}</span>
                </div>
              </div>
            ))}
          {result.writing && (
            <div className="rounded-xl border bg-background/70 p-3">
              <div className="text-xs text-muted-foreground">{sectionName("schreiben")}</div>
              {writingPoints !== undefined ? (
                <div className="text-xl font-semibold tabular">
                  {writingPoints} <span className="text-sm font-normal text-muted-foreground">/ 45</span>
                </div>
              ) : correction.pending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {to.writing.correcting}
                </div>
              ) : (
                <label className="mt-1 block text-xs text-muted-foreground">
                  {to.writing.selfScore}
                  <input
                    type="number"
                    min={0}
                    max={45}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(45, Math.round(Number(e.target.value))));
                      if (!Number.isNaN(v)) setWriting(test.id, { selfPoints: v });
                    }}
                    className="mt-1 h-8 w-20 rounded-lg border bg-background px-2 text-sm text-foreground"
                  />
                </label>
              )}
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onAgain}>
            <RotateCcw /> {to.result.again}
          </Button>
          {result.writing && !result.writing.feedback && result.writing.task.trim().length >= 40 && !correction.pending && (
            <Button variant="outline" onClick={() => correction.request(result.writing!)}>
              <Sparkles /> {to.writing.correct}
            </Button>
          )}
        </div>
        {correction.error && <p className="mt-3 text-sm text-destructive">{correction.error}</p>}
      </section>

      {result.writing?.feedback && (
        <WritingFeedbackView feedback={result.writing.feedback} text={result.writing.text} subject={result.writing.subject} rubric={exam.writingRubric} />
      )}

      {score && answerKey && sheet.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{to.result.answers}</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {test.bookletUrl && test.pages.loesungen && (
                <a href={`${test.bookletUrl}#page=${test.pages.loesungen}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {to.page(test.pages.loesungen)} <ExternalLink className="size-3.5" />
                </a>
              )}
              {test.bookletUrl && test.pages.hoertexte && sections.includes("hoeren") && (
                <a href={`${test.bookletUrl}#page=${test.pages.hoertexte}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {to.result.transcripts(test.pages.hoertexte)} <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CircleCheck className="size-3.5 text-success" /> {to.result.key}
            </span>
            <span className="flex items-center gap-1">
              <CircleX className="size-3.5 text-destructive" /> {to.result.yours}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <AnswerSheet parts={sheet} answers={result.answers} answerKey={answerKey} />
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Answer key entry (for tests without a key in info.json)            */
/* ------------------------------------------------------------------ */

function KeyEntry({ testId, examSlug, page }: { testId: string; examSlug: string; page?: number }) {
  const to = useT().official;
  const exam = useExam(examSlug);
  const stored = useOfficial((s) => s.keys[testId]);
  const setKey = useOfficial((s) => s.setKey);
  const [draft, setDraft] = useState<SheetAnswers>(stored ?? {});
  const sheet = answerSheet(exam);
  const missing = sheet.reduce((n, sp) => n + sp.numbers.filter((x) => draft[x] === undefined).length, 0);
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{to.key.title}</h2>
      <p className="text-sm text-muted-foreground">{to.key.hint(page ?? 1)}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnswerSheet
          parts={sheet}
          answers={draft}
          onAnswer={(n, v) =>
            setDraft((d) => {
              const next = { ...d };
              if (v === null) delete next[n];
              else next[n] = v;
              return next;
            })
          }
        />
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={missing > 0} onClick={() => setKey(testId, draft)}>
          {to.key.save}
        </Button>
        {missing > 0 && <span className="text-sm text-muted-foreground">{to.key.missing(missing)}</span>}
      </div>
    </section>
  );
}
