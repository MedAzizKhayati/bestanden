"use client";

import { Check, Flame, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { seededShuffle } from "@/lib/utils/text";
import { ARTICLE_BG, SpeakButton, spokenForm, WordLabel, type ClientWord } from "./word-bits";

/** Multiple-choice meaning quiz (German → English or reverse). */
export function MeaningQuiz({ words, length = 10 }: { words: ClientWord[]; length?: number }) {
  const t = useT();
  const logActivity = useProgress((s) => s.logActivity);
  const [round, setRound] = useState(0);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [reverse, setReverse] = useState(false);

  const questions = useMemo(() => {
    const pool = seededShuffle(words, `quiz-${round}`).slice(0, Math.min(length, words.length));
    return pool.map((w, k) => {
      const distractors = seededShuffle(
        words.filter((o) => o.id !== w.id && o.en !== w.en),
        `${w.id}-${round}-${k}`,
      ).slice(0, 3);
      return { word: w, options: seededShuffle([w, ...distractors], `${w.id}-opt-${round}`) };
    });
  }, [words, length, round]);

  const q = questions[i];
  if (!q)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <div className="text-4xl font-bold tabular">
          {score}/{questions.length}
        </div>
        <p className="text-muted-foreground">{score / questions.length >= 0.8 ? t.vocab.quiz.great : t.vocab.quiz.addMissed}</p>
        <Button
          onClick={() => {
            setRound((r) => r + 1);
            setI(0);
            setScore(0);
            setPicked(null);
          }}
        >
          <RotateCcw /> {t.vocab.quiz.newQuiz}
        </Button>
      </div>
    );

  const answer = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === q.word.id) setScore((s) => s + 1);
    logActivity(8, 1);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t.vocab.quiz.progress(i + 1, questions.length, score)}</span>
        <Button variant="ghost" size="sm" onClick={() => setReverse((r) => !r)}>
          {reverse ? t.vocab.direction.enDe : t.vocab.direction.deEn}
        </Button>
      </div>
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl border bg-card p-6 text-center">
        {reverse ? (
          <div className="text-2xl font-semibold">{q.word.en}</div>
        ) : (
          <div className="flex items-center gap-2">
            <WordLabel word={q.word} className="text-3xl" />
            <SpeakButton text={spokenForm(q.word)} />
          </div>
        )}
        {picked && <p className="reading mt-2 max-w-md text-sm text-muted-foreground">{q.word.example}</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const isRight = o.id === q.word.id;
          const isPicked = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => answer(o.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 text-left text-[15px] font-medium transition-all",
                !picked && "hover:border-primary/50 hover:bg-primary/5",
                picked && isRight && "border-success/50 bg-success/10 text-success",
                isPicked && !isRight && "border-destructive/40 bg-destructive/10 text-destructive",
                picked && !isRight && !isPicked && "opacity-50",
              )}
            >
              {reverse ? <WordLabel word={o} /> : o.en}
              {picked && isRight && <Check className="size-4" />}
              {isPicked && !isRight && <X className="size-4" />}
            </button>
          );
        })}
      </div>
      {picked && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            setPicked(null);
            setI((n) => n + 1);
          }}
        >
          {t.common.next}
        </Button>
      )}
    </div>
  );
}

/** der / die / das trainer for nouns, with streak. */
export function ArticleTrainer({ words }: { words: ClientWord[] }) {
  const t = useT();
  const labels = t.vocab.articles;
  const nouns = useMemo(() => words.filter((w) => w.article), [words]);
  const logActivity = useProgress((s) => s.logActivity);
  const [round, setRound] = useState(0);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const order = useMemo(() => seededShuffle(nouns, `art-${round}`), [nouns, round]);
  const w = order[i % Math.max(1, order.length)];

  const pick = (a: string) => {
    if (picked || !w) return;
    setPicked(a);
    logActivity(5, 1);
    if (a === w.article) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
    } else setStreak(0);
  };
  const next = () => {
    setPicked(null);
    if (i + 1 >= order.length) {
      setRound((r) => r + 1);
      setI(0);
    } else setI((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = { "1": "der", "2": "die", "3": "das" };
      if (!picked && map[e.key]) pick(map[e.key]);
      else if (picked && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!w) return <div className="rounded-2xl border p-8 text-center text-muted-foreground">{labels.noNouns}</div>;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{labels.progress(score, i + 1, order.length)}</span>
        <span className={cn("flex items-center gap-1 font-semibold", streak ? "text-orange-500" : "text-muted-foreground")}>
          <Flame className="size-4" /> {streak} <span className="font-normal text-muted-foreground">{labels.best(best)}</span>
        </span>
      </div>
      <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-3xl border bg-card p-6 text-center">
        <div className="text-4xl font-semibold">
          {picked ? <WordLabel word={w} /> : <span>___ {w.de}</span>}
        </div>
        <div className="text-sm text-muted-foreground">{w.en}</div>
        {picked && (
          <div className="text-sm">
            {w.plural && w.plural !== "–" ? t.vocab.plural(w.plural) : t.vocab.noPlural}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["der", "die", "das"] as const).map((a, k) => {
          const right = picked && a === w.article;
          const wrong = picked === a && a !== w.article;
          return (
            <button
              key={a}
              type="button"
              onClick={() => pick(a)}
              className={cn(
                "rounded-2xl border-2 py-4 text-xl font-bold transition-all",
                ARTICLE_BG[a],
                !picked && "hover:-translate-y-0.5 hover:shadow-md",
                right && "ring-4 ring-success/40",
                wrong && "opacity-60 line-through",
                picked && !right && !wrong && "opacity-40",
              )}
            >
              {a}
              <span className="block text-[11px] font-normal opacity-70">{labels.key(k + 1)}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-4 py-3">
            <p className="reading flex-1 text-[15px]">{w.example}</p>
            <SpeakButton text={w.example} className="size-7" />
          </div>
          <Button className="w-full" size="lg" onClick={next}>
            {labels.nextWord}
          </Button>
        </div>
      )}
    </div>
  );
}
