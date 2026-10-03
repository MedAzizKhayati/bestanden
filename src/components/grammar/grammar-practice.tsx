"use client";

import { Check, CornerDownLeft, RotateCcw, Trophy, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { GrammarExercise } from "@/lib/content/schemas";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { answerMatches, normalizeAnswer, seededShuffle } from "@/lib/utils/text";

interface ItemState {
  value: string;
  checked: boolean;
  correct: boolean;
}

/** Prompt with "___" blanks; `fills` replaces blanks once answered. */
function PromptText({ prompt, fills, blankClass }: { prompt: string; fills?: string[]; blankClass?: string }) {
  const parts = prompt.split("___");
  return (
    <span className="reading text-[16px] leading-relaxed">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 &&
            (fills?.[i] ? (
              <span className={cn("rounded px-1 font-semibold", blankClass)}>{fills[i]}</span>
            ) : (
              <span className="mx-0.5 inline-block w-14 border-b-2 border-dashed border-primary/50 align-baseline" />
            ))}
        </Fragment>
      ))}
    </span>
  );
}

/** "von … bis" fills two blanks: split the option on the ellipsis. */
function fillsFor(prompt: string, option: string) {
  const blanks = prompt.split("___").length - 1;
  if (blanks <= 1) return [option];
  const pieces = option.split(/\s*…\s*|\s*\.\.\.\s*/);
  return pieces.length === blanks ? pieces : [option];
}

export function GrammarPractice({ topicId, exercises }: { topicId: string; exercises: GrammarExercise[] }) {
  const t = useT();
  const labels = t.grammar.practice;
  const hydrated = useHydrated();
  const record = useProgress((s) => s.recordGrammar);
  const resetStored = useProgress((s) => s.resetGrammar);
  const stored = useProgress((s) => s.grammar[topicId]);
  const [items, setItems] = useState<Record<number, ItemState>>({});
  const [round, setRound] = useState(0);

  const set = (i: number, patch: Partial<ItemState>) =>
    setItems((prev) => ({ ...prev, [i]: { ...(prev[i] ?? { value: "", checked: false, correct: false }), ...patch } }));

  const check = (i: number, value: string, correct: boolean) => {
    set(i, { value, checked: true, correct });
    record(topicId, i, correct);
  };

  const done = Object.values(items).filter((x) => x.checked).length;
  const correctNow = Object.values(items).filter((x) => x.checked && x.correct).length;
  const storedCorrect = stored ? Object.values(stored.results).filter(Boolean).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold tabular">
            {correctNow}/{done}
          </span>{" "}
          <span className="text-muted-foreground">
            {labels.correctThisRound} · {labels.exercises(exercises.length)}
          </span>
          {hydrated && stored && <span className="ml-2 text-muted-foreground">· {labels.overall(storedCorrect, exercises.length)}</span>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setItems({});
            setRound((r) => r + 1);
            resetStored(topicId);
          }}
        >
          <RotateCcw /> {labels.startOver}
        </Button>
      </div>

      <ol className="space-y-3">
        {exercises.map((ex, i) => (
          <li key={`${round}-${i}`} className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <span className="grid size-6 place-items-center rounded-md bg-muted text-foreground tabular">{i + 1}</span>
              {labels.types[ex.type]}
              {items[i]?.checked && (
                <span className={cn("ml-auto flex items-center gap-1 normal-case", items[i].correct ? "text-success" : "text-destructive")}>
                  {items[i].correct ? <Check className="size-4" /> : <X className="size-4" />} {items[i].correct ? labels.richtig : t.common.notQuite}
                </span>
              )}
            </div>
            <ExerciseView ex={ex} index={i} state={items[i]} onCheck={check} seed={`${topicId}-${i}-${round}`} />
          </li>
        ))}
      </ol>

      {done === exercises.length && (
        <div className="flex items-center gap-4 rounded-2xl border border-success/30 bg-success/7 p-5">
          <Trophy className="size-8 text-gold" />
          <div>
            <div className="font-semibold">{labels.resultTitle(correctNow, exercises.length)}</div>
            <div className="text-sm text-muted-foreground">{correctNow / exercises.length >= 0.8 ? labels.mastered : labels.tryAgain}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feedback({ ok, explanation, solution }: { ok: boolean; explanation: string; solution?: string }) {
  const t = useT();
  return (
    <div className={cn("mt-3 rounded-xl px-3 py-2.5 text-sm", ok ? "bg-success/8" : "bg-destructive/6")}>
      {!ok && solution && (
        <div className="mb-1 font-medium">
          {t.common.correctAnswer}: <span className="reading text-success">{solution}</span>
        </div>
      )}
      <div className="text-foreground/85">{explanation}</div>
    </div>
  );
}

function ExerciseView({
  ex,
  index,
  state,
  onCheck,
  seed,
}: {
  ex: GrammarExercise;
  index: number;
  state?: ItemState;
  onCheck: (i: number, value: string, correct: boolean) => void;
  seed: string;
}) {
  const labels = useT().grammar.practice;
  const [value, setValue] = useState("");
  const [placed, setPlaced] = useState<number[]>([]);
  const tiles = useMemo(() => (ex.type === "order" ? seededShuffle(ex.words, seed) : []), [ex, seed]);
  const checked = !!state?.checked;

  if (ex.type === "mc") {
    const chosen = state?.value;
    return (
      <div>
        <PromptText
          prompt={ex.prompt}
          fills={checked ? fillsFor(ex.prompt, ex.options[ex.answer]) : undefined}
          blankClass={state?.correct ? "bg-success/15 text-success" : "bg-success/15 text-success"}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {ex.options.map((o, k) => {
            const isAnswer = k === ex.answer;
            const isChosen = chosen === String(k);
            return (
              <button
                key={o}
                type="button"
                disabled={checked}
                onClick={() => onCheck(index, String(k), isAnswer)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-[15px] font-medium transition-all",
                  !checked && "hover:border-primary/50 hover:bg-primary/5",
                  checked && isAnswer && "border-success/50 bg-success/12 text-success",
                  checked && isChosen && !isAnswer && "border-destructive/40 bg-destructive/10 text-destructive line-through",
                  checked && !isAnswer && !isChosen && "opacity-50",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
        {checked && <Feedback ok={!!state?.correct} explanation={ex.explanation} />}
      </div>
    );
  }

  if (ex.type === "gap" || ex.type === "transform") {
    const submit = () => value.trim() && onCheck(index, value, answerMatches(value, ex.answers));
    return (
      <div>
        {ex.type === "transform" && <div className="mb-1.5 text-sm font-medium text-muted-foreground">{ex.instruction}</div>}
        <div>
          <PromptText prompt={ex.prompt} fills={checked && ex.type === "gap" ? [state!.correct ? ex.answers[0] : state!.value] : undefined} blankClass={state?.correct ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive line-through"} />
          {ex.type === "gap" && ex.hint && <span className="ml-2 text-sm text-muted-foreground">{/^\(.*\)$/.test(ex.hint.trim()) ? ex.hint : `(${ex.hint})`}</span>}
        </div>
        {!checked ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={ex.type === "gap" ? labels.answerPlaceholder : labels.sentencePlaceholder}
              className="reading h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-[15.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              lang="de"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={!value.trim()} size="lg">
              {labels.check} <CornerDownLeft />
            </Button>
          </form>
        ) : (
          <>
            {ex.type === "transform" && (
              <div className={cn("reading mt-2 text-[15.5px]", state?.correct ? "text-success" : "text-destructive line-through")}>{state?.value}</div>
            )}
            <Feedback ok={!!state?.correct} explanation={ex.explanation} solution={ex.answers[0]} />
          </>
        )}
      </div>
    );
  }

  // order
  const sentence = placed.map((i) => tiles[i]).join(" ");
  const submitOrder = () => {
    const given = normalizeAnswer(sentence);
    onCheck(index, sentence, ex.answers.some((a) => normalizeAnswer(a) === given));
  };
  return (
    <div>
      <div
        className={cn(
          "reading flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-2 text-[16px]",
          checked && (state?.correct ? "border-success/50 bg-success/6" : "border-destructive/40 bg-destructive/4"),
        )}
      >
        {placed.length === 0 && !checked && <span className="font-sans text-sm text-muted-foreground">{labels.tapWords}</span>}
        {(checked ? (state?.value ?? "").split(" ") : placed.map((i) => tiles[i])).map((w, k) => (
          <button
            key={`${w}-${k}`}
            type="button"
            disabled={checked}
            onClick={() => setPlaced((p) => p.filter((_, idx) => idx !== k))}
            className="rounded-lg bg-primary/10 px-2 py-1 font-medium text-primary"
          >
            {w}
          </button>
        ))}
      </div>
      {!checked && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tiles.map((w, i) =>
              placed.includes(i) ? (
                <span key={i} className="reading rounded-lg border border-dashed px-2 py-1 text-[16px] text-transparent select-none">
                  {w}
                </span>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPlaced((p) => [...p, i])}
                  className="reading rounded-lg border bg-background px-2 py-1 text-[16px] font-medium shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
                >
                  {w}
                </button>
              ),
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={submitOrder} disabled={placed.length !== tiles.length}>
              {labels.check}
            </Button>
            <Button variant="ghost" onClick={() => setPlaced([])} disabled={!placed.length}>
              {labels.clear}
            </Button>
          </div>
        </>
      )}
      {checked && <Feedback ok={!!state?.correct} explanation={ex.explanation} solution={ex.answers[0]} />}
    </div>
  );
}
