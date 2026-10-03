"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

/* Minimal typings for the Web Speech API recognition interface (not in lib.dom). */
interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface RecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported() {
  return getCtor() !== null;
}

/** Our own code for "the microphone could not be started" (not a Web Speech API error code). */
const START_FAILED = "bestanden:start-failed";

/** User-facing text for a recognition error code, in the UI language. */
function errorMessage(code: string, locale: Locale): string {
  const m = getMessages(locale).speaking.recognition;
  if (code === START_FAILED) return m.startFailed;
  return (m.errors as Record<string, string>)[code] ?? m.other(code);
}

/**
 * German speech-to-text. Keeps listening across the browser's automatic
 * pauses until `stop()` is called, and accumulates the final transcript.
 * `lang` is the spoken language (always German for learners); error messages
 * follow `locale`, which defaults to the current UI language.
 */
export function useSpeechRecognition(lang = "de-DE", locale?: Locale) {
  const uiLocale = useLocale();
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => recognitionSupported(),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const finalRef = useRef("");

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setErrorCode(null);
    finalRef.current = "";
    setFinalText("");
    setInterim("");
    wanted.current = true;
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalRef.current = `${finalRef.current} ${text}`.replace(/\s+/g, " ").trim();
        else interimText += text;
      }
      setFinalText(finalRef.current);
      setInterim(interimText);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setErrorCode(e.error);
      wanted.current = false;
    };
    r.onend = () => {
      // Browsers stop after a pause – restart while the user is still speaking.
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setErrorCode(START_FAILED);
    }
  }, [lang]);

  /** Stops listening and resolves with the full transcript (incl. the last interim words). */
  const stop = useCallback((): string => {
    wanted.current = false;
    rec.current?.stop();
    const text = `${finalRef.current} ${interim}`.replace(/\s+/g, " ").trim();
    setListening(false);
    return text;
  }, [interim]);

  useEffect(
    () => () => {
      wanted.current = false;
      rec.current?.abort();
    },
    [],
  );

  const error = errorCode ? errorMessage(errorCode, locale ?? uiLocale) : null;
  return { supported, listening, finalText, interim, error, start, stop };
}

/** Records microphone audio so learners can listen to themselves afterwards. */
export function useAudioRecorder() {
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType }));
        });
      };
      mr.start();
      recorder.current = mr;
      return true;
    } catch {
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  useEffect(() => () => recorder.current?.stream.getTracks().forEach((t) => t.stop()), []);

  return { url, start, stop };
}
