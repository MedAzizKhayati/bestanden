"use client";

import { audioKey, type AudioManifest } from "./audio-key";
import type { AudioResolver } from "./speech";
import { DEFAULT_TTS_MODELS, neuralVoiceFor, type NeuralEngine } from "./voice-map";

let manifest: Promise<Set<string>> | null = null;

/** Pre-rendered (or recorded) files shipped with the site – used before any synthetic voice. */
export const prerenderedResolver: AudioResolver = async (text, speaker) => {
  manifest ??= fetch("/audio/manifest.json")
    .then((r) => (r.ok ? (r.json() as Promise<AudioManifest>) : null))
    .then((m) => new Set(m?.files ?? []))
    .catch(() => new Set<string>());
  const files = await manifest;
  if (!files.size) return null;
  const key = await audioKey(text, speaker);
  return files.has(key) ? `/audio/tts/${key}.mp3` : null;
};

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface NeuralOptions {
  /** The user's key; without it the server's key is used (if it has one). */
  key?: string;
  voices?: { f?: string; m?: string };
  model?: string;
}

/**
 * Neural voices via /api/tts. Every line is cached on the device (Cache Storage), so a set costs
 * API credits once and replays instantly – even offline.
 */
export function createNeuralResolver(engine: NeuralEngine, opts: NeuralOptions): AudioResolver {
  const model = opts.model || DEFAULT_TTS_MODELS[engine];
  const memo = new Map<string, Promise<string | null>>();
  return (text, speaker, signal) => {
    const voice = neuralVoiceFor(engine, speaker, opts.voices);
    const id = `${voice}|${text}`;
    const known = memo.get(id);
    if (known) return known;
    const job = (async () => {
      const cacheKey = `https://tts.cache/${engine}/${encodeURIComponent(model || "-")}/${encodeURIComponent(voice)}/${await sha256(text)}`;
      const cache = typeof caches !== "undefined" ? await caches.open("bestanden-tts-v1").catch(() => null) : null;
      let res = cache ? await cache.match(cacheKey) : undefined;
      if (!res) {
        const fresh = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(opts.key ? { "x-tts-key": opts.key } : {}) },
          body: JSON.stringify({ engine, text, voice, model: model || undefined }),
          signal,
        });
        if (!fresh.ok) return null;
        if (cache) await cache.put(cacheKey, fresh.clone()).catch(() => undefined);
        res = fresh;
      }
      return URL.createObjectURL(await res.blob());
    })().catch(() => null);
    memo.set(id, job);
    void job.then((url) => {
      if (!url) memo.delete(id);
    });
    return job;
  };
}
