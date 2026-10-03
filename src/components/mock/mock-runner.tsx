"use client";

import { ArrowRight, BookOpen, Headphones, Loader2, PenLine, Play, ShieldCheck, Trophy, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/exam/countdown-timer";
import { formatPoints, ScoreRing } from "@/components/exam/result-summary";
import { ScoredPlayer } from "@/components/exam/scored-player";
import { UmlautBar } from "@/components/writing/editor-tools";
import { EmailCard } from "@/components/writing/email-card";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WritingSet } from "@/lib/content/schemas";
import { LISTENING_PARTS, READING_MINUTES, READING_PARTS, WRITING_MINUTES } from "@/lib/exam/mock";
import { mistakeCard, scoreSet, type ScoredSet } from "@/lib/exam/scoring";
import { SECTION_UI } from "@/lib/exam/ui";
import { gradeFor, type PartDefinition, type WritingRubric } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useHydrated } from "@/lib/store/hydration";
import { useMock, type MockResult } from "@/lib/store/mock";
import { attemptKey, uid, useProgress, type Answers, type WritingFeedback } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { wordCount } from "@/lib/utils/text";
import { aiFetch, aiUsable } from "@/lib/ai/request";

export interface MockPart {
  part: PartDefinition;
  sectionName: string;
  number: string;
  set: ScoredSet | WritingSet;
}

export interface MockRunnerProps {
  examId: string;
  mockId: string;
  title: string;
  parts: MockPart[];
  rubric: WritingRubric;
  listHref: string;
}

export function MockRunner(props: MockRunnerProps) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-[30rem] rounded-2xl" />;
  return <Runner {...props} />;
}

function Runner({ examId, mockId, title, parts, rubric, listHref }: MockRunnerProps) {
  const exam = useExam(examId);
  const locale = useLocale();
  const t = useT();
  const tr = t.mock;
  const run = useMock((s) => s.runs[mockId]);
  const start = useMock((s) => s.start);
  const patch = useMock((s) => s.patch);
  const storeAnswers = useMock((s) => s.setAnswers);
  const abandon = useMock((s) => s.abandon);
  const saveResult = useMock((s) => s.saveResult);
  const results = useMock((s) => s.results);
  const strictSetting = useSettings((s) => s.strictTimer);
  const finishAttempt = useProgress((s) => s.finishAttempt);
  const saveWriting = useProgress((s) => s.saveWriting);
  const [resultId, setResultId] = useState<string | null>(null);
  const result = results.find((r) => r.id === resultId);

  useFocusMode(!!run && run.stage !== "done");

  const reading = parts.filter((p) => (READING_PARTS as readonly string[]).includes(p.part.id));
  const listening = parts.filter((p) => (LISTENING_PARTS as readonly string[]).includes(p.part.id));
  const writingPart = parts.find((p) => p.set.type === "writing-email") as (MockPart & { set: WritingSet }) | undefined;

  const finishExam = useCallback(async () => {
    const current = useMock.getState().runs[mockId];
    if (!current) return;
    const now = Date.now();
    const partScores: MockResult["parts"] = {};
    let points = 0;
    for (const p of [...reading, ...listening]) {
      const set = p.set as ScoredSet;
      const answers = current.answers[p.part.id] ?? {};
      const score = scoreSet(set, p.part, answers);
      partScores[p.part.id] = { points: score.points, maxPoints: score.maxPoints, correct: score.correct, total: score.total };
      points += score.points;
      // Count mock answers in the normal statistics and the mistake trainer.
      finishAttempt(
        attemptKey(examId, set.id, "mock"),
        {
          examId,
          partId: p.part.id,
          setId: set.id,
          startedAt: current.readingStartedAt,
          finishedAt: now,
          durationSec: 0,
          limitSec: p.part.minutes * 60,
          overtimeSec: 0,
          strict: current.strict,
          autoSubmitted: false,
          correct: score.correct,
          total: score.total,
          points: score.points,
          maxPoints: score.maxPoints,
          answers,
          context: "mock",
        },
        score.items.filter((i) => !i.ok).map((i) => mistakeCard(set, p.part, i.n, i.given, locale)),
        [],
      );
    }
    const id = uid();
    const res: MockResult = {
      id,
      mockId,
      finishedAt: now,
      parts: partScores,
      writing: { text: current.writing.text, subject: current.writing.subject },
      writtenPoints: points,
    };
    saveResult(res);
    setResultId(id);
    abandon(mockId);
    window.scrollTo({ top: 0 });

    if (writingPart && current.writing.text.trim().split(/\s+/).length >= 10) {
      const writingStarted = current.writingStartedAt ?? now;
      saveWriting({
        id: `${id}-w`,
        examId,
        setId: writingPart.set.id,
        subject: current.writing.subject,
        text: current.writing.text,
        wordCount: wordCount(current.writing.text),
        startedAt: writingStarted,
        finishedAt: now,
        durationSec: Math.round((now - writingStarted) / 1000),
        limitSec: WRITING_MINUTES * 60,
        autoSubmitted: false,
      });
      try {
        if (!(await aiUsable())) return;
        const resp = await aiFetch("/api/ai/schreiben", {
          examId,
          setNumber: writingPart.number,
          subject: current.writing.subject,
          text: current.writing.text,
          minutesUsed: (now - writingStarted) / 60000,
          locale,
        });
        const data = (await resp.json()) as { feedback?: WritingFeedback; error?: string };
        if (data.feedback) {
          saveResult({ ...res, writing: { ...res.writing!, feedback: data.feedback }, writtenPoints: points + data.feedback.total });
        } else if (data.error) toast.error(data.error);
      } catch {
        toast.error(tr.toasts.feedbackFailed);
      }
    }
  }, [abandon, examId, finishAttempt, listening, locale, mockId, reading, saveResult, saveWriting, tr, writingPart]);

  /* ---------------- results ---------------- */
  if (result) return <MockResults result={result} parts={parts} rubric={rubric} examSlug={exam.slug} listHref={listHref} writing={writingPart?.set} />;

  /* ---------------- intro ---------------- */
  if (!run) {
    const previous = results.filter((r) => r.mockId === mockId);
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-gold/15 via-card to-card">
          <div className="space-y-4 p-6 sm:p-8">
            <Badge variant="outline" className="bg-background">
              <Trophy className="text-gold" /> Modelltest
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{tr.intro.text}</p>
            <ol className="space-y-2">
              <Stage icon={<BookOpen className="size-4" />} title="Leseverstehen + Sprachbausteine" text={tr.intro.reading(READING_MINUTES)} />
              <Stage icon={<Headphones className="size-4" />} title="Hörverstehen" text={tr.intro.listening} />
              <Stage icon={<PenLine className="size-4" />} title="Schriftlicher Ausdruck" text={tr.intro.writing(WRITING_MINUTES)} />
            </ol>
            <div className="flex items-start gap-2 rounded-xl border bg-background/80 p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{strictSetting ? tr.intro.strictOn : tr.intro.strictOff}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => start(mockId, strictSetting)}>
                <Play /> {tr.intro.start}
              </Button>
              <Button variant="ghost" asChild>
                <Link href={listHref}>{tr.allMocks}</Link>
              </Button>
              {previous.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {tr.intro.taken(previous.length, formatPoints(Math.max(...previous.map((p) => p.writtenPoints)), locale), exam.written.maxPoints)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MockHeader title={title} stage={run.stage} onAbort={() => abandon(mockId)} listHref={listHref}>
        {run.stage === "reading" && (
          <CountdownTimer
            startedAt={run.readingStartedAt}
            limitSec={READING_MINUTES * 60}
            strict={run.strict}
            onExpire={() => {
              if (!run.strict) return;
              toast.info(tr.toasts.readingTimeUp);
              patch(mockId, { stage: "listening", listeningIndex: 0 });
            }}
          />
        )}
        {run.stage === "writing" && run.writingStartedAt && (
          <CountdownTimer
            startedAt={run.writingStartedAt}
            limitSec={WRITING_MINUTES * 60}
            strict={run.strict}
            onExpire={() => {
              if (!run.strict) return;
              toast.info(tr.toasts.writingTimeUp);
              void finishExam();
            }}
          />
        )}
      </MockHeader>

      {run.stage === "reading" && (
        <ReadingStage
          mockId={mockId}
          parts={reading}
          answers={run.answers}
          onAnswers={(partId, a) => storeAnswers(mockId, partId, a)}
          onFinish={() => patch(mockId, { stage: "listening", listeningIndex: 0 })}
          strict={run.strict}
          startedAt={run.readingStartedAt}
        />
      )}
      {run.stage === "listening" && (
        <ListeningStage
          key={run.listeningIndex}
          parts={listening}
          index={run.listeningIndex}
          answers={run.answers}
          onAnswers={(partId, a) => storeAnswers(mockId, partId, a)}
          onPartDone={() =>
            run.listeningIndex < listening.length - 1
              ? patch(mockId, { listeningIndex: run.listeningIndex + 1 })
              : patch(mockId, { stage: "writing", writingStartedAt: Date.now() })
          }
        />
      )}
      {run.stage === "writing" && writingPart && (
        <WritingStage
          task={writingPart.set}
          value={run.writing}
          onChange={(w) => patch(mockId, { writing: w })}
          onFinish={() => void finishExam()}
        />
      )}
    </div>
  );
}

function Stage({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3 rounded-xl border bg-background/80 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </li>
  );
}

function MockHeader({ title, stage, onAbort, listHref, children }: { title: string; stage: string; onAbort: () => void; listHref: string; children?: React.ReactNode }) {
  const tr = useT().mock.header;
  const [confirm, setConfirm] = useState(false);
  const steps = [
    { id: "reading", label: "Lesen & Sprachbausteine" },
    { id: "listening", label: "Hören" },
    { id: "writing", label: "Schreiben" },
  ];
  const current = steps.findIndex((s) => s.id === stage);
  return (
    <div className="sticky top-14 z-20 -mx-4 border-b bg-background/85 px-4 py-2.5 backdrop-blur-md sm:-mx-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-gold">{title}</div>
          <div className="flex items-center gap-1.5 text-sm">
            {steps.map((s, i) => (
              <span key={s.id} className={cn("flex items-center gap-1.5", i === current ? "font-semibold" : i < current ? "text-muted-foreground line-through" : "text-muted-foreground")}>
                {i > 0 && <ArrowRight className="size-3 opacity-50" />}
                {s.label}
              </span>
            ))}
          </div>
        </div>
        {children}
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirm(true)} aria-label={tr.abortLabel}>
          <X />
        </Button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.abortTitle}</AlertDialogTitle>
            <AlertDialogDescription>{tr.abortText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.continue}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={listHref} onClick={onAbort}>
                {tr.abort}
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Keeps a local copy of a part's answers so players can update two items in one go. */
function usePartAnswers(initial: Answers | undefined, onChange: (a: Answers) => void) {
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const first = useRef(true);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChangeRef.current(answers);
  }, [answers]);
  const onAnswer = (n: number, value: string | null) =>
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === null) delete next[String(n)];
      else next[String(n)] = value;
      return next;
    });
  return { answers, onAnswer };
}

function ReadingStage({
  parts,
  answers,
  onAnswers,
  onFinish,
}: {
  mockId: string;
  parts: MockPart[];
  answers: Record<string, Answers>;
  onAnswers: (partId: string, a: Answers) => void;
  onFinish: () => void;
  strict: boolean;
  startedAt: number;
}) {
  const tr = useT().mock.reading;
  const [tab, setTab] = useState(parts[0]?.part.id);
  const [confirm, setConfirm] = useState(false);
  const current = parts.find((p) => p.part.id === tab) ?? parts[0];
  const answeredTotal = parts.reduce((n, p) => n + Object.keys(answers[p.part.id] ?? {}).length, 0);
  const itemsTotal = parts.reduce((n, p) => n + p.part.items, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((p) => {
          const ui = SECTION_UI[p.part.sectionId];
          const count = Object.keys(answers[p.part.id] ?? {}).length;
          return (
            <button
              key={p.part.id}
              type="button"
              onClick={() => {
                setTab(p.part.id);
                window.scrollTo({ top: 0 });
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                tab === p.part.id ? "border-primary bg-primary/8 font-semibold" : "bg-card hover:bg-muted",
              )}
            >
              <ui.icon className={cn("size-4", ui.text)} />
              {p.sectionName} {p.part.teil}
              <span className={cn("rounded-full px-1.5 text-[11px] tabular", count === p.part.items ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                {count}/{p.part.items}
              </span>
            </button>
          );
        })}
        <Button className="ml-auto" onClick={() => setConfirm(true)}>
          {tr.finish} <ArrowRight />
        </Button>
      </div>
      <div className="rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium">{current.part.instruction}</span>
      </div>
      <PartPlayer key={current.part.id} part={current} initial={answers[current.part.id]} onAnswers={(a) => onAnswers(current.part.id, a)} />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.finishTitle}</AlertDialogTitle>
            <AlertDialogDescription>{tr.finishText(answeredTotal, itemsTotal)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.keepWorking}</AlertDialogCancel>
            <AlertDialogAction onClick={onFinish}>{tr.toListening}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartPlayer({
  part,
  initial,
  onAnswers,
  audio,
}: {
  part: MockPart;
  initial?: Answers;
  onAnswers: (a: Answers) => void;
  audio?: { started: boolean; onComplete: () => void };
}) {
  const { answers, onAnswer } = usePartAnswers(initial, onAnswers);
  return (
    <ScoredPlayer
      set={part.set as ScoredSet}
      part={part.part}
      answers={answers}
      onAnswer={onAnswer}
      review={null}
      audio={{ mode: "exam", started: audio?.started ?? false, onComplete: audio?.onComplete ?? (() => undefined) }}
    />
  );
}

function ListeningStage({
  parts,
  index,
  answers,
  onAnswers,
  onPartDone,
}: {
  parts: MockPart[];
  index: number;
  answers: Record<string, Answers>;
  onAnswers: (partId: string, a: Answers) => void;
  onPartDone: () => void;
}) {
  const tr = useT().mock.listening;
  // Speech needs a user gesture after a reload; between parts the sequence continues automatically.
  const [started, setStarted] = useState(index > 0 && typeof window !== "undefined" && navigator.userActivation?.hasBeenActive);
  const current = parts[index];
  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-hoeren uppercase">{tr.header(current.part.teil, parts.length)}</div>
          <div className="text-sm text-muted-foreground">{current.part.instruction}</div>
        </div>
        {!started && (
          <Button onClick={() => setStarted(true)} className="shrink-0 bg-hoeren text-white hover:bg-hoeren/90">
            <Play /> {tr.start(current.part.teil)}
          </Button>
        )}
      </div>
      <PartPlayer part={current} initial={answers[current.part.id]} onAnswers={(a) => onAnswers(current.part.id, a)} audio={{ started, onComplete: onPartDone }} />
    </div>
  );
}

function WritingStage({
  task,
  value,
  onChange,
  onFinish,
}: {
  task: WritingSet;
  value: { subject: string; text: string };
  onChange: (v: { subject: string; text: string }) => void;
  onFinish: () => void;
}) {
  const tr = useT().mock.writing;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [confirm, setConfirm] = useState(false);
  const words = wordCount(value.text);
  const insert = (snippet: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.text.length;
    const end = el?.selectionEnd ?? value.text.length;
    onChange({ ...value, text: value.text.slice(0, start) + snippet + value.text.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-medium">{task.situation}</p>
        </div>
        <EmailCard stimulus={task.stimulus} />
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 font-semibold">Schreiben Sie etwas zu allen vier Punkten:</div>
          <ul className="list-disc space-y-1 pl-5">
            {task.leitpunkte.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-3 py-2">
            <UmlautBar onInsert={insert} />
          </div>
          <label className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Betreff:</span>
            <input value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} className="min-w-0 flex-1 bg-transparent font-medium outline-none" spellCheck={false} />
          </label>
          <textarea
            ref={ref}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            spellCheck={false}
            lang="de"
            className="reading block min-h-[24rem] w-full resize-y bg-paper px-5 py-4 text-[16px] text-paper-foreground outline-none"
          />
          <div className="border-t px-4 py-2 text-right text-xs text-muted-foreground tabular">{tr.words(words)}</div>
        </div>
        <Button className="w-full" size="lg" onClick={() => setConfirm(true)}>
          {tr.submit}
        </Button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.finishTitle}</AlertDialogTitle>
            <AlertDialogDescription>{tr.finishText(words)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.keepWriting}</AlertDialogCancel>
            <AlertDialogAction onClick={onFinish}>{tr.finish}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MockResults({
  result,
  parts,
  rubric,
  examSlug,
  listHref,
  writing,
}: {
  result: MockResult;
  parts: MockPart[];
  rubric: WritingRubric;
  examSlug: string;
  listHref: string;
  writing?: WritingSet;
}) {
  const exam = useExam(examSlug);
  const locale = useLocale();
  const t = useT();
  const tr = t.mock.results;
  const feedback = result.writing?.feedback;
  const written = result.writtenPoints;
  const pass = written >= exam.written.passPoints;
  const pct = Math.round((written / exam.written.maxPoints) * 100);
  const projected = written + (written / exam.written.maxPoints) * exam.oral.maxPoints;
  const grade = gradeFor(exam, projected);
  const sections = useMemo(
    () =>
      exam.sections
        .filter((s) => s.id !== "sprechen")
        .map((s) => {
          const ids = s.parts.map((p) => p.id);
          const got = s.id === "schreiben" ? (feedback?.total ?? null) : ids.reduce((n, id) => n + (result.parts[id]?.points ?? 0), 0);
          return { section: s, got, max: s.maxPoints };
        }),
    [exam, result, feedback],
  );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <ScoreRing percent={pct} size={128}>
            <div>
              <div className="text-2xl font-bold tabular">{formatPoints(written, locale)}</div>
              <div className="text-[11px] text-muted-foreground">{tr.of(exam.written.maxPoints)}</div>
            </div>
          </ScoreRing>
          <div className="space-y-2">
            <div className={cn("text-xs font-semibold tracking-wider uppercase", pass ? "text-success" : "text-destructive")}>
              {pass ? tr.passed : tr.failed}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tr.heading(formatPoints(written, locale), exam.written.maxPoints)} {feedback ? "" : tr.withoutWriting}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tr.need(exam.written.passPoints)}{" "}
              {feedback ? tr.projection(Math.round(projected), exam.written.maxPoints + exam.oral.maxPoints, grade.label) : tr.writingPending}
            </p>
          </div>
        </div>
        <div className="grid divide-y border-t sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {sections.map(({ section, got, max }) => {
            const ui = SECTION_UI[section.id];
            return (
              <div key={section.id} className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ui.icon className={cn("size-4", ui.text)} /> {section.short}
                </div>
                <div className="mt-1 text-xl font-bold tabular">
                  {got === null ? "–" : formatPoints(got, locale)} <span className="text-sm font-normal text-muted-foreground">/ {max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {parts
          .filter((p) => p.set.type !== "writing-email")
          .map((p) => {
            const score = scoreSet(p.set as ScoredSet, p.part, {});
            const r = result.parts[p.part.id];
            return (
              <AccordionItem key={p.part.id} value={p.part.id} className="rounded-2xl border bg-card px-4">
                <AccordionTrigger>
                  <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                    <span>
                      {p.sectionName} {t.common.teil(p.part.teil)} · {p.set.title}
                    </span>
                    <span className="text-sm text-muted-foreground tabular">
                      {r ? tr.partScore(formatPoints(r.points, locale), r.maxPoints, r.correct, r.total) : `0/${score.maxPoints}`}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ReviewPart part={p} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
      </Accordion>

      {writing && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Schreiben</h2>
          {feedback ? (
            <WritingFeedbackView feedback={feedback} text={result.writing?.text ?? ""} subject={result.writing?.subject ?? ""} task={writing} rubric={rubric} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" /> {tr.yourEmail}
                </div>
                <div className="reading text-[15px] whitespace-pre-wrap">{result.writing?.text || tr.empty}</div>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-2 text-sm font-semibold">{tr.model}</div>
                <div className="reading text-[15px] whitespace-pre-wrap">{writing.model.text}</div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={listHref}>{t.mock.allMocks}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/fehlertrainer">{tr.reviewMistakes}</Link>
        </Button>
      </div>
    </div>
  );
}

/** Read-only review of one part with the learner's answers from the mock attempt. */
function ReviewPart({ part }: { part: MockPart }) {
  const attempts = useProgress((s) => s.attempts);
  const last = [...attempts].reverse().find((a) => a.setId === part.set.id && a.context === "mock");
  const answers = last?.answers ?? {};
  const review = scoreSet(part.set as ScoredSet, part.part, answers);
  return (
    <div className="pb-4">
      <ScoredPlayer set={part.set as ScoredSet} part={part.part} answers={answers} onAnswer={() => undefined} review={review} audio={{ mode: "training", started: false, onComplete: () => undefined }} />
    </div>
  );
}
