"use client";

import { ArrowLeftRight, PartyPopper, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { schedule, useVocab, type CardState, type Grade } from "@/lib/store/vocab";
import { useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { seededShuffle } from "@/lib/utils/text";
import { SpeakButton, spokenForm, WordLabel, type ClientWord } from "./word-bits";

type GradeId = keyof Messages["vocab"]["flashcards"]["grades"];

const GRADES: { grade: Grade; id: GradeId; key: string; className: string }[] = [
  { grade: 0, id: "again", key: "1", className: "border-destructive/40 text-destructive hover:bg-destructive/10" },
  { grade: 1, id: "hard", key: "2", className: "border-warning/50 hover:bg-warning/10" },
  { grade: 2, id: "good", key: "3", className: "border-success/40 text-success hover:bg-success/10" },
  { grade: 3, id: "easy", key: "4", className: "border-primary/40 text-primary hover:bg-primary/10" },
];

const MIN = 60_000;
const DAY = 86_400_000;

/** Next interval a grade would produce, in the UI language. */
function intervalLabel(card: CardState | undefined, grade: Grade, units: Messages["vocab"]["flashcards"]["interval"]) {
  const ms = schedule(card, grade, 0).due;
  if (ms < DAY) return units.minutes(Math.round(ms / MIN));
  const days = Math.round(ms / DAY);
  if (days < 30) return units.days(days);
  return units.months(Math.round(days / 30));
}

/**
 * Spaced-repetition session. `words` is the pool; the session shows due cards
 * first, then up to `newLimit` new ones.
 */
export function Flashcards({ words, newLimit = 10, onFinish }: { words: ClientWord[]; newLimit?: number; onFinish?: () => void }) {
  const t = useT();
  const labels = t.vocab.flashcards;
  const cards = useVocab((s) => s.cards);
  const review = useVocab((s) => s.review);
  const logActivity = useProgress((s) => s.logActivity);
  const [reverse, setReverse] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [done, setDone] = useState(0);
  const [againQueue, setAgainQueue] = useState<string[]>([]);

  // Build the queue once per session so grading doesn't reshuffle it.
  const [sessionStart, setSessionStart] = useState(() => Date.now());
  const queue = useMemo(() => {
    const now = sessionStart;
    const due = words.filter((w) => cards[w.id] && cards[w.id].due <= now).sort((a, b) => cards[a.id].due - cards[b.id].due);
    const fresh = seededShuffle(
      words.filter((w) => !cards[w.id]),
      `new-${sessionKey}`,
    ).slice(0, newLimit);
    return [...due, ...fresh].map((w) => w.id);
    // The queue is frozen per session so grading a card doesn't reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, sessionKey, sessionStart]);

  const order = [...queue, ...againQueue];
  const currentId = order[done];
  const word = words.find((w) => w.id === currentId);

  const grade = (g: Grade) => {
    if (!word) return;
    review(word.id, g);
    logActivity(12, 1);
    if (g === 0) setAgainQueue((q) => [...q, word.id]);
    setFlipped(false);
    setDone((d) => d + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade((Number(e.key) - 1) as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!word) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <PartyPopper className="size-10 text-gold" />
        <div className="text-lg font-semibold">{done ? labels.complete : labels.nothingDue}</div>
        <p className="max-w-sm text-sm text-muted-foreground">{done ? labels.reviewed(done) : labels.allScheduled}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDone(0);
              setAgainQueue([]);
              setSessionKey((k) => k + 1);
              setSessionStart(Date.now());
            }}
          >
            <RotateCcw /> {labels.newSession}
          </Button>
          {onFinish && <Button onClick={onFinish}>{t.common.done}</Button>}
        </div>
      </div>
    );
  }

  const card = cards[word.id];
  const front = reverse ? (
    <div className="text-2xl font-semibold sm:text-3xl">{word.en}</div>
  ) : (
    <div className="flex items-center gap-2">
      <WordLabel word={word} className="text-3xl sm:text-4xl" />
      <SpeakButton text={spokenForm(word)} />
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {labels.progress(done + 1, order.length)}
          {!card && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{labels.newBadge}</span>}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setReverse((r) => !r)}>
          <ArrowLeftRight /> {reverse ? t.vocab.direction.enDe : t.vocab.direction.deEn}
        </Button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / order.length) * 100}%` }} />
      </div>

      {/* A div, not a <button>: the card contains listen buttons, and buttons can't be nested. */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={flipped}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          setFlipped((f) => !f);
        }}
        className="relative flex min-h-72 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border bg-card p-8 text-center shadow-sm transition-all outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
      >
        {front}
        {flipped ? (
          <div className="w-full space-y-3 border-t pt-4">
            {reverse ? (
              <div className="flex items-center justify-center gap-2">
                <WordLabel word={word} className="text-2xl" />
                <SpeakButton text={spokenForm(word)} />
              </div>
            ) : (
              <div className="text-xl font-medium">{word.en}</div>
            )}
            {(word.plural || word.forms) && (
              <div className="text-sm text-muted-foreground">
                {word.plural && word.plural !== "–" && <>{t.vocab.plural(word.plural)}</>}
                {word.plural === "–" && <>{t.vocab.noPlural}</>}
                {word.forms && <>{word.forms}</>}
              </div>
            )}
            <div className="mx-auto max-w-md rounded-xl bg-muted/50 px-4 py-3 text-left">
              <div className="flex items-start gap-2">
                <p className="reading flex-1 text-[15px]">{word.example}</p>
                <SpeakButton text={word.example} className="size-7" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{word.exampleEn}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{labels.reveal}</div>
        )}
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              onClick={() => grade(g.grade)}
              className={cn("flex flex-col items-center rounded-xl border bg-background py-2.5 text-sm font-semibold transition-colors", g.className)}
            >
              {labels.grades[g.id]}
              <span className="text-[11px] font-normal text-muted-foreground">
                {intervalLabel(card, g.grade, labels.interval)} · {g.key}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={() => setFlipped(true)}>
          {labels.showAnswer}
        </Button>
      )}
    </div>
  );
}
