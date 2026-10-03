"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSettings } from "@/lib/store/settings";
import { playLines, stopAll, type PlaybackHandle, type PlaybackIssue, type VoiceLine, type VoiceSpeaker } from "./speech";

export type SequenceStep =
  | { kind: "wait"; seconds: number; label: string; focus?: number }
  | {
      kind: "play";
      lines: VoiceLine[];
      label: string;
      focus?: number;
      pass?: 1 | 2;
      /** Recordings per line (e.g. one real recording of the whole text) – used before any synthetic voice. */
      audioUrls?: (string | null | undefined)[];
    };

/** What to play for a script: its real recording if the content has one, otherwise the lines. */
export function scriptAudio(lines: VoiceLine[], recording?: string): { lines: VoiceLine[]; audioUrls?: string[] } {
  if (!recording || !lines.length) return { lines };
  return { lines: [{ s: lines[0].s, t: lines.map((l) => l.t).join(" ") }], audioUrls: [recording] };
}

export interface SequenceState {
  status: "idle" | "running" | "done";
  stepIndex: number;
  step: SequenceStep | null;
  secondsLeft: number;
  lineIndex: number;
}

/** Runs a fixed exam audio script: reading time, recordings and pauses, without interruption. */
export function useAudioSequence(steps: SequenceStep[], speakers: VoiceSpeaker[], onComplete?: () => void) {
  const [state, setState] = useState<SequenceState>({ status: "idle", stepIndex: -1, step: null, secondsLeft: 0, lineIndex: -1 });
  const [issue, setIssue] = useState<PlaybackIssue | null>(null);
  // Every start() or stop() bumps the run id; older loops notice and exit. This makes
  // restarts safe (e.g. React Strict Mode remounts) and prevents overlapping playback.
  const runId = useRef(0);
  const handle = useRef<PlaybackHandle | null>(null);
  const prefs = useSettings(useShallow((s) => ({ female: s.voiceFemale, male: s.voiceMale, rate: s.speechRate })));
  const prefsRef = useRef(prefs);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    prefsRef.current = prefs;
    completeRef.current = onComplete;
  });

  const stop = useCallback(() => {
    runId.current++;
    handle.current?.stop();
    stopAll();
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    const my = ++runId.current;
    const alive = () => runId.current === my;
    for (let i = 0; i < steps.length; i++) {
      if (!alive()) return;
      const step = steps[i];
      if (step.kind === "wait") {
        const end = Date.now() + step.seconds * 1000;
        while (alive() && Date.now() < end) {
          setState({ status: "running", stepIndex: i, step, secondsLeft: Math.ceil((end - Date.now()) / 1000), lineIndex: -1 });
          await new Promise((r) => setTimeout(r, 200));
        }
      } else {
        setState({ status: "running", stepIndex: i, step, secondsLeft: 0, lineIndex: 0 });
        handle.current = playLines(step.lines, {
          speakers,
          prefs: prefsRef.current,
          audioUrls: step.audioUrls,
          onLine: (lineIndex) => alive() && setState((s) => ({ ...s, lineIndex })),
          onIssue: (i) => alive() && setIssue(i),
        });
        await handle.current.done;
      }
    }
    if (!alive()) return;
    setState({ status: "done", stepIndex: steps.length, step: null, secondsLeft: 0, lineIndex: -1 });
    completeRef.current?.();
  }, [steps, speakers]);

  const progress = steps.length ? Math.max(0, state.stepIndex) / steps.length : 0;
  return { ...state, issue, start, stop, progress };
}

/** Free playback with a play counter (training mode, transcripts). */
export function usePlayback(speakers: VoiceSpeaker[]) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(-1);
  const [issue, setIssue] = useState<PlaybackIssue | null>(null);
  const handle = useRef<PlaybackHandle | null>(null);
  const prefs = useSettings(useShallow((s) => ({ female: s.voiceFemale, male: s.voiceMale, rate: s.speechRate })));

  const stop = useCallback(() => {
    handle.current?.stop();
    setPlaying(null);
    setLineIndex(-1);
  }, []);

  useEffect(() => () => handle.current?.stop(), []);

  const play = useCallback(
    async (id: string, lines: VoiceLine[], opts: { rate?: number; startAt?: number; audioUrls?: (string | null | undefined)[] } = {}) => {
      handle.current?.stop();
      setPlaying(id);
      handle.current = playLines(lines, {
        speakers,
        prefs: { ...prefs, rate: (opts.rate ?? 1) * (prefs.rate ?? 1) },
        startAt: opts.startAt,
        audioUrls: opts.audioUrls,
        onLine: setLineIndex,
        onIssue: setIssue,
      });
      const finished = await handle.current.done;
      setPlaying((p) => (p === id ? null : p));
      setLineIndex(-1);
      return finished;
    },
    [speakers, prefs],
  );

  return { playing, lineIndex, issue, play, stop };
}
