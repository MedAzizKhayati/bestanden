#!/usr/bin/env bun
/**
 * Pre-renders every spoken line of the listening content with a neural voice into
 * public/audio/tts/<key>.mp3 and lists them in public/audio/manifest.json. The player uses these
 * files for everyone – before the user's own neural voice and before the browser's voices.
 *
 *   OPENAI_API_KEY=…     bun scripts/audio/render.ts --engine openai
 *   ELEVENLABS_API_KEY=… bun scripts/audio/render.ts --engine elevenlabs --only hoeren-2
 *   GOOGLE_TTS_API_KEY=… bun scripts/audio/render.ts --engine google --dry-run
 *
 * Existing files are kept, so the script can be re-run after content changes (only new or changed
 * lines are rendered). Real studio recordings belong in the content's `recording` fields instead.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AudioManifest } from "../../src/lib/audio/audio-key";
import { audioKey } from "../../src/lib/audio/audio-key";
import { narratorLines, withNarrator } from "../../src/lib/audio/narrator";
import { speakerProfiles, type VoiceLine, type VoiceSpeaker } from "../../src/lib/audio/speech";
import { serverTtsKey, synthesize } from "../../src/lib/audio/tts-providers";
import { DEFAULT_TTS_MODELS, neuralVoiceFor, type NeuralEngine } from "../../src/lib/audio/voice-map";
import { EXAMS, allParts } from "../../src/lib/exams";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "public/audio");

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : undefined;
};
const engine = (flag("engine") ?? "openai") as NeuralEngine;
const only = flag("only");
const dryRun = args.includes("--dry-run");
const concurrency = Number(flag("concurrency") ?? 4);
if (!["openai", "elevenlabs", "google"].includes(engine)) throw new Error(`unknown engine "${engine}"`);
const apiKey = serverTtsKey(engine);
if (!apiKey && !dryRun) throw new Error(`set the API key for ${engine} (OPENAI_API_KEY, ELEVENLABS_API_KEY or GOOGLE_TTS_API_KEY)`);

interface Job {
  key: string;
  text: string;
  voice: string;
  source: string;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
const jsonFiles = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : []);

/** Every line a player can speak for a recording, with the same speaker profiles the player uses. */
async function collect(lines: VoiceLine[], speakers: VoiceSpeaker[], source: string, jobs: Map<string, Job>) {
  const profiles = speakerProfiles(speakers);
  for (const line of lines) {
    const profile = profiles.get(line.s);
    if (!profile) continue;
    const key = await audioKey(line.t, profile);
    if (!jobs.has(key)) jobs.set(key, { key, text: line.t, voice: neuralVoiceFor(engine, profile), source });
  }
}

const jobs = new Map<string, Job>();
for (const exam of EXAMS) {
  for (const part of allParts(exam)) {
    if (only && part.id !== only) continue;
    const dir = join(CONTENT, exam.id, part.id);
    for (const file of jsonFiles(dir)) {
      const set = readJson(join(dir, file));
      const source = `${part.id}/${file}`;
      const speakers = set.speakers as VoiceSpeaker[] | undefined;
      if (!speakers) continue;
      if (part.audio) {
        // Hören: the announcer's instruction, intro, item scripts / the conversation.
        const cast = withNarrator(speakers);
        await collect(narratorLines(part.instruction), cast, source, jobs);
        if (Array.isArray(set.intro)) await collect(set.intro as VoiceLine[], cast, source, jobs);
        for (const item of (set.items as { script: VoiceLine[] }[] | undefined) ?? []) await collect(item.script, cast, source, jobs);
        if (Array.isArray(set.script)) await collect(set.script as VoiceLine[], cast, source, jobs);
      } else if (Array.isArray(set.model)) {
        // Sprechen: model dialogues.
        await collect(set.model as VoiceLine[], speakers, source, jobs);
      }
    }
  }
}
if (!only || only === "placement")
  for (const file of jsonFiles(join(CONTENT, "placement"))) {
    const test = readJson(join(CONTENT, "placement", file)) as { sections: { skill: string; recordings?: { speakers: VoiceSpeaker[]; script: VoiceLine[] }[] }[] };
    for (const r of test.sections.find((s) => s.skill === "hoeren")?.recordings ?? []) await collect(r.script, r.speakers, `placement/${file}`, jobs);
  }

mkdirSync(join(OUT, "tts"), { recursive: true });
const manifestPath = join(OUT, "manifest.json");
const manifest: AudioManifest = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, "utf8")) as AudioManifest)
  : { version: 1, engine, files: [] };
const done = new Set(manifest.files.filter((k) => existsSync(join(OUT, "tts", `${k}.mp3`))));
const todo = [...jobs.values()].filter((j) => !done.has(j.key));
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`${jobs.size} lines in total · ${done.size} already rendered · ${todo.length} to render (${chars} characters) with ${engine}`);
if (dryRun) process.exit(0);

let finished = 0;
let failures = 0;
const saveManifest = () => writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, engine, files: [...done].sort() }, null, 2)}\n`);
async function worker() {
  for (let job = todo.shift(); job; job = todo.shift()) {
    try {
      const audio = await synthesize(engine, { text: job.text, voice: job.voice, model: DEFAULT_TTS_MODELS[engine], apiKey: apiKey! });
      writeFileSync(join(OUT, "tts", `${job.key}.mp3`), Buffer.from(audio));
      done.add(job.key);
    } catch (e) {
      failures++;
      console.error(`✗ ${job.source}: ${(e as Error).message}`);
    }
    if (++finished % 25 === 0) {
      saveManifest();
      console.log(`  ${finished} rendered …`);
    }
  }
}
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
saveManifest();
console.log(`✓ ${finished - failures} files written${failures ? ` · ${failures} failed (re-run to retry)` : ""} → public/audio/`);
