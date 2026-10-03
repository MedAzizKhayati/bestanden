"use client";

import { ArrowLeft, ArrowRight, BookMarked, CalendarCheck, CircleCheck, CircleX, Gauge, Headphones, Play, RotateCcw, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { CountdownTimer } from "@/components/exam/countdown-timer";
import { SoundBars, VoiceWarning } from "@/components/exam/players/audio-common";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { usePlayback } from "@/lib/audio/sequence";
import type { PlacementItem, PlacementSection, PlacementSkill, PlacementTest, PlacementTfItem } from "@/lib/content/schemas";
import { isCorrect, itemsBySkill, LEVEL_ORDER, scorePlacement, SKILLS, weakestSkills, type PlacementAnswers, type PlacementResult } from "@/lib/placement/score";
import { useHydrated } from "@/lib/store/hydration";
import { latestPlacement, usePlacement } from "@/lib/store/placement";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const SKILL_HREF: Record<PlacementSkill, (exam: string) => string> = {
  grammatik: () => "/grammatik",
  wortschatz: () => "/wortschatz",
  lesen: (exam) => `/${exam}/lesen`,
  hoeren: (exam) => `/${exam}/hoeren`,
};

export interface PlacementRunnerProps {
  test: PlacementTest;
  examSlug: string;
  /** Grammar topic id → title, for the recommendations. */
  grammarTitles: Record<string, string>;
}

export function PlacementRunner(props: PlacementRunnerProps) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;
  return <Runner {...props} />;
}

function Runner({ test, examSlug, grammarTitles }: PlacementRunnerProps) {
  const t = useT();
  const tp = t.placement;
  const running = usePlacement((s) => s.running);
  const latest = usePlacement(latestPlacement);
  const lastAnswers = usePlacement((s) => s.lastAnswers);
  const start = usePlacement((s) => s.start);
  const [view, setView] = useState<"intro" | "result">(latest ? "result" : "intro");
  const total = useMemo(() => Object.values(itemsBySkill(test)).reduce((n, list) => n + list.length, 0), [test]);

  if (running) return <Test test={test} onFinished={() => setView("result")} />;
  if (view === "result" && latest)
    return <Result result={latest} test={test} answers={lastAnswers} examSlug={examSlug} grammarTitles={grammarTitles} onRetake={() => setView("intro")} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-3xl border bg-linear-to-br from-primary/12 via-card to-card p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Gauge className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{tp.title}</h1>
        <p className="mt-2 text-muted-foreground">{tp.lead}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {[tp.intro.parts(test.sections.length), tp.intro.items(total), tp.intro.minutes(test.minutes)].map((fact) => (
            <span key={fact} className="rounded-full bg-background/80 px-3 py-1 ring-1 ring-border">
              {fact}
            </span>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {SKILLS.map((s, i) => (
            <div key={s} className="rounded-xl border bg-background/70 px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">{tp.run.part(i + 1, SKILLS.length)}</div>
              <div className="font-medium">{tp.skills[s]}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-6 text-sm font-semibold">{tp.intro.howTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {tp.intro.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={start}>
            {tp.intro.start} <ArrowRight />
          </Button>
          {latest && (
            <Button variant="ghost" onClick={() => setView("result")}>
              {tp.intro.previous(tp.result.levels[latest.overall])}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The test                                                            */
/* ------------------------------------------------------------------ */

function Test({ test, onFinished }: { test: PlacementTest; onFinished: () => void }) {
  const t = useT();
  const tp = t.placement;
  const running = usePlacement((s) => s.running)!;
  const setAnswer = usePlacement((s) => s.setAnswer);
  const setSection = usePlacement((s) => s.setSection);
  const finish = usePlacement((s) => s.finish);
  const strict = useSettings((s) => s.strictTimer);
  const [confirm, setConfirm] = useState(false);
  const groups = useMemo(() => itemsBySkill(test), [test]);
  const all = useMemo(() => SKILLS.flatMap((s) => groups[s]), [groups]);

  const index = Math.min(running.section, test.sections.length - 1);
  const section = test.sections[index];
  const answers = running.answers;
  const answeredIn = (skill: PlacementSkill) => groups[skill].filter((i) => answers[i.id] !== undefined).length;
  const open = all.filter((i) => answers[i.id] === undefined).length;
  const last = index === test.sections.length - 1;

  const submit = () => {
    finish(scorePlacement(test, answers, (Date.now() - running.startedAt) / 1000));
    onFinished();
    window.scrollTo({ top: 0 });
  };
  const go = (next: number) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{tp.run.part(index + 1, test.sections.length)}</div>
          <div className="font-semibold">{tp.skills[section.skill]}</div>
        </div>
        <span className="text-xs text-muted-foreground tabular">{tp.run.answered(all.length - open, all.length)}</span>
        <CountdownTimer startedAt={running.startedAt} limitSec={test.minutes * 60} strict={strict} onExpire={strict ? submit : undefined} compact />
        <Button size="sm" variant="outline" onClick={() => setConfirm(true)}>
          {tp.run.finishEarly}
        </Button>
      </div>

      <div className="flex gap-1.5">
        {test.sections.map((s, i) => (
          <button
            key={s.skill}
            type="button"
            onClick={() => go(i)}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", i === index ? "bg-primary" : answeredIn(s.skill) === groups[s.skill].length ? "bg-primary/40" : "bg-muted")}
            aria-label={tp.skills[s.skill]}
          />
        ))}
      </div>

      <SectionView section={section} answers={answers} onAnswer={setAnswer} />

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>
          <ArrowLeft /> {tp.run.back}
        </Button>
        {last ? (
          <Button onClick={() => (open ? setConfirm(true) : submit())}>
            {tp.run.finish} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={() => go(index + 1)}>
            {tp.run.next} <ArrowRight />
          </Button>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tp.run.confirmTitle}</AlertDialogTitle>
            {open > 0 && <AlertDialogDescription>{tp.run.confirmText(open)}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tp.run.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>{tp.run.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionView({
  section,
  answers,
  onAnswer,
  review,
}: {
  section: PlacementSection;
  answers: PlacementAnswers;
  onAnswer?: (id: string, value: number | "r" | "f") => void;
  review?: boolean;
}) {
  if (section.skill === "grammatik" || section.skill === "wortschatz")
    return (
      <ol className="space-y-3">
        {section.items.map((item, i) => (
          <ItemCard key={item.id} n={i + 1} item={item} answer={answers[item.id]} onAnswer={onAnswer} review={review} />
        ))}
      </ol>
    );
  if (section.skill === "lesen") {
    let n = 0;
    return (
      <div className="space-y-6">
        {section.texts.map((text) => (
          <div key={text.id} className="space-y-3">
            <article className="rounded-2xl border bg-card p-5 font-serif text-[15px] leading-relaxed">
              <h3 className="mb-2 font-sans text-base font-semibold">{text.title}</h3>
              {text.paragraphs.map((p, i) => (
                <p key={i} className="mt-2 first:mt-0">
                  {p}
                </p>
              ))}
            </article>
            <ol className="space-y-3">
              {text.items.map((item) => (
                <ItemCard key={item.id} n={++n} item={item} answer={answers[item.id]} onAnswer={onAnswer} review={review} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    );
  }
  let n = 0;
  return (
    <div className="space-y-6">
      <VoiceWarning />
      {section.recordings.map((rec) => (
        <div key={rec.id} className="space-y-3">
          <RecordingCard recording={rec} review={review} />
          <ol className="space-y-3">
            {rec.items.map((item) => (
              <ItemCard key={item.id} n={++n} item={item} answer={answers[item.id]} onAnswer={onAnswer} review={review} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

const MAX_PLAYS = 2;

function RecordingCard({ recording, review }: { recording: Extract<PlacementSection, { skill: "hoeren" }>["recordings"][number]; review?: boolean }) {
  const tp = useT().placement;
  const pb = usePlayback(recording.speakers);
  const [plays, setPlays] = useState(0);
  const playing = pb.playing === recording.id;
  const left = review ? Infinity : MAX_PLAYS - plays;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-linear-to-br from-hoeren/10 via-card to-card p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-hoeren text-white">
        <Headphones className="size-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm font-medium">{recording.context}</div>
      {playing ? (
        <Button variant="secondary" size="sm" onClick={pb.stop}>
          <Square /> <SoundBars active className="h-3" />
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={left <= 0}
          className="bg-hoeren text-white hover:bg-hoeren/90"
          onClick={() => {
            setPlays((p) => p + 1);
            void pb.play(recording.id, recording.script);
          }}
        >
          <Play /> {plays ? tp.run.playAgain : tp.run.play}
        </Button>
      )}
      {!review && <span className="w-full text-xs text-muted-foreground sm:w-auto">{left > 0 ? tp.run.playsLeft(left) : tp.run.noPlaysLeft}</span>}
      {review && (
        <div className="w-full space-y-1 border-t pt-3 text-sm" lang="de">
          {recording.script.map((l, i) => (
            <p key={i}>
              <span className="font-semibold">{recording.speakers.find((s) => s.id === l.s)?.name ?? l.s}:</span> {l.t}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  n,
  item,
  answer,
  onAnswer,
  review,
}: {
  n: number;
  item: PlacementItem;
  answer: number | "r" | "f" | undefined;
  onAnswer?: (id: string, value: number | "r" | "f") => void;
  review?: boolean;
}) {
  const t = useT();
  const options: { value: number | "r" | "f"; label: string }[] =
    item.type === "mc" ? item.options.map((o, i) => ({ value: i, label: o })) : [{ value: "r", label: "richtig" }, { value: "f", label: "falsch" }];
  const correctValue = item.type === "mc" ? item.answer : (item as PlacementTfItem).answer ? "r" : "f";
  const ok = isCorrect(item, answer);
  return (
    <li className={cn("rounded-2xl border bg-card p-4", review && (ok ? "border-success/40" : "border-destructive/40"))}>
      <div className="flex gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular">{n}</span>
        <p className="pt-0.5 text-[15px] leading-relaxed font-medium" lang="de">
          {item.type === "mc" ? item.prompt : item.statement}
        </p>
      </div>
      <div className={cn("mt-3 grid gap-2 pl-10", item.type === "mc" ? "sm:grid-cols-2" : "grid-cols-2 sm:max-w-xs")}>
        {options.map((o) => {
          const selected = answer === o.value;
          const isRight = review && o.value === correctValue;
          return (
            <button
              key={String(o.value)}
              type="button"
              disabled={review}
              lang="de"
              onClick={() => onAnswer?.(item.id, o.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                !review && (selected ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"),
                review && isRight && "border-success bg-success/10 font-medium",
                review && selected && !isRight && "border-destructive bg-destructive/10 line-through",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {review && (
        <div className="mt-3 flex gap-2 pl-10 text-sm text-muted-foreground">
          {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />}
          <p>
            {answer === undefined && <span className="font-medium text-foreground">{t.placement.result.noAnswer}. </span>}
            {item.explanation}
          </p>
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

function Result({
  result,
  test,
  answers,
  examSlug,
  grammarTitles,
  onRetake,
}: {
  result: PlacementResult;
  test: PlacementTest;
  answers: PlacementAnswers;
  examSlug: string;
  grammarTitles: Record<string, string>;
  onRetake: () => void;
}) {
  const t = useT();
  const tr = t.placement.result;
  const [review, setReview] = useState(false);
  const readiness = tr.readiness[result.readiness];
  const order = weakestSkills(result);
  const topics = result.missedGrammar.filter((id) => grammarTitles[id]).slice(0, 5);
  const levelPct = (l: string) => ((LEVEL_ORDER.indexOf(l as (typeof LEVEL_ORDER)[number]) + 1) / LEVEL_ORDER.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border bg-linear-to-br from-primary/12 via-card to-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid size-24 shrink-0 place-items-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
            {result.overall.replace("-", "−")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold tracking-wider text-primary uppercase">{tr.title}</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{readiness.title}</h1>
            <p className="mt-1 text-muted-foreground">{readiness.text}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {SKILLS.map((s) => {
            const r = result.skills[s];
            return (
              <div key={s} className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="font-medium">{t.placement.skills[s]}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${levelPct(r.level)}%` }} />
                </div>
                <span className="w-28 text-right tabular">
                  <span className="font-semibold">{tr.levels[r.level]}</span>
                  <span className="block text-xs text-muted-foreground">{tr.correct(r.correct, r.total)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">{tr.nextSteps}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {order.slice(0, 2).map((s) => (
            <Link key={s} href={SKILL_HREF[s](examSlug)} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted">
              {tr.practise(t.placement.skills[s])} <ArrowRight className="size-4" />
            </Link>
          ))}
          <Link href="/lernplan" className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium hover:bg-primary/10 sm:col-span-2">
            <span className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" /> {tr.plan}
            </span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {topics.length > 0 && (
          <div className="pt-2">
            <h3 className="text-sm font-medium">{tr.grammarTopics}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((id) => (
                <Link key={id} href={`/grammatik/${id}`} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted">
                  <BookMarked className="size-3.5 text-primary" /> {grammarTitles[id]}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setReview((r) => !r)}>
          {review ? tr.hideReview : tr.review}
        </Button>
        <Button variant="ghost" onClick={onRetake}>
          <RotateCcw /> {tr.retake}
        </Button>
        <span className="text-xs text-muted-foreground">{tr.retakeHint}</span>
      </div>

      {review && (
        <div className="space-y-8">
          {test.sections.map((section) => (
            <div key={section.skill} className="space-y-3">
              <h2 className="text-lg font-semibold">{t.placement.skills[section.skill]}</h2>
              <SectionView section={section} answers={answers} review />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{tr.disclaimer}</p>
    </div>
  );
}
