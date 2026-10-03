"use client";

import { Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SoundBars } from "@/components/exam/players/audio-common";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { useAudioRecorder, useSpeechRecognition } from "@/lib/audio/recognition";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";

/** Record a monologue turn with live German transcription and playback. */
export function Monologue({
  prompt,
  targetSeconds,
  maxSeconds,
  onDone,
}: {
  prompt: string;
  targetSeconds: number;
  /** Hard stop (strict timing). */
  maxSeconds?: number;
  onDone: (transcript: string, durationSec: number) => void;
}) {
  const t = useT();
  const m = t.speaking.monologue;
  const rec = useSpeechRecognition();
  const audio = useAudioRecorder();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const stopRef = useRef<() => void>(() => undefined);

  const stop = () => {
    const text = rec.supported ? rec.stop() : typed;
    audio.stop();
    const duration = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    setStartedAt(null);
    setTranscript(text);
    setElapsed(duration);
  };
  useEffect(() => {
    stopRef.current = stop;
  });

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => {
      const e = (Date.now() - startedAt) / 1000;
      setElapsed(e);
      if (maxSeconds && e >= maxSeconds) stopRef.current();
    }, 250);
    return () => clearInterval(id);
  }, [startedAt, maxSeconds]);

  const start = async () => {
    setTranscript(null);
    setTyped("");
    setElapsed(0);
    if (rec.supported) rec.start();
    await audio.start();
    setStartedAt(Date.now());
  };

  const recording = startedAt !== null;
  const pct = Math.min(100, (elapsed / targetSeconds) * 100);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <p className="text-[15px] font-medium">{prompt}</p>

      {transcript === null ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={recording ? stop : start}
              className={cn(
                "relative grid size-20 place-items-center rounded-full text-white shadow-lg transition-transform active:scale-95",
                recording ? "bg-destructive shadow-destructive/30" : "bg-sprechen shadow-sprechen/30 hover:scale-105",
              )}
              aria-label={recording ? m.stopRecording : m.startRecording}
            >
              {recording && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />}
              {recording ? <Square className="relative size-7" /> : <Mic className="relative size-8" />}
            </button>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tabular">{formatClock(elapsed)}</span>
                <span className="text-sm text-muted-foreground">{m.target(formatClock(targetSeconds))}</span>
                {recording && <SoundBars active className="h-5 text-destructive" />}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-success" : "bg-sprechen")} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-muted-foreground">{recording ? m.speakFreely : m.pressMic}</div>
              <div className="text-[11px] text-muted-foreground/80">{m.privacy}</div>
            </div>
          </div>
          {recording &&
            (rec.supported ? (
              <div className="min-h-16 rounded-xl bg-muted/50 p-3 text-sm">
                {rec.finalText} <span className="text-muted-foreground">{rec.interim}</span>
                {!rec.finalText && !rec.interim && <span className="text-muted-foreground">{t.speaking.listening}</span>}
              </div>
            ) : (
              <textarea
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={m.noRecognition}
                className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm outline-none"
                lang="de"
              />
            ))}
          {rec.error && <p className="text-sm text-destructive">{rec.error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {m.spokeFor.before}
            <strong className="text-foreground">{formatClock(elapsed)}</strong>
            {m.spokeFor.after}
            {elapsed < targetSeconds * 0.6 ? m.tooShort : "."}
            {m.fixErrors}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-28 w-full rounded-xl border bg-background p-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            lang="de"
          />
          {audio.url && <audio controls src={audio.url} className="w-full" />}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onDone(transcript, elapsed)} disabled={!transcript.trim()} className="bg-sprechen text-white hover:bg-sprechen/90">
              {m.useAnswer}
            </Button>
            <Button variant="outline" onClick={() => setTranscript(null)}>
              <RotateCcw /> {m.recordAgain}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
