"use client";

import { ArrowLeft, ArrowRight, History, Languages, ListChecks, Loader2, Play, RotateCcw, Send, Sparkles, Timer, X } from "lucide-react";
import Link from "@/i18n/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/exam/countdown-timer";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatDuration } from "@/lib/utils/time";
import { useLocale, useT } from "@/i18n/client";
import { formatLongDate, formatNumber, formatShortDate } from "@/i18n/format";
import type { WritingSet } from "@/lib/content/schemas";
import type { PartDefinition, WritingRubric } from "@/lib/exams";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useHydrated } from "@/lib/store/hydration";
import { attemptKey, uid, useProgress, type WritingFeedback, type WritingRecord } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { wordCount } from "@/lib/utils/text";
import { runLiveChecks } from "@/lib/writing/checks";
import { LiveChecksList, PhraseSheet, UmlautBar, type PhraseGroup } from "./editor-tools";
import { EmailCard } from "./email-card";
import { WritingFeedbackView } from "./feedback-view";
import { aiFetch, useAiAvailability } from "@/lib/ai/request";

export interface WritingRunnerProps {
  examId: string;
  set: WritingSet;
  setNumber: string;
  part: PartDefinition;
  rubric: WritingRubric;
  phraseGroups: PhraseGroup[];
  links: { part: string; next?: string };
  tips: string[];
}

type Phase = "intro" | "writing" | "review";

export function WritingRunner(props: WritingRunnerProps) {
  const hydrated = useHydrated();
  if (!hydrated)
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  return <Runner {...props} />;
}

/** null while unknown; true with the user's own key or the server's AI. */
function useAiAvailable() {
  const ai = useAiAvailability();
  return ai.ready ? ai.available : null;
}

function Runner({ examId, set, setNumber, part, rubric, phraseGroups, links, tips }: WritingRunnerProps) {
  const key = attemptKey(examId, set.id);
  const limitSec = part.minutes * 60;
  const strictSetting = useSettings((s) => s.strictTimer);
  const showEnglishDefault = useSettings((s) => s.showEnglish);
  const updateSettings = useSettings((s) => s.update);
  const inProgress = useProgress((s) => s.inProgress[key]);
  const startAttempt = useProgress((s) => s.startAttempt);
  const storeAnswers = useProgress((s) => s.setAnswers);
  const discardAttempt = useProgress((s) => s.discardAttempt);
  const saveWriting = useProgress((s) => s.saveWriting);
  const history = useProgress((s) => s.writing);
  const previous = useMemo(() => history.filter((item) => item.setId === set.id && item.examId === examId), [history, set.id, examId]);
  const aiAvailable = useAiAvailable();
  const t = useT();
  const locale = useLocale();
  const w = t.writing;

  const [phase, setPhase] = useState<Phase>(() => (inProgress ? "writing" : "intro"));
  const [subject, setSubject] = useState(() => inProgress?.answers.subject ?? "");
  const [text, setText] = useState(() => inProgress?.answers.text ?? "");
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [record, setRecord] = useState<WritingRecord | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showEnglish, setShowEnglish] = useState(showEnglishDefault);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);

  useFocusMode(phase === "writing");
  const attempt = useProgress((s) => s.inProgress[key]);

  useEffect(() => {
    if (phase === "writing") storeAnswers(key, { subject, text });
  }, [subject, text, phase, key, storeAnswers]);

  const checks = useMemo(() => runLiveChecks(text, subject, set.register, locale), [text, subject, set.register, locale]);
  const words = wordCount(text);

  const fallbackError = w.review.aiFailedFallback;
  const requestFeedback = useCallback(
    async (rec: WritingRecord) => {
      setAiState("loading");
      setAiError(null);
      try {
        const res = await aiFetch("/api/ai/schreiben", { examId, setNumber, subject: rec.subject, text: rec.text, minutesUsed: rec.durationSec / 60, locale });
        const data = (await res.json().catch(() => ({}))) as { feedback?: WritingFeedback; error?: string };
        if (!res.ok || !data.feedback) {
          // Show the server's message as it arrives; our own text only when there is none.
          setAiState("error");
          setAiError(data.error || fallbackError);
          return;
        }
        const withFeedback = { ...rec, feedback: data.feedback };
        saveWriting(withFeedback);
        setRecord(withFeedback);
        setAiState("idle");
      } catch {
        setAiState("error");
        setAiError(fallbackError);
      }
    },
    [examId, setNumber, saveWriting, locale, fallbackError],
  );

  const submit = useCallback(
    (auto: boolean) => {
      if (submitting.current) return;
      const current = useProgress.getState().inProgress[key];
      if (!current) return;
      submitting.current = true;
      const now = Date.now();
      const rec: WritingRecord = {
        id: uid(),
        examId,
        setId: set.id,
        subject,
        text,
        wordCount: wordCount(text),
        startedAt: current.startedAt,
        finishedAt: now,
        durationSec: auto && current.strict ? Math.min(Math.round((now - current.startedAt) / 1000), current.limitSec) : Math.round((now - current.startedAt) / 1000),
        limitSec: current.limitSec,
        autoSubmitted: auto,
      };
      saveWriting(rec);
      discardAttempt(key);
      setRecord(rec);
      setPhase("review");
      setConfirmOpen(false);
      submitting.current = false;
      if (auto) toast.info(w.editor.timeUp);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (aiAvailable && rec.wordCount >= 10) void requestFeedback(rec);
    },
    [aiAvailable, discardAttempt, examId, key, requestFeedback, saveWriting, set.id, subject, text, w.editor.timeUp],
  );

  useEffect(() => {
    if (phase !== "writing" || !attempt?.strict) return;
    if (Date.now() - attempt.startedAt < attempt.limitSec * 1000) return;
    const timer = setTimeout(() => submit(true), 0);
    return () => clearTimeout(timer);
  }, [phase, attempt, submit]);

  const start = () => {
    startAttempt(key, limitSec, strictSetting);
    setSubject("");
    setText("");
    setTicked({});
    setRecord(null);
    setPhase("writing");
    window.scrollTo({ top: 0 });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  /** Shows a saved attempt again (its e-mail, feedback and the model answer). */
  const openAttempt = (rec: WritingRecord) => {
    setRecord(rec);
    setAiState("idle");
    setAiError(null);
    setPhase("review");
    window.scrollTo({ top: 0 });
  };

  const retry = () => {
    discardAttempt(key);
    setRecord(null);
    setAiState("idle");
    setPhase("intro");
    window.scrollTo({ top: 0 });
  };

  const insert = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) return setText((prev) => prev + snippet);
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + snippet + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const taskPanel = (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{w.editor.situation}</span>
          <Badge variant="secondary">{set.register === "informal" ? w.register.informal : w.register.semiformal}</Badge>
        </div>
        <p className="font-medium">{set.situation}</p>
      </div>
      <EmailCard stimulus={set.stimulus} />
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4" /> Schreiben Sie etwas zu allen vier Punkten
          </span>
        </div>
        <ul className="space-y-2">
          {set.leitpunkte.map((p, i) => (
            <li key={p}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  checked={!!ticked[i]}
                  onCheckedChange={(v) => setTicked((prev) => ({ ...prev, [i]: !!v }))}
                  disabled={phase !== "writing"}
                  className="mt-0.5"
                />
                <span className={cn(ticked[i] && "text-muted-foreground line-through")}>{p}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{w.editor.tickHint}</p>
      </div>
    </div>
  );

  /* ---------------- Intro ---------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-schreiben/15 via-card to-card">
          <div className="space-y-4 p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background text-schreiben">Schreiben · Aufgabe {setNumber}</Badge>
              <Badge variant="secondary">{set.register === "informal" ? w.emailType.informal : w.emailType.semiformal}</Badge>
              <Badge variant="secondary">{t.common.minutes(part.minutes)}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{set.title}</h1>
            <div className="rounded-xl border bg-background/80 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Aufgabe</span>
                {/* The English gloss of the official instruction exists only in the English UI. */}
                {locale === "en" && (
                  <button onClick={() => setShowEnglish((s) => !s)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Languages className="size-3.5" /> {showEnglish ? t.common.hideEnglish : t.common.showEnglish}
                  </button>
                )}
              </div>
              <p className="leading-relaxed font-medium">{part.instruction}</p>
              {locale === "en" && showEnglish && <p className="mt-2 text-sm text-muted-foreground">{part.instructionEn}</p>}
            </div>
          </div>
          <div className="grid gap-5 border-t bg-background/70 p-5 sm:p-7 lg:grid-cols-2">
            <div className="space-y-3">
              <EmailCard stimulus={set.stimulus} />
            </div>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border bg-card p-4">
                <span className="space-y-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" /> {w.intro.strictTitle}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {strictSetting ? w.intro.strictOn(part.minutes) : w.intro.strictOff(part.minutes)}
                  </span>
                </span>
                <Switch checked={strictSetting} onCheckedChange={(v) => updateSettings({ strictTimer: v })} />
              </label>
              <div className="rounded-xl border bg-card p-4 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <Sparkles className="size-4 text-primary" /> {aiAvailable === false ? w.intro.selfTitle : w.intro.aiTitle}
                </div>
                <p className="text-muted-foreground">{aiAvailable === false ? w.intro.selfText : w.intro.aiText(rubric.maxPoints)}</p>
              </div>
              {tips.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={start}>
                  <Play /> {w.intro.start}
                </Button>
                <Button variant="ghost" asChild>
                  <Link href={links.part}>
                    <ArrowLeft /> {w.intro.allTasks}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        {previous.length > 0 && (
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <History className="size-4 text-schreiben" /> {w.intro.previousTitle}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{w.intro.previousHint}</p>
            <ul className="mt-3 divide-y">
              {[...previous].reverse().map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{formatShortDate(p.finishedAt, locale)}</span>
                    <span className="text-muted-foreground"> · {t.common.words(p.wordCount)} · </span>
                    <span className={cn(p.feedback ? "font-medium" : "text-muted-foreground")}>
                      {p.feedback
                        ? w.intro.attemptScore(formatNumber(p.feedback.total, locale), rubric.maxPoints)
                        : p.selfGrades && Object.keys(p.selfGrades).length
                          ? w.intro.attemptSelf(formatNumber(selfPoints(p.selfGrades), locale), rubric.maxPoints)
                          : w.intro.attemptNoFeedback}
                    </span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openAttempt(p)}>
                    {w.intro.openAttempt}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  /* ---------------- Writing & review ---------------- */
  return (
    <div className="space-y-5">
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/85 px-4 py-2.5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={links.part} aria-label={w.editor.backToTasks}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-schreiben">Schreiben · Aufgabe {setNumber}</div>
            <div className="truncate text-sm font-medium">{set.title}</div>
          </div>
          {phase === "writing" && attempt && (
            <>
              <span className="hidden text-xs text-muted-foreground tabular sm:inline">{t.common.words(words)}</span>
              <CountdownTimer startedAt={attempt.startedAt} limitSec={attempt.limitSec} strict={attempt.strict} onExpire={() => attempt.strict && submit(true)} />
              <Button onClick={() => setConfirmOpen(true)}>
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

      {phase === "writing" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="lg:sticky lg:top-32 lg:max-h-[calc(100svh-9rem)] lg:self-start lg:overflow-y-auto lg:pr-1 scrollbar-thin">{taskPanel}</div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                <UmlautBar onInsert={insert} />
                <PhraseSheet groups={phraseGroups} onInsert={insert} />
              </div>
              <div className="border-b px-4 py-2.5">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Betreff:</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={w.editor.subjectPlaceholder}
                    className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                    spellCheck={false}
                  />
                </label>
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="sentences"
                lang="de"
                placeholder={set.register === "informal" ? "Liebe/Lieber …,\n\nvielen Dank für deine E-Mail …" : "Sehr geehrte Frau …,\n\nvielen Dank für Ihre E-Mail …"}
                className="reading block min-h-[26rem] w-full resize-y bg-paper px-5 py-4 text-[16px] text-paper-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                <span>{w.editor.spellcheckOff}</span>
                <span className={cn("font-medium tabular", words >= 120 ? "text-success" : words >= 70 ? "text-warning" : "")}>{t.common.words(words)}</span>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">{w.editor.liveChecks}</h3>
              <LiveChecksList checks={checks} />
            </div>
          </div>
        </div>
      )}

      {phase === "review" && record && (
        <ReviewSection
          record={record}
          set={set}
          rubric={rubric}
          aiAvailable={aiAvailable}
          aiState={aiState}
          aiError={aiError}
          onRetryAi={() => requestFeedback(record)}
          onSelfGrades={(g) => {
            const next = { ...record, selfGrades: g };
            setRecord(next);
            saveWriting(next);
          }}
          onRetry={retry}
          nextHref={links.next}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{w.editor.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{w.editor.confirmText(t.common.words(words), Object.values(ticked).filter(Boolean).length)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{w.editor.keepWriting}</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit(false)}>{t.common.submit}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const SELF_LABELS: Record<"A" | "B" | "C" | "D", string> = { A: "A", B: "B", C: "C", D: "D" };

/** Points of a self-assessment: A 5 · B 3 · C 1 · D 0 per criterion, weighted ×3 like the official rubric. */
function selfPoints(grades: NonNullable<WritingRecord["selfGrades"]>) {
  return (["I", "II", "III"] as const).reduce((sum, id) => sum + (grades[id] ? { A: 5, B: 3, C: 1, D: 0 }[grades[id]!] : 0), 0) * 3;
}

function ReviewSection({
  record,
  set,
  rubric,
  aiAvailable,
  aiState,
  aiError,
  onRetryAi,
  onSelfGrades,
  onRetry,
  nextHref,
}: {
  record: WritingRecord;
  set: WritingSet;
  rubric: WritingRubric;
  aiAvailable: boolean | null;
  aiState: "idle" | "loading" | "error";
  aiError: string | null;
  onRetryAi: () => void;
  onSelfGrades: (g: NonNullable<WritingRecord["selfGrades"]>) => void;
  onRetry: () => void;
  nextHref?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const r = t.writing.review;
  const grades = record.selfGrades ?? {};
  const selfTotal = selfPoints(grades);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium">{r.submittedOn(formatLongDate(record.finishedAt, locale))}</span>
        <span className="text-muted-foreground">
          · {t.common.words(record.wordCount)} · {r.durationOf(formatDuration(record.durationSec, locale), t.common.minutes(Math.round(record.limitSec / 60)))}
          {record.autoSubmitted ? r.autoSubmitted : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw /> {r.writeAgain}
          </Button>
          {nextHref && (
            <Button size="sm" asChild>
              <Link href={nextHref}>
                {r.nextTask} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {record.feedback ? (
        <WritingFeedbackView feedback={record.feedback} text={record.text} subject={record.subject} task={set} rubric={rubric} />
      ) : aiState === "loading" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <div className="font-medium">{r.loadingTitle}</div>
          <p className="max-w-md text-sm text-muted-foreground">{r.loadingText}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {aiState === "idle" && aiAvailable && record.wordCount >= 10 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 text-sm">
              <Sparkles className="size-4 text-primary" />
              <span className="font-medium">{r.getFeedbackTitle}</span>
              <Button size="sm" onClick={onRetryAi} className="ml-auto">
                {r.getFeedback}
              </Button>
            </div>
          )}
          {aiState === "error" && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <span className="font-medium text-destructive">{r.aiFailed}</span> {aiError}
              <Button size="sm" variant="outline" onClick={onRetryAi} className="ml-auto">
                <RotateCcw /> {t.common.retry}
              </Button>
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">{r.yourEmail}</h3>
              {record.subject && (
                <div className="mb-2 text-sm">
                  <span className="text-muted-foreground">Betreff:</span> <span className="font-medium">{record.subject}</span>
                </div>
              )}
              <div className="reading text-[15.5px] whitespace-pre-wrap">{record.text || <em className="text-muted-foreground">{r.empty}</em>}</div>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-1 font-semibold">{r.modelAnswer}</h3>
              <div className="mb-2 text-sm">
                <span className="text-muted-foreground">Betreff:</span> <span className="font-medium">{set.model.subject}</span>
              </div>
              <div className="reading text-[15.5px] whitespace-pre-wrap">{set.model.text}</div>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {set.modelNotes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
          </div>
          {aiAvailable === false && (
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{r.selfTitle}</h3>
                <span className="text-sm">
                  {r.selfTotal} <strong className="tabular">{selfTotal}</strong> / {rubric.maxPoints}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {rubric.criteria.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="text-sm font-medium">
                      {c.id}. {c.name}
                      {locale === "en" && <span className="text-muted-foreground"> · {c.nameEn}</span>}
                    </div>
                    {c.bands.map((b) => (
                      <button
                        key={b.grade}
                        type="button"
                        onClick={() => onSelfGrades({ ...grades, [c.id]: b.grade })}
                        className={cn(
                          "flex w-full gap-2 rounded-lg border p-2 text-left text-xs transition-colors hover:border-primary/50",
                          grades[c.id as "I"] === b.grade && "border-primary bg-primary/8",
                        )}
                      >
                        <span className="font-bold">{SELF_LABELS[b.grade]}</span>
                        <span className="text-muted-foreground">{b.descriptor}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{r.apiKeyTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
