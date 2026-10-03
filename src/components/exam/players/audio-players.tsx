"use client";

import { Headphones, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { AudioLongSet, AudioShortSet } from "@/lib/content/schemas";
import { narratorLines, withNarrator } from "@/lib/audio/narrator";
import { scriptAudio, usePlayback, useAudioSequence, type SequenceStep } from "@/lib/audio/sequence";
import { officialNumber, tf } from "@/lib/exam/scoring";
import { cn } from "@/lib/utils";
import { findQuote } from "@/lib/utils/text";
import { AudioIssue, ExamAudioConsole, PlayButton, SoundBars, SpeedToggle, TfButtons, Transcript, VoiceWarning } from "./audio-common";
import { Explanation, ItemNumber, itemState, ResultIcon, type PlayerProps } from "./shared";

export interface AudioExtra {
  /** exam = uninterruptible simulation, training = free playback with play limits */
  mode: "exam" | "training";
  /** The runner flips this to true when the user presses Start. */
  started: boolean;
  /** Called when the exam simulation (incl. marking time) has finished. */
  onComplete: () => void;
}

/** Start the exam sequence while `run` is true; stopping on cleanup keeps remounts safe. */
function useAutoStart(seq: ReturnType<typeof useAudioSequence>, run: boolean) {
  const { start, stop } = seq;
  useEffect(() => {
    if (!run) return;
    void start();
    return () => stop();
  }, [run, start, stop]);
}

/* ------------------------------------------------------------------ */
/* Teil 1 & 3                                                          */
/* ------------------------------------------------------------------ */

export function AudioShortPlayer({ set, part, answers, onAnswer, review, mode, started, onComplete }: PlayerProps<AudioShortSet> & AudioExtra) {
  const t = useT();
  const a = t.runner.audio;
  const audio = part.audio!;
  const num = (n: number) => officialNumber(part, n);

  const steps = useMemo<SequenceStep[]>(() => {
    const s: SequenceStep[] = [];
    const first = officialNumber(part, 1);
    const last = officialNumber(part, set.items.length);
    // As on the real recording, the announcer reads the instructions first.
    s.push({ kind: "play", lines: narratorLines(part.instruction), label: "Anweisung" });
    if (audio.perItem) {
      s.push({ kind: "wait", seconds: audio.readingSeconds, label: `Gleich beginnt Teil ${part.teil}` });
      set.items.forEach((item, idx) => {
        s.push({ kind: "wait", seconds: 8, label: `Lesen Sie Aufgabe ${officialNumber(part, item.n)}`, focus: item.n });
        for (let p = 1; p <= audio.plays; p++) {
          s.push({ kind: "play", ...scriptAudio(item.script, item.recording), label: `Text ${idx + 1} · ${p}. Hören`, focus: item.n, pass: p as 1 | 2 });
          if (p < audio.plays) s.push({ kind: "wait", seconds: audio.repeatPauseSeconds, label: "Sie hören den Text noch einmal", focus: item.n });
        }
        s.push({ kind: "wait", seconds: audio.itemPauseSeconds, label: `Markieren Sie Ihre Lösung für Aufgabe ${officialNumber(part, item.n)}`, focus: item.n });
      });
    } else {
      s.push({ kind: "wait", seconds: audio.readingSeconds, label: `Lesezeit: Aufgaben ${first}–${last}` });
      if (set.intro.length) s.push({ kind: "play", ...scriptAudio(set.intro, set.introRecording), label: "Einleitung" });
      set.items.forEach((item, idx) => {
        s.push({ kind: "play", ...scriptAudio(item.script, item.recording), label: `Text ${idx + 1}`, focus: item.n });
        s.push({ kind: "wait", seconds: audio.itemPauseSeconds, label: `Aufgabe ${officialNumber(part, item.n)}: richtig oder falsch?`, focus: item.n });
      });
    }
    s.push({ kind: "wait", seconds: audio.answerSeconds, label: "Letzte Sekunden zum Markieren" });
    return s;
  }, [set, audio, part]);

  const cast = useMemo(() => withNarrator(set.speakers), [set.speakers]);
  const seq = useAudioSequence(steps, cast, onComplete);
  useAutoStart(seq, mode === "exam" && started && !review);
  const stopSequence = seq.stop;
  useEffect(() => {
    if (review) stopSequence();
  }, [review, stopSequence]);

  const pb = usePlayback(cast);
  const [plays, setPlays] = useState<Record<number, number>>({});
  const [rate, setRate] = useState(1);
  const focus = mode === "exam" ? seq.step?.focus : undefined;
  const training = mode === "training" && !review;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <VoiceWarning line={set.items[0]?.script[0]} speakers={cast} />
      <AudioIssue issue={seq.issue ?? pb.issue} />
      {mode === "exam" && !review && <ExamAudioConsole seq={seq} totalItems={set.items.length} itemLabel={(n) => `Aufgabe ${num(n)}`} />}

      {training && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 text-sm">
            <Headphones className="size-4 text-hoeren" />
            <span>
              {a.trainingLead} <strong>{t.runner.intro.times(audio.plays)}</strong>
              {a.trainingRest}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {set.intro.length > 0 && (
              <PlayButton
                playing={pb.playing === "intro"}
                onPlay={() => {
                  const intro = scriptAudio(set.intro, set.introRecording);
                  void pb.play("intro", intro.lines, { rate, audioUrls: intro.audioUrls });
                }}
                onStop={pb.stop}
                label={a.intro}
              />
            )}
            <SpeedToggle value={rate} onChange={setRate} />
          </div>
        </div>
      )}

      <ol className="space-y-3">
        {set.items.map((item, idx) => {
          const given = answers[item.n];
          const result = review?.items.find((i) => i.n === item.n);
          const used = plays[item.n] ?? 0;
          const id = `item-${item.n}`;
          const isPlaying = pb.playing === id || pb.playing === `t-${item.n}`;
          return (
            <li
              key={item.n}
              id={id}
              className={cn(
                "scroll-mt-32 rounded-xl border bg-card p-3 transition-shadow sm:p-4",
                focus === item.n && "ring-2 ring-hoeren/50",
                isPlaying && "ring-2 ring-hoeren/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <ItemNumber n={num(item.n)} state={itemState(review, item.n, !!given, focus === item.n)} />
                <p className="min-w-[12rem] flex-1 leading-snug font-medium">{item.statement}</p>
                {training && (
                  <PlayButton
                    playing={pb.playing === id}
                    disabled={used >= audio.plays}
                    playsLeft={audio.plays - used}
                    label={`Text ${idx + 1}`}
                    onPlay={() => {
                      setPlays((p) => ({ ...p, [item.n]: (p[item.n] ?? 0) + 1 }));
                      const rec = scriptAudio(item.script, item.recording);
                      void pb.play(id, rec.lines, { rate, audioUrls: rec.audioUrls });
                    }}
                    onStop={pb.stop}
                  />
                )}
                {pb.playing === id && <SoundBars active className="text-hoeren" />}
                <TfButtons
                  value={given}
                  onChange={(v) => onAnswer(item.n, v)}
                  disabled={!!review}
                  correct={review ? tf(item.answer) : undefined}
                />
              </div>

              {review && result && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ResultIcon ok={result.ok} />
                      {item.label && <Badge variant="secondary">{item.label}</Badge>}
                      <span className="text-sm text-muted-foreground">{a.transcriptHint}</span>
                    </div>
                    <PlayButton
                      playing={pb.playing === `t-${item.n}`}
                      onPlay={() => {
                        const rec = scriptAudio(item.script, item.recording);
                        void pb.play(`t-${item.n}`, rec.lines, { audioUrls: rec.audioUrls });
                      }}
                      onStop={pb.stop}
                      label={a.playText}
                    />
                  </div>
                  <Transcript
                    lines={item.script}
                    speakers={set.speakers}
                    quotes={[{ id: String(item.n), quote: item.evidence }]}
                    activeLine={pb.playing === `t-${item.n}` ? pb.lineIndex : undefined}
                    onPlayLine={(i) => pb.play(`t-${item.n}`, item.script, { startAt: i })}
                  />
                  <Explanation ok={result.ok} title={result.ok ? t.common.correct : `${t.common.correctAnswer}: ${item.answer ? "richtig" : "falsch"}`}>
                    {item.explanation}
                  </Explanation>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {review && set.intro.length > 0 && (
        <details className="rounded-xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">{a.introTranscript}</summary>
          <div className="mt-3">
            <Transcript
              lines={set.intro}
              speakers={set.speakers}
              activeLine={pb.playing === "intro-t" ? pb.lineIndex : undefined}
              onPlayLine={(i) => pb.play("intro-t", set.intro, { startAt: i })}
            />
          </div>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Teil 2                                                              */
/* ------------------------------------------------------------------ */

export function AudioLongPlayer({ set, part, answers, onAnswer, review, mode, started, onComplete }: PlayerProps<AudioLongSet> & AudioExtra) {
  const t = useT();
  const a = t.runner.audio;
  const audio = part.audio!;
  const num = (n: number) => officialNumber(part, n);

  const steps = useMemo<SequenceStep[]>(() => {
    const s: SequenceStep[] = [
      { kind: "play", lines: narratorLines(part.instruction), label: "Anweisung" },
      {
        kind: "wait",
        seconds: audio.readingSeconds,
        label: `Lesezeit: Aufgaben ${officialNumber(part, 1)}–${officialNumber(part, set.statements.length)}`,
      },
    ];
    for (let p = 1; p <= audio.plays; p++) {
      s.push({ kind: "play", ...scriptAudio(set.script, set.recording), label: `${p}. Hören`, pass: p as 1 | 2 });
      if (p < audio.plays) s.push({ kind: "wait", seconds: audio.repeatPauseSeconds, label: "Pause – gleich hören Sie das Gespräch noch einmal" });
    }
    s.push({ kind: "wait", seconds: audio.answerSeconds, label: "Letzte Sekunden zum Markieren" });
    return s;
  }, [set, audio, part]);

  const cast = useMemo(() => withNarrator(set.speakers), [set.speakers]);
  const seq = useAudioSequence(steps, cast, onComplete);
  useAutoStart(seq, mode === "exam" && started && !review);
  const stopSequence = seq.stop;
  useEffect(() => {
    if (review) stopSequence();
  }, [review, stopSequence]);

  const pb = usePlayback(cast);
  const [playsUsed, setPlaysUsed] = useState(0);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  const training = mode === "training" && !review;

  // Rough position of each statement in the recording, to highlight the current one during playback.
  const evidenceLine = useMemo(
    () => set.statements.map((st) => set.script.findIndex((l) => findQuote(l.t, st.evidence) !== null)),
    [set],
  );
  const currentLine = mode === "exam" ? (seq.step?.kind === "play" ? seq.lineIndex : -1) : pb.playing === "conv" ? pb.lineIndex : -1;
  const currentStatement =
    currentLine >= 0 ? set.statements.find((_, i) => evidenceLine[i] >= currentLine)?.n : undefined;

  const playConversation = () => {
    const from = resumeAt ?? 0;
    if (resumeAt === null) setPlaysUsed((p) => p + 1);
    setResumeAt(null);
    // A real recording is one file: it always plays from the start.
    if (set.recording) void pb.play("conv", ...withRecording(set.script, set.recording, rate));
    else void pb.play("conv", set.script, { rate, startAt: from });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <VoiceWarning line={set.script[0]} speakers={cast} />
      <AudioIssue issue={seq.issue ?? pb.issue} />
      <div className="rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium">Situation: </span>
        <span className="text-muted-foreground">{set.context}</span>
      </div>

      {mode === "exam" && !review && <ExamAudioConsole seq={seq} totalItems={set.statements.length} itemLabel={(n) => `Aufgabe ${num(n)}`} />}

      {training && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-3">
            {pb.playing === "conv" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResumeAt(pb.lineIndex >= 0 ? pb.lineIndex : null);
                  pb.stop();
                }}
              >
                <Square /> {t.common.pause}
              </Button>
            ) : (
              <Button size="sm" disabled={resumeAt === null && playsUsed >= audio.plays} onClick={playConversation} className="bg-hoeren text-white hover:bg-hoeren/90">
                <Play /> {resumeAt !== null ? t.common.resume : playsUsed ? a.playAgain : a.playConversation}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">{a.playsLeft(Math.max(0, audio.plays - playsUsed), audio.plays)}</span>
            {pb.playing === "conv" && <SoundBars active className="text-hoeren" />}
          </div>
          <SpeedToggle value={rate} onChange={setRate} />
        </div>
      )}

      <ol className="space-y-2">
        {set.statements.map((st) => {
          const given = answers[st.n];
          const result = review?.items.find((i) => i.n === st.n);
          return (
            <li
              key={st.n}
              id={`item-${st.n}`}
              className={cn("scroll-mt-32 rounded-xl border bg-card p-3", currentStatement === st.n && !review && "ring-2 ring-hoeren/40")}
            >
              <div className="flex flex-wrap items-center gap-3">
                <ItemNumber n={num(st.n)} state={itemState(review, st.n, !!given)} />
                <p className="min-w-[12rem] flex-1 leading-snug font-medium">{st.text}</p>
                <TfButtons value={given} onChange={(v) => onAnswer(st.n, v)} disabled={!!review} correct={review ? tf(st.answer) : undefined} />
              </div>
              {review && result && (
                <Explanation ok={result.ok} className="mt-3" title={result.ok ? t.common.correct : `${t.common.correctAnswer}: ${st.answer ? "richtig" : "falsch"}`}>
                  {st.explanation} <span className="text-muted-foreground">– „{st.evidence}“</span>
                </Explanation>
              )}
            </li>
          );
        })}
      </ol>

      {review && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{a.transcript}</h3>
            <div className="flex items-center gap-2">
              <SpeedToggle value={rate} onChange={setRate} />
              <PlayButton playing={pb.playing === "rev"} onPlay={() => pb.play("rev", ...withRecording(set.script, set.recording, rate))} onStop={pb.stop} label={a.playAll} />
            </div>
          </div>
          <Transcript
            lines={set.script}
            speakers={set.speakers}
            quotes={set.statements.map((st) => ({ id: String(st.n), quote: st.evidence }))}
            numberFor={(id) => num(Number(id))}
            activeLine={pb.playing === "rev" ? pb.lineIndex : undefined}
            onPlayLine={(i) => pb.play("rev", set.script, { rate, startAt: i })}
          />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCcw className="size-3" /> {a.transcriptTip}
          </p>
        </div>
      )}
    </div>
  );
}

/** Arguments for usePlayback().play with a script's recording (if any). */
function withRecording(script: AudioLongSet["script"], recording: string | undefined, rate: number) {
  const rec = scriptAudio(script, recording);
  return [rec.lines, { rate, audioUrls: rec.audioUrls }] as const;
}
