"use client";

/**
 * Text-to-speech playback for listening tasks, model dialogues and vocabulary.
 *
 * Order of preference for every line:
 *   1. a recording given by the caller (`audioUrls`, e.g. a human recording from the content),
 *   2. the registered audio resolver (pre-rendered files, or a neural voice via the user's API key),
 *   3. the browser's Web Speech API with the best German voices on the device.
 * Novelty voices (macOS "Grandpa", "Rocko", …) are never used, and a voice that fails is replaced
 * on the fly instead of silently skipping the text.
 */

export type Gender = "f" | "m";

export interface VoiceSpeaker {
  id: string;
  gender: Gender;
  age?: "young" | "adult" | "senior";
}

export interface VoiceLine {
  s: string; // speaker id
  t: string; // text
}

/* ------------------------------------------------------------------ */
/* Browser voices                                                      */
/* ------------------------------------------------------------------ */

export type VoiceTier = "natural" | "premium" | "standard" | "novelty";

const FEMALE = [
  "anna", "petra", "helena", "katja", "marlene", "vicki", "sandy", "shelley", "grandma", "amala", "louisa",
  "seraphina", "elke", "gisela", "ingrid", "klarissa", "maja", "tanja", "hedda", "female", "frau", "leni",
  "kerstin", "eva", "ramona", "jenny", "christel", "paula", "lisa", "emma", "sophie", "google deutsch", "yvonne",
];
const MALE = [
  "markus", "yannick", "martin", "conrad", "killian", "hans", "reed", "rocko", "eddy", "flo", "grandpa", "bernd",
  "christoph", "florian", "kasper", "klaus", "ralf", "stefan", "jonas", "male", "mann", "thorsten", "karl", "jan",
  "georg", "dieter", "tobias", "kai", "viktor",
];
/** Formant/novelty voices (macOS Eloquence & effects voices) – robotic or comic, never used for exam audio. */
const NOVELTY =
  /(?<![a-z])(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)(?![a-z])/;

export function voiceGender(v: SpeechSynthesisVoice): Gender | undefined {
  const name = v.name.toLowerCase();
  if (FEMALE.some((h) => name.includes(h))) return "f";
  if (MALE.some((h) => name.includes(h))) return "m";
  return undefined;
}

export function voiceTier(v: SpeechSynthesisVoice): VoiceTier {
  const n = v.name.toLowerCase();
  if (NOVELTY.test(n)) return "novelty";
  if (/natural|neural|online/.test(n) || (n.includes("google") && !v.localService)) return "natural";
  if (/premium|enhanced|siri/.test(n)) return "premium";
  return "standard";
}

const TIER_RANK: Record<VoiceTier, number> = { natural: 3, premium: 2, standard: 1, novelty: 0 };

/** Higher is better. */
export function voiceQuality(v: SpeechSynthesisVoice): number {
  let q = TIER_RANK[voiceTier(v)] * 100;
  if (v.lang.toLowerCase() === "de-de") q += 5;
  if (v.localService) q += 2; // works offline, starts faster
  return q;
}

/** German voices, best first. Novelty voices are excluded unless asked for. */
export function germanVoices({ includeNovelty = false }: { includeNovelty?: boolean } = {}): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("de") && (includeNovelty || voiceTier(v) !== "novelty") && !broken.has(v.voiceURI))
    .sort((a, b) => voiceQuality(b) - voiceQuality(a) || a.name.localeCompare(b.name));
}

/** Resolves once the browser has loaded its voice list (it loads asynchronously in Chrome). */
export function loadVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
    const now = germanVoices();
    if (now.length) return resolve(now);
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      resolve(germanVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", done);
    // Chrome only starts loading voices after the first getVoices() call.
    window.speechSynthesis.getVoices();
    setTimeout(done, timeoutMs);
  });
}

/** Voices that failed during this session (network voices offline, broken engines). */
const broken = new Set<string>();

export interface VoicePrefs {
  female?: string; // voiceURI
  male?: string;
  rate?: number;
}

interface Assignment {
  voice?: SpeechSynthesisVoice;
  pitch: number;
  rate: number;
}

/**
 * Give every speaker a voice: the preferred voice first, then distinct good voices of the right
 * gender. If the device has no good voice of a gender (Chrome on macOS has only female German
 * voices), a good voice of the other gender is reused with a shifted pitch – never a robotic one.
 */
export function assignVoices(speakers: VoiceSpeaker[], voices: SpeechSynthesisVoice[], prefs: VoicePrefs = {}) {
  const usable = voices.filter((v) => voiceTier(v) !== "novelty" && !broken.has(v.voiceURI));
  const byGender: Record<Gender, SpeechSynthesisVoice[]> = { f: [], m: [] };
  const unknown: SpeechSynthesisVoice[] = [];
  for (const v of usable) {
    const g = voiceGender(v);
    if (g) byGender[g].push(v);
    else unknown.push(v);
  }
  for (const g of ["f", "m"] as const) {
    const pref = g === "f" ? prefs.female : prefs.male;
    const idx = byGender[g].findIndex((v) => v.voiceURI === pref);
    if (idx > 0) byGender[g].unshift(...byGender[g].splice(idx, 1));
  }
  const used: Record<Gender, number> = { f: 0, m: 0 };
  const map = new Map<string, Assignment>();
  const baseRate = prefs.rate ?? 1;
  for (const sp of speakers) {
    const own = byGender[sp.gender];
    const other = byGender[sp.gender === "f" ? "m" : "f"];
    const n = used[sp.gender]++;
    let voice: SpeechSynthesisVoice | undefined;
    let pitch = 1;
    if (own.length) {
      voice = own[n % own.length];
      // The same voice for a second speaker: shift the pitch so they stay distinguishable.
      if (n >= own.length) pitch = n % 2 ? 0.9 : 1.1;
    } else {
      // Borrow: prefer a voice the other gender's main speaker doesn't use, so timbres differ.
      const pool = [...other.slice(1), ...other.slice(0, 1), ...unknown];
      voice = pool.length ? pool[n % pool.length] : undefined;
      pitch = sp.gender === "m" ? 0.74 - (n % 2) * 0.06 : 1.22 + (n % 2) * 0.06;
    }
    if (sp.age === "senior") pitch *= 0.94;
    if (sp.age === "young") pitch *= 1.05;
    map.set(sp.id, { voice, pitch, rate: baseRate * (sp.age === "senior" ? 0.95 : 1) });
  }
  return map;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[A-ZÄÖÜ„"0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Recordings and neural voices                                        */
/* ------------------------------------------------------------------ */

/** Who speaks a line – enough to pick a consistent voice in any engine. */
export interface SpeakerProfile {
  gender: Gender;
  age: "young" | "adult" | "senior";
  /** 0 for the first speaker of this gender in the recording, 1 for the second, … */
  index: number;
}

/** Returns a playable URL (pre-rendered file or synthesized blob) for a line, or null to fall back. */
export type AudioResolver = (text: string, speaker: SpeakerProfile, signal: AbortSignal) => Promise<string | null>;

let resolver: AudioResolver | null = null;

/** Registered by the audio settings (pre-rendered files, neural voices via API key). */
export function setAudioResolver(next: AudioResolver | null) {
  resolver = next;
}

/** Speaker id → profile (gender, age, index within the gender). Shared with scripts/audio/render.ts. */
export function speakerProfiles(speakers: VoiceSpeaker[]): Map<string, SpeakerProfile> {
  const count: Record<Gender, number> = { f: 0, m: 0 };
  return new Map(speakers.map((s) => [s.id, { gender: s.gender, age: s.age ?? "adult", index: count[s.gender]++ }]));
}

/* ------------------------------------------------------------------ */
/* Playback                                                            */
/* ------------------------------------------------------------------ */

export type PlaybackIssue = "speech-failed" | "no-voice";

export interface PlaybackHandle {
  /** Resolves when playback finishes or is stopped. `true` if it ran to the end. */
  done: Promise<boolean>;
  stop: () => void;
}

export interface PlayOptions {
  speakers: VoiceSpeaker[];
  prefs?: VoicePrefs;
  /** Optional recording per line (same index as `lines`). */
  audioUrls?: (string | null | undefined)[];
  startAt?: number;
  onLine?: (index: number) => void;
  /** Pause between lines in ms (doubled when the speaker changes). */
  gapMs?: number;
  /** Called when the audio could not be played as intended (so the UI can explain it). */
  onIssue?: (issue: PlaybackIssue) => void;
}

interface Signal {
  stopped: boolean;
  abort: AbortController;
}

const wait = (ms: number, signal: Signal) =>
  new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = () => (signal.stopped || Date.now() - started >= ms ? resolve() : setTimeout(tick, 50));
    tick();
  });

/** Speak one sentence. "failed" when the engine never started speaking or reported an error. */
function speakUtterance(text: string, a: Assignment, signal: Signal): Promise<"ok" | "failed"> {
  return new Promise((resolve) => {
    if (signal.stopped) return resolve("ok");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = a.voice?.lang ?? "de-DE";
    if (a.voice) u.voice = a.voice;
    u.pitch = a.pitch;
    u.rate = a.rate;
    let started = false;
    let settled = false;
    const finish = (result: "ok" | "failed") => {
      if (settled) return;
      settled = true;
      clearInterval(watchdog);
      resolve(result);
    };
    u.onstart = () => {
      started = true;
    };
    u.onend = () => finish(started ? "ok" : "failed");
    u.onerror = (e) => finish(e.error === "interrupted" || e.error === "canceled" ? "ok" : "failed");
    // Keep a reference: Chrome may garbage-collect utterances and never fire onend.
    (window as unknown as { __utterances?: SpeechSynthesisUtterance[] }).__utterances = [u];
    window.speechSynthesis.speak(u);
    const startedAt = Date.now();
    const maxMs = 6000 + text.length * 140;
    const watchdog = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (signal.stopped) {
        window.speechSynthesis.cancel();
        finish("ok");
      } else if (!started && elapsed > 3500) {
        // Never started (offline network voice, blocked engine): let the caller try another voice.
        window.speechSynthesis.cancel();
        finish("failed");
      } else if (started && !window.speechSynthesis.speaking && !window.speechSynthesis.pending && elapsed > 1200) finish("ok");
      else if (elapsed > maxMs) {
        window.speechSynthesis.cancel();
        finish("ok");
      }
    }, 200);
  });
}

/*
 * One reusable <audio> element for all lines. iOS only lets an element play without a fresh tap once it
 * has been started from a tap, and the lines of a recording follow each other without one.
 */
let sharedAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;
const SILENCE = "data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYzLjEuMTAyAAAAAAAAAAAAAAD/84TAAAAAAAAAAAAASW5mbwAAAA8AAAAHAAADYABVVVVVVVVVVVVVVVVVVXFxcXFxcXFxcXFxcXFxjo6Ojo6Ojo6Ojo6Ojo6qqqqqqqqqqqqqqqqqqqrHx8fHx8fHx8fHx8fHx+Pj4+Pj4+Pj4+Pj4+Pj//////////////////8AAAAATGF2YzYzLjEuAAAAAAAAAAAAAAAAJAQgAAAAAAAAA2BRL5eaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/80TEAAAAA0gAAAAATEFNRTQuMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC7/80TEUwAAA0gAAAAAMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC7/80TEpgAAA0gAAAAAMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC7/80TErAAAA0gAAAAAMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC7/80TErAAAA0gAAAAAMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

function audioElement() {
  sharedAudio ??= new Audio();
  return sharedAudio;
}

/** Starts the shared element from the user's tap (playLines is called from click handlers). */
function unlockAudio() {
  if (typeof window === "undefined" || audioUnlocked) return;
  const audio = audioElement();
  audio.src = SILENCE;
  void audio.play().then(() => (audioUnlocked = true), () => undefined);
}

function playUrl(url: string, rate: number, signal: Signal): Promise<"ok" | "failed"> {
  return new Promise((resolve) => {
    const audio = audioElement();
    const finish = (result: "ok" | "failed") => {
      clearInterval(stopWatch);
      audio.onended = audio.onerror = null;
      resolve(result);
    };
    audio.onended = () => finish("ok");
    audio.onerror = () => finish("failed");
    audio.src = url;
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    const stopWatch = setInterval(() => {
      if (signal.stopped) {
        audio.pause();
        finish("ok");
      }
    }, 100);
    audio.play().then(() => (audioUnlocked = true), () => finish("failed"));
  });
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Play a script line by line. Only one playback runs at a time on the page. */
export function playLines(lines: VoiceLine[], opts: PlayOptions): PlaybackHandle {
  stopAll();
  unlockAudio();
  const signal: Signal = { stopped: false, abort: new AbortController() };
  current = signal;
  const done = (async () => {
    let voices = await loadVoices();
    let assignment = assignVoices(opts.speakers, voices, opts.prefs);
    const people = speakerProfiles(opts.speakers);
    const rate = opts.prefs?.rate ?? 1;
    const gap = opts.gapMs ?? 260;
    let reportedFailure = false;
    if (!voices.length && !resolver && !opts.audioUrls?.some(Boolean)) opts.onIssue?.("no-voice");

    for (let i = opts.startAt ?? 0; i < lines.length; i++) {
      if (signal.stopped) return false;
      const line = lines[i];
      opts.onLine?.(i);

      // Warm up the next lines (neural voices take a moment to synthesize the first time).
      if (resolver)
        for (const ahead of lines.slice(i + 1, i + 3)) {
          const who = people.get(ahead.s);
          if (who)
            void resolver(ahead.t, who, signal.abort.signal)
              // Shipped files: fetch ahead so the next line starts without a gap (they are cached as immutable).
              .then((url) => (url?.startsWith("/") ? fetch(url, { signal: signal.abort.signal }) : null))
              .catch(() => null);
        }

      // 1. Recording supplied by the caller, 2. resolver (pre-rendered / neural), 3. browser voice.
      let played = false;
      const url = opts.audioUrls?.[i];
      if (url) played = (await playUrl(url, rate, signal)) === "ok";
      if (!played && resolver && !signal.stopped) {
        const speaker = people.get(line.s) ?? { gender: "f" as const, age: "adult" as const, index: 0 };
        const resolved = await resolver(line.t, speaker, signal.abort.signal).catch(() => null);
        if (resolved && !signal.stopped) played = (await playUrl(resolved, rate, signal)) === "ok";
      }
      if (!played && speechSupported() && !signal.stopped) {
        for (const sentence of splitSentences(line.t)) {
          let a = assignment.get(line.s) ?? { pitch: 1, rate, voice: voices[0] };
          let result = await speakUtterance(sentence, a, signal);
          // A voice that fails is dropped for the session and the sentence is retried once.
          if (result === "failed" && !signal.stopped) {
            if (a.voice) broken.add(a.voice.voiceURI);
            voices = germanVoices();
            assignment = assignVoices(opts.speakers, voices, opts.prefs);
            a = assignment.get(line.s) ?? { pitch: 1, rate, voice: voices[0] };
            result = await speakUtterance(sentence, a, signal);
            if (result === "failed" && !reportedFailure) {
              reportedFailure = true;
              opts.onIssue?.("speech-failed");
            }
          }
        }
      }
      const next = lines[i + 1];
      if (next) await wait(next.s === line.s ? gap : gap * 2, signal);
    }
    return !signal.stopped;
  })();
  return {
    done,
    stop: () => {
      signal.stopped = true;
      signal.abort.abort();
      if (speechSupported()) window.speechSynthesis.cancel();
    },
  };
}

let current: Signal | null = null;

export function stopAll() {
  if (current) {
    current.stopped = true;
    current.abort.abort();
  }
  current = null;
  sharedAudio?.pause();
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Speak a single word or sentence (vocabulary, phrases). */
export function speak(text: string, gender: Gender = "f", prefs: VoicePrefs = {}): PlaybackHandle {
  return playLines([{ s: "x", t: text }], { speakers: [{ id: "x", gender }], prefs, gapMs: 0 });
}
