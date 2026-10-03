#!/usr/bin/env bun
/**
 * Pre-renders every spoken line of the site into public/audio/tts/<key>.mp3 and lists them in
 * public/audio/manifest.json. The player uses these files for everyone – before the user's own neural
 * voice and before the browser's voices.
 *
 * Local engines (free, offline, Apple Silicon – setup in README → "Pre-rendered voices"):
 *   TTS_PYTHON=.tts/bin/python bun scripts/audio/render.ts --engine qwen
 *   TTS_PYTHON=.tts/bin/python bun scripts/audio/render.ts --engine voxcpm --only hoeren-2 --limit 20
 * Cloud engines (need a key):
 *   OPENAI_API_KEY=… bun scripts/audio/render.ts --engine openai
 *   ELEVENLABS_API_KEY=… bun scripts/audio/render.ts --engine elevenlabs
 *   GOOGLE_TTS_API_KEY=… bun scripts/audio/render.ts --engine google
 *
 * --only <partId|placement|vocabulary|phrases|lists>  · --limit N · --dry-run
 * --prune  deletes files that no current line uses (only together with a full run, i.e. without --only)
 *
 * Existing files are kept, so the script can be re-run after content changes (only new or changed
 * lines are rendered). Real studio recordings belong in the content's `recording` fields instead.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AudioManifest } from "../../src/lib/audio/audio-key";
import { audioKey } from "../../src/lib/audio/audio-key";
import { NARRATOR_ID, narratorLines, withNarrator } from "../../src/lib/audio/narrator";
import { speakerProfiles, type SpeakerProfile, type VoiceLine, type VoiceSpeaker } from "../../src/lib/audio/speech";
import { spokenNumbers } from "../../src/lib/audio/spoken-numbers";
import { serverTtsKey, synthesize } from "../../src/lib/audio/tts-providers";
import { DEFAULT_TTS_MODELS, neuralVoiceFor, type NeuralEngine } from "../../src/lib/audio/voice-map";
import { PhraseBank, ReferenceList, VocabTheme } from "../../src/lib/content/schemas";
import { listSpeech, spokenPhrase, spokenWord } from "../../src/lib/content/spoken";
import { EXAMS, allParts } from "../../src/lib/exams";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "public/audio");

const LOCAL_ENGINES = ["qwen", "voxcpm"] as const;
type LocalEngine = (typeof LOCAL_ENGINES)[number];
type Engine = NeuralEngine | LocalEngine;

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : undefined;
};
const engine = (flag("engine") ?? "qwen") as Engine;
const only = flag("only");
const limit = Number(flag("limit") ?? Infinity);
const dryRun = args.includes("--dry-run");
const prune = args.includes("--prune");
const concurrency = Number(flag("concurrency") ?? 4);
const isLocal = (LOCAL_ENGINES as readonly string[]).includes(engine);
if (!isLocal && !["openai", "elevenlabs", "google"].includes(engine)) throw new Error(`unknown engine "${engine}"`);
const apiKey = isLocal ? undefined : serverTtsKey(engine as NeuralEngine);
if (!isLocal && !apiKey && !dryRun) throw new Error(`set the API key for ${engine} (OPENAI_API_KEY, ELEVENLABS_API_KEY or GOOGLE_TTS_API_KEY)`);
if (prune && only) throw new Error("--prune needs a full run (no --only)");

interface Job {
  key: string;
  text: string;
  voice: string;
  source: string;
}

/** Local cast (scripts/audio/cast.json): two voices per gender and age, plus the exam announcer. */
function localVoice(profile: SpeakerProfile, speakerId: string) {
  return speakerId === NARRATOR_ID ? "narrator" : `${profile.gender}_${profile.age}_${profile.index % 2}`;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
const jsonFiles = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : []);
const wanted = (scope: string) => !only || only === scope;

/** Every line a player can speak for a recording, with the same speaker profiles the player uses. */
async function collect(lines: VoiceLine[], speakers: VoiceSpeaker[], source: string, jobs: Map<string, Job>) {
  const profiles = speakerProfiles(speakers);
  for (const line of lines) {
    const profile = profiles.get(line.s);
    if (!profile) continue;
    const key = await audioKey(line.t, profile);
    if (jobs.has(key)) continue;
    const voice = isLocal ? localVoice(profile, line.s) : neuralVoiceFor(engine as NeuralEngine, profile);
    jobs.set(key, { key, text: line.t, voice, source });
  }
}

/** Speak buttons (vocabulary, Redemittel, lists) use one adult female voice – see speak() in speech.ts. */
const SPEAK_BUTTON: VoiceSpeaker[] = [{ id: "x", gender: "f" }];
const spokenByButton = (texts: string[], source: string, jobs: Map<string, Job>) =>
  collect(
    texts.filter(Boolean).map((t) => ({ s: "x", t })),
    SPEAK_BUTTON,
    source,
    jobs,
  );

const jobs = new Map<string, Job>();
for (const exam of EXAMS) {
  for (const part of allParts(exam)) {
    if (!wanted(part.id)) continue;
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
if (wanted("placement"))
  for (const file of jsonFiles(join(CONTENT, "placement"))) {
    const test = readJson(join(CONTENT, "placement", file)) as { sections: { skill: string; recordings?: { speakers: VoiceSpeaker[]; script: VoiceLine[] }[] }[] };
    for (const r of test.sections.find((s) => s.skill === "hoeren")?.recordings ?? []) await collect(r.script, r.speakers, `placement/${file}`, jobs);
  }
if (wanted("vocabulary"))
  for (const file of jsonFiles(join(CONTENT, "vocabulary"))) {
    const theme = VocabTheme.parse(readJson(join(CONTENT, "vocabulary", file)));
    await spokenByButton(theme.words.flatMap((w) => [spokenWord(w), w.example ?? ""]), `vocabulary/${file}`, jobs);
  }
if (wanted("phrases"))
  for (const file of jsonFiles(join(CONTENT, "phrases"))) {
    const bank = PhraseBank.parse(readJson(join(CONTENT, "phrases", file)));
    await spokenByButton(bank.groups.flatMap((g) => g.phrases.map((p) => spokenPhrase(p.de))), `phrases/${file}`, jobs);
  }
if (wanted("lists"))
  for (const file of jsonFiles(join(CONTENT, "lists"))) await spokenByButton(listSpeech(ReferenceList.parse(readJson(join(CONTENT, "lists", file)))), `lists/${file}`, jobs);

mkdirSync(join(OUT, "tts"), { recursive: true });
const manifestPath = join(OUT, "manifest.json");
const manifest: AudioManifest = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, "utf8")) as AudioManifest)
  : { version: 1, engine, files: [] };
const done = new Set(manifest.files.filter((k) => existsSync(join(OUT, "tts", `${k}.mp3`))));
const todo = [...jobs.values()].filter((j) => !done.has(j.key)).slice(0, limit);
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`${jobs.size} lines in total · ${done.size} already rendered · ${todo.length} to render (${chars} characters, ≈ ${Math.round(chars / 14 / 60)} min of speech) with ${engine}`);

if (prune) {
  const stale = readdirSync(join(OUT, "tts")).filter((f) => f.endsWith(".mp3") && !jobs.has(f.slice(0, -4)));
  console.log(`${stale.length} file(s) no longer used${dryRun ? "" : " – deleted"}`);
  if (!dryRun) {
    for (const f of stale) rmSync(join(OUT, "tts", f));
    for (const f of stale) done.delete(f.slice(0, -4));
  }
}
if (dryRun) process.exit(0);

const total = todo.length;
let finished = 0;
let failures = 0;
const started = Date.now();
const saveManifest = () => writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, engine, files: [...done].sort() }, null, 2)}\n`);
const progress = () => {
  if (++finished % 25 && finished !== total) return;
  saveManifest();
  const perLine = (Date.now() - started) / finished;
  console.log(`  ${finished}/${total} rendered · about ${Math.round(((total - finished) * perLine) / 60000)} min left`);
};

if (isLocal) {
  // One Python process keeps the model loaded and renders the jobs in order (see local_tts.py).
  const python = process.env.TTS_PYTHON ?? "python3";
  const worker = Bun.spawn([python, join(ROOT, "scripts/audio/local_tts.py"), "--engine", engine], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });
  const byKey = new Map(todo.map((j) => [j.key, j]));
  for (const job of todo)
    worker.stdin.write(`${JSON.stringify({ key: job.key, text: spokenNumbers(job.text), voice: job.voice, out: join(OUT, "tts", `${job.key}.mp3`) })}\n`);
  await worker.stdin.end();
  let buffer = "";
  const decoder = new TextDecoder();
  const reader = worker.stdout.getReader();
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    buffer += decoder.decode(chunk.value, { stream: true });
    for (let nl = buffer.indexOf("\n"); nl >= 0; nl = buffer.indexOf("\n")) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("{")) continue;
      const result = JSON.parse(line) as { key: string; ok: boolean; error?: string };
      if (result.ok) done.add(result.key);
      else {
        failures++;
        console.error(`✗ ${byKey.get(result.key)?.source}: ${result.error} – „${byKey.get(result.key)?.text.slice(0, 60)}“`);
      }
      progress();
    }
  }
  if ((await worker.exited) !== 0) console.error(`the voice worker exited with code ${worker.exitCode}`);
} else {
  async function cloudWorker() {
    for (let job = todo.shift(); job; job = todo.shift()) {
      try {
        const audio = await synthesize(engine as NeuralEngine, { text: job.text, voice: job.voice, model: DEFAULT_TTS_MODELS[engine as NeuralEngine], apiKey: apiKey! });
        writeFileSync(join(OUT, "tts", `${job.key}.mp3`), Buffer.from(audio));
        done.add(job.key);
      } catch (e) {
        failures++;
        console.error(`✗ ${job.source}: ${(e as Error).message}`);
      }
      progress();
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, cloudWorker));
}
saveManifest();
console.log(`✓ ${finished - failures} files written${failures ? ` · ${failures} failed (re-run to retry)` : ""} → public/audio/`);
