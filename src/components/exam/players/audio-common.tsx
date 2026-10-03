"use client";

import { AlertTriangle, Headphones, Hourglass, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import type { Line, Speaker } from "@/lib/content/schemas";
import type { SequenceState } from "@/lib/audio/sequence";
import { loadVoices, playLines, speechSupported, type PlaybackIssue } from "@/lib/audio/speech";
import Link from "@/i18n/link";
import { useAiConfig } from "@/lib/store/ai-config";
import { useSettings } from "@/lib/store/settings";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { findQuote } from "@/lib/utils/text";
import { formatClock } from "@/lib/utils/time";
import { Highlighted, ItemNumber } from "./shared";

export function SoundBars({ active, className }: { active: boolean; className?: string }) {
  return (
    <span className={cn("flex h-6 items-end gap-[3px]", className)} aria-hidden>
      {[0.2, 0.5, 0.35, 0.65, 0.3, 0.55, 0.25].map((d, i) => (
        <span
          key={i}
          className={cn("w-[3px] origin-bottom rounded-full bg-current", active ? "animate-bar" : "scale-y-[0.2]")}
          style={{ height: "100%", animationDelay: `${d}s`, transition: "transform .3s" }}
        />
      ))}
    </span>
  );
}

/** Warn when the device has no German voice for text-to-speech. */
export function useVoiceCheck() {
  const [status, setStatus] = useState<"checking" | "ok" | "missing" | "unsupported">("checking");
  const [voiceName, setVoiceName] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadVoices().then((v) => {
      if (!alive) return;
      setStatus(!speechSupported() ? "unsupported" : v.length ? "ok" : "missing");
      setVoiceName(v[0]?.name ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { status, voiceName };
}

const ENGINE_LABELS = { openai: "OpenAI", elevenlabs: "ElevenLabs", google: "Google Cloud" } as const;

/**
 * Which voice the recordings use, with a sound check – or a warning if the device can't speak
 * German and no natural (cloud) voice is set up.
 */
export function VoiceWarning() {
  const { status, voiceName } = useVoiceCheck();
  const engine = useAiConfig((s) => s.tts);
  const prefs = useSettings(useShallow((s) => ({ female: s.voiceFemale, male: s.voiceMale, rate: s.speechRate })));
  const [testing, setTesting] = useState(false);
  const t = useT();
  const a = t.runner.audio;
  const neural = engine !== "browser";
  if (status === "checking") return null;

  if (!neural && status !== "ok")
    return (
      <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <p className="font-medium">{status === "unsupported" ? a.voiceUnsupported : a.voiceMissing}</p>
          <p className="mt-1 text-muted-foreground">{a.voiceHelp}</p>
          <Link href="/einstellungen#stimmen" className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline">
            {a.betterVoices} →
          </Link>
        </div>
      </div>
    );

  const soundCheck = async () => {
    setTesting(true);
    await playLines([{ s: "t", t: "Tonprobe. Wenn Sie diesen Satz hören, funktioniert der Ton." }], { speakers: [{ id: "t", gender: "f" }], prefs }).done;
    setTesting(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
      <span className="flex min-w-0 items-center gap-1.5">
        <Volume2 className="size-3.5 shrink-0" />
        <span className="truncate">{neural ? a.voiceNeural(ENGINE_LABELS[engine]) : a.voiceBrowser(voiceName ?? a.voiceDefault)}</span>
      </span>
      <span className="flex items-center gap-1">
        <Button variant="ghost" size="xs" onClick={soundCheck} disabled={testing}>
          {testing ? <SoundBars active className="h-3" /> : <Play />} {a.soundCheck}
        </Button>
        <Button variant="ghost" size="xs" asChild>
          <Link href="/einstellungen#stimmen">{a.betterVoices}</Link>
        </Button>
      </span>
    </div>
  );
}

/** Explains a playback problem instead of letting the recording fail silently. */
export function AudioIssue({ issue }: { issue: PlaybackIssue | null | undefined }) {
  const a = useT().runner.audio;
  if (!issue) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>
        {issue === "no-voice" ? a.issueNoVoice : a.issueFailed}{" "}
        <Link href="/einstellungen#stimmen" className="font-medium text-primary underline-offset-4 hover:underline">
          {a.betterVoices} →
        </Link>
      </p>
    </div>
  );
}

/** Status panel for the uninterruptible exam simulation. */
export function ExamAudioConsole({ seq, totalItems, itemLabel }: { seq: SequenceState & { progress: number }; totalItems: number; itemLabel: (n: number) => string }) {
  const a = useT().runner.audio;
  const step = seq.step;
  const playing = step?.kind === "play";
  const waiting = step?.kind === "wait";
  return (
    <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-hoeren/12 via-card to-card">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className={cn("relative grid size-14 shrink-0 place-items-center rounded-2xl bg-hoeren text-white shadow-lg shadow-hoeren/30")}>
          {playing && <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-hoeren" />}
          {waiting ? <Hourglass className="relative size-6" /> : <Headphones className="relative size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-wider text-hoeren uppercase">
            {seq.status === "idle" ? a.ready : seq.status === "done" ? a.finished : playing ? a.playing : a.wait}
          </div>
          <div className="truncate text-lg font-semibold">
            {seq.status === "done" ? a.checkAndSubmit : (step?.label ?? a.pressStart)}
          </div>
          {step?.focus ? (
            <div className="text-sm text-muted-foreground">
              {itemLabel(step.focus)} · {step.focus}/{totalItems}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-hoeren">
          {waiting && <span className="font-mono text-2xl font-semibold tabular">{formatClock(seq.secondsLeft)}</span>}
          <SoundBars active={playing} />
        </div>
      </div>
      <Progress value={seq.status === "done" ? 100 : seq.progress * 100} className="h-1 rounded-none bg-hoeren/10 [&>div]:bg-hoeren" />
    </div>
  );
}

export function TfButtons({
  value,
  onChange,
  disabled,
  correct,
}: {
  value?: string;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  correct?: string;
}) {
  const opts = [
    { key: "r", label: "richtig" },
    { key: "f", label: "falsch" },
  ];
  return (
    <div className="flex shrink-0 gap-1.5" role="radiogroup">
      {opts.map((o) => {
        const selected = value === o.key;
        const isCorrect = correct === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(selected ? null : o.key)}
            className={cn(
              "min-w-[4.75rem] rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-default",
              !disabled && "hover:border-primary/50",
              selected && !correct && "border-primary bg-primary text-primary-foreground shadow-sm",
              correct && isCorrect && "border-success/50 bg-success/15 text-success",
              correct && selected && !isCorrect && "border-destructive/40 bg-destructive/10 text-destructive line-through",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SpeedToggle({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const locale = useLocale();
  return (
    <ToggleGroup type="single" variant="outline" size="sm" value={String(value)} onValueChange={(v) => v && onChange(Number(v))}>
      {[0.85, 1, 1.15].map((r) => (
        <ToggleGroupItem key={r} value={String(r)} className="px-2 text-xs">
          {formatNumber(r, locale)}×
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function speakerLabel(speakers: Speaker[], id: string) {
  const sp = speakers.find((s) => s.id === id);
  if (!sp) return id;
  return sp.name ?? sp.role ?? (sp.gender === "f" ? "Sprecherin" : "Sprecher");
}

/** Clickable transcript: every line can be replayed; evidence quotes are highlighted. */
export function Transcript({
  lines,
  speakers,
  quotes = [],
  activeLine,
  onPlayLine,
  numberFor,
}: {
  lines: Line[];
  speakers: Speaker[];
  quotes?: { id: string; quote: string }[];
  activeLine?: number;
  onPlayLine?: (index: number) => void;
  numberFor?: (id: string) => number;
}) {
  return (
    <ol className="space-y-1">
      {lines.map((l, i) => {
        const lineQuotes = quotes.filter((q) => findQuote(l.t, q.quote) !== null);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onPlayLine?.(i)}
              className={cn(
                "group flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-[15px] leading-relaxed transition-colors hover:bg-muted/70",
                activeLine === i && "bg-hoeren/10",
              )}
            >
              <span className="mt-0.5 w-24 shrink-0 truncate text-xs font-semibold text-muted-foreground sm:w-32">
                {speakerLabel(speakers, l.s)}
              </span>
              <span className="min-w-0 flex-1">
                <Highlighted text={l.t} quotes={quotes} />
                {lineQuotes.length > 0 && numberFor && (
                  <span className="ml-1.5 inline-flex gap-1 align-middle">
                    {lineQuotes.map((q) => (
                      <ItemNumber key={q.id} n={numberFor(q.id)} className="h-5 min-w-5 rounded-md px-1 text-[10px]" />
                    ))}
                  </span>
                )}
              </span>
              <Volume2 className={cn("mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100", activeLine === i && "text-hoeren opacity-100")} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function PlayButton({
  playing,
  disabled,
  onPlay,
  onStop,
  label,
  playsLeft,
}: {
  playing: boolean;
  disabled?: boolean;
  onPlay: () => void;
  onStop: () => void;
  label: string;
  playsLeft?: number;
}) {
  const t = useT();
  return (
    <Button variant={playing ? "secondary" : "outline"} size="sm" disabled={disabled && !playing} onClick={playing ? onStop : onPlay} className="gap-2">
      {playing ? <Pause /> : <Play />}
      <span>{playing ? t.common.stop : label}</span>
      {playsLeft !== undefined && !playing && (
        <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", playsLeft ? "bg-hoeren/15 text-hoeren" : "bg-muted text-muted-foreground")}>
          {playsLeft}×
        </span>
      )}
    </Button>
  );
}
