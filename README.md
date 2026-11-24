# Bestanden – telc Deutsch B1 & B2 exam training

A complete preparation platform for **telc Deutsch B1 (Zertifikat Deutsch)** and **telc Deutsch B2**, built with Next.js 16, Bun and the Claude API – with a full **German and English interface**. All practice material is original and follows the official exam formats exactly (item counts, points, timing, play counts, rubrics).

**Content:**
- **telc B1:** 147 exam practice sets (12 × Lesen 1, 12 × Lesen 2, 10 × Lesen 3, 12 + 12 × Sprachbausteine, 10 × each Hören part, 24 writing tasks, 35 speaking tasks) and 8 full mock exams.
- **telc B2:** 162 exam practice sets (12 × each Lesen and Sprachbausteine part, 10 × each Hören part, 24 writing tasks, 16 × each speaking part) and 8 full mock exams with the Aufgabe A/B writing choice.
- Every answer key of both exams verified by an independent blind solve.

## What's inside

| Area | Features |
| --- | --- |
| **Exam practice** | Every part of the written and oral exam: Lesen 1–3, Sprachbausteine 1–2, Hören 1–3, Schreiben, Sprechen 1–3 – with the official instructions, item numbers and point weighting. B2 adds its own formats: info texts in Lesen 3, a six-report news bulletin (one without a statement) in Hören 1, spoken contexts in Hören 3, everything heard once, a choice of two writing tasks (three of four points, ≥ 150 words), and the speaking parts „Über Erfahrungen sprechen“ (topic sheet with seven topics) and „Diskussion“ (newspaper article) |
| **Two exams** | Switch between telc B1 and B2 in the sidebar or the welcome flow; dashboard, study plan, level check and the grammar/vocabulary/Redemittel filters follow the chosen exam |
| **Timers** | Every exercise is timed with the recommended time. *Strict mode* (default) auto-submits at 0:00; the clock runs on wall time, so reloading, switching tabs or leaving the page never gives extra time. *Practice mode* records overtime instead |
| **Hören with audio** | Real recordings first: a set can ship studio/voice-actor files, and `bun run audio:render` pre-renders every line with a natural neural voice for all users. Otherwise the user's own neural voice (OpenAI, ElevenLabs, Google Cloud – via their key, cached on the device) or the best voices of the device (novelty/robotic voices are never used; failing voices are replaced instead of skipped). *Exam simulation* reproduces the real recording: the announcer reads the instructions, then reading time, once/twice playback, pauses and marking time without pausing; *training mode* keeps the play limits but allows speed control. Sound check, clickable transcripts with the evidence highlighted |
| **Schreiben** | 30-minute editor with umlaut toolbar, Redemittel inserter, Leitpunkte checklist and live checks (salutation, du/Sie consistency, sentences starting with „Ich“, connectors, length). AI correction scores the e-mail with the three official criteria (max. 45), marks every error in your text, and shows a corrected and an improved version |
| **Sprechen** | Exam task sheets, preparation timer, notes, model dialogues (two voices), an **AI exam partner** you talk to by voice or keyboard, recording + live transcription, and AI feedback on the official criteria |
| **Mock exams** | The full written exam in sequence (90 min Lesen + Sprachbausteine with free navigation, Hören without pause, 30 min Schreiben), scored out of 225 with the 135-point pass mark and a full answer review |
| **Learning** | 69 grammar topics (A2 → B2, 29 of them B2: Konjunktiv I, Passiversatz, Partizipialattribute, Nominalstil, Modalpartikeln …) with tables, typical mistakes and 884 self-checking drills · 2 306 words in 44 themes (1 116 B1, 1 190 B2) with articles, plurals, examples, pronunciation, spaced-repetition flashcards, quiz and der/die/das trainer · 884 Redemittel (B1 and B2 banks) · 13 reference lists with 894 entries (verbs, nouns and adjectives with prepositions, irregular verbs, connectors, Nomen-Verb-Verbindungen, genitive prepositions …) with drills · strategy guides for every part of both exams |
| **Onboarding & level check** | First visit: a short welcome flow (language, exam, exam date, daily time) and an **Einstufungstest** per exam (grammar, vocabulary, reading, listening) with a level per skill (B1 test: A2 → B2, B2 test: B1 → C1), exam readiness, the grammar topics to revise and a link to the study plan. A "first steps" checklist guides new users on the dashboard |
| **Any AI provider** | Anthropic Claude, OpenAI, Google Gemini or any OpenAI-compatible server (OpenRouter, Mistral, Groq, Ollama, LM Studio). Server-side via env, or per user: choose provider, model and API key in the settings (stored only in the browser, overrides the server configuration), with a connection test |
| **Two languages** | Complete German (`/de`) and English (`/en`) interface. The language is picked from the browser on the first visit and can be switched anywhere (header or settings); every explanation, grammar rule, strategy and the exam rubric exist in both languages, and AI feedback is written in the chosen language. Exam tasks themselves are always German |
| **Progress** | Dashboard with the next best step, predicted written score, per-part statistics (incl. time discipline), mistake trainer with spaced repetition, auto-generated study plan up to your exam date, export/import of all data |

## Getting started

```bash
bun install
cp .env.example .env.local   # optional: an AI provider key (Anthropic, OpenAI, Gemini, …) and voice keys
bun dev                      # http://localhost:3000
```

Everything except the AI features works without any configuration – and users can still bring their own AI key in the settings. Progress is stored in the browser (localStorage).

### AI features

Writing correction, speaking feedback and the AI conversation partner run through a provider layer (`src/lib/ai/providers/`) with adapters for **Anthropic** (official SDK, structured outputs, server-side refusal fallbacks), **OpenAI** (official SDK, strict JSON schema), **Google Gemini** (`@google/genai`, JSON schema) and **OpenAI-compatible** servers (JSON schema → JSON mode → validated free text, whatever the server supports). See `.env.example`:

- Server-wide: set one provider key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `AI_BASE_URL` + `AI_API_KEY`), optionally `AI_PROVIDER` and `AI_MODEL`.
- Per user: *Settings → AI feedback* – provider, model and key. The key is stored only in the browser and sent with the user's own requests (`x-ai-*` headers); it overrides the server configuration and is never logged or stored on the server.
- Assessments are schema-validated; points are computed on the server from the A–D grades, never taken from the model. Feedback is written in the UI language.
- Requests on the server's key are rate-limited per IP (30 corrections/hour); for a public deployment add authentication or a shared limiter (e.g. Redis/Upstash). Users' base URLs in private networks are rejected in production (SSRF protection).

### Audio

Every spoken line is resolved in this order (`src/lib/audio/speech.ts`):

1. **Real recordings** from the content: `recording` on a Hören text/conversation (`/audio/...` files in `public/`).
2. **Pre-rendered files** in `public/audio/tts/`, shipped with the site, so every visitor – phones included – hears the same natural voices without a key. `bun run audio:render` renders every line of the Hören sets, the level check, the model dialogues and the speak buttons (vocabulary, Redemittel, lists). Files are content-addressed, so re-runs only render new or changed lines. See [Pre-rendered voices](#pre-rendered-voices).
3. **The user's neural voice** (Settings → Voices: OpenAI, ElevenLabs or Google Cloud with their key), synthesized via `/api/tts` and cached in the browser's Cache Storage.
4. **Device voices** (Web Speech API), ranked natural → premium → standard; novelty voices are excluded and a voice that fails is replaced on the fly. The UI explains how to install better free voices.

telc's own recordings are copyrighted and are not part of this project; licensed or self-produced recordings can be added per set via `recording`.

### Pre-rendered voices

The default engine is free and runs locally on Apple Silicon: [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) (Apache-2.0) through
[mlx-audio](https://github.com/Blaizzy/mlx-audio); `voxcpm` ([VoxCPM2](https://github.com/OpenBMB/VoxCPM), Apache-2.0) works the same way.
The voices are synthetic: `scripts/audio/cast.json` describes two voices per gender and age plus the exam announcer; each is
designed once from its description and then reused through its reference clip in `scripts/audio/voices/<engine>/`, so a speaker
sounds the same in every line. No real person's voice is cloned.

```bash
brew install ffmpeg
uv venv .tts --python 3.12 && uv pip install --python .tts/bin/python mlx-audio soundfile
.tts/bin/python scripts/audio/local_tts.py --design --engine qwen     # only if a voice in cast.json has no reference clip yet
TTS_PYTHON=.tts/bin/python bun run audio:render -- --engine qwen --dry-run   # what would be rendered
TTS_PYTHON=.tts/bin/python bun run audio:render -- --engine qwen --prune     # render (≈ real time on an M3), delete unused files
```

Numbers are spelled out before synthesis (`src/lib/audio/spoken-numbers.ts`); every take is checked for a plausible length and
retried, falling back to sentence-by-sentence rendering. Cloud engines remain available: `--engine openai|elevenlabs|google` with
`OPENAI_API_KEY`, `ELEVENLABS_API_KEY` or `GOOGLE_TTS_API_KEY`.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun dev` / `bun run build` / `bun start` | develop, build (static generation of every page for both languages and both exams), serve |
| `bun run typecheck` / `bun run lint` | TypeScript and ESLint (React Compiler rules) |
| `bun test` | unit and integration tests (scoring of every set of every exam, exam definitions, i18n parity, content validity, AI providers against a mock server, voice selection, level check, study plan, mock composition) |
| `bun run audio:render -- [--engine qwen] [--exam telc-b2] [--only hoeren-2] [--dry-run] [--prune]` | pre-render natural audio for all spoken content (see Pre-rendered voices) |
| `bun run content:validate [path]` | validate content against the schemas and consistency rules |
| `bun run content:validate --i18n=de [path]` | additionally require the German version of every explanation |
| `bun scripts/i18n/extract.ts <out.json> <paths>` / `bun scripts/i18n/apply.ts <files>` | collect English explanations that lack a German version / write translated worksheets back (keeps file formatting) |
| `bun scripts/qa/blind.ts export <part> <dir> [examId]` | export sets without answers for blind review (default `telc-b1`) |
| `bun scripts/qa/blind.ts compare <part> <answers.json> [examId]` | compare a reviewer's answers with the key |
| `bun scripts/qa/difficulty.ts <part> [examId]` | text measures of every set next to the measured telc targets |

## Architecture

```
content/                     JSON content (validated with Zod)
  AUTHORING.md               rules for writing content – read before adding sets
  telc-b1/<partId>/NN.json   exam practice sets (lesen-1 … sprechen-3)
  telc-b1/strategies.json    strategy guides
  telc-b2/…                  the same for telc Deutsch B2
  grammar/  vocabulary/  phrases/  lists/   shared learning content, each file tagged with its level (A2/B1/B2)
  placement/<examId>.json    level check per exam (B1: A2/B1/B2 items, B2: B1/B2/C1 items)
src/lib/content/             schemas, consistency checks, server-side loader
src/lib/exams/               exam definitions: structure, timing, points, rubrics
src/lib/exam/                scoring, mock-exam composition, section styling
src/lib/audio/               speech engine (recordings → pre-rendered → neural → device voices), exam sequencer, TTS providers, recognition
src/lib/ai/                  provider layer (Anthropic, OpenAI, Gemini, compatible), assessment, conversation partner
src/lib/placement/           level-check scoring (Einstufungstest)
tests/                       bun test suites
src/lib/store/               client state (zustand + localStorage): progress, vocab SRS, settings, mocks
src/components/exam/         exercise runner, timers, result views, one player per task type
src/components/{writing,speaking,grammar,vocab,mock,…}
src/i18n/                    locales, typed UI dictionaries (messages/en, messages/de), server/client helpers, Link
src/proxy.ts                 redirects unprefixed URLs to /de or /en (cookie → Accept-Language → en)
src/app/[locale]/(app)/      routes – every page is statically generated for both languages
```

Key decisions:

- **Content is data.** Every task type has a schema; pages are generated from JSON at build time. Adding sets needs no code.
- **One exam definition drives everything** – timers, scoring, answer-sheet numbering, rubrics, play counts, the writing rules and navigation all come from `src/lib/exams/<exam>.ts` (`telc-b1.ts`, `telc-b2.ts`).
- **The learner's current exam.** The exam switcher (sidebar, welcome flow) stores `settings.examSlug`; the exam pages set it too. Dashboard, study plan, level check, grammar/vocabulary/Redemittel filters follow it. Pages outside `/[exam]` are static, so they render the data of every exam and pick in the browser.
- **Set ids repeat across exams** (`lesen-1-01` exists for B1 and B2): attempts, writing and speaking records carry `examId`, and mistake cards use `mistakeId()` (B1 ids unchanged, other exams prefixed).
- **Bilingual by construction.** UI strings live in typed dictionaries (the English file defines the shape, German must match it). Content keeps German twins of every English explanation (`explanation` → `explanationDe`); the loader picks the right one, so pages never ship both languages.
- **Local-first.** No accounts are needed; all progress lives in the browser and can be exported. The stores are isolated so a sync backend can be added later.

## Adding a level or exam (C1, DTZ, …)

telc B2 was added this way – use it as the worked example.

1. Create `src/lib/exams/<exam>.ts` with its sections, parts, timing, points, play counts, writing rules (`writing: { minWords, cover, choice }`) and rubrics (see `telc-b1.ts` / `telc-b2.ts`) plus its German explanations (`<exam>.de.ts`, registered in `localize.ts`), and add it to `EXAMS` in `src/lib/exams/index.ts` and to `EXAM_IDS` in `src/lib/content/schemas.ts`.
2. Reuse the existing task types (`headline-matching`, `text-mc`, `ad-matching`, `gap-mc`, `gap-wordbank`, `audio-short`, `audio-long`, `writing-email`, `speaking-*`) where the format matches; add a schema + player for genuinely new formats (B2 added `speaking-experience`, `speaking-discussion`, info texts in `ad-matching`, unscored reports and spoken contexts in `audio-short`).
3. Add length/difficulty targets for the exam in `src/lib/content/difficulty.ts` and exam-specific rules in `checks.ts`, then content under `content/<exam>/<partId>/` (rules in `content/AUTHORING.md`) and run `bun run content:validate`.
4. AI prompts are per level (`src/lib/ai/writing.ts`, `speaking.ts`), and the level check needs `content/placement/<examId>.json`.
5. Remove the exam from `PLANNED_EXAMS` – it now appears in the exam switcher.

## Adding a UI language

1. Add the code to `LOCALES` (and `LOCALE_LABELS`, `LOCALE_TAGS`) in `src/i18n/config.ts`.
2. Create `src/i18n/messages/<code>/` with one file per namespace, typed `Messages["<namespace>"]` – TypeScript reports every missing string – and register it in `src/i18n/messages.ts`.
3. For content explanations, extend the `…De` convention (e.g. `…Tr`) in `src/lib/content/localize.ts` and the schemas; until then the English explanations are used as fallback.

## Private official materials (personal use)

You can practise with official practice tests that you downloaded yourself (e.g. telc's free *Zertifikat Deutsch B1 Übungstest Version 1*: MP3 + booklet PDF). They live in `private/` – **gitignored**, never served in production (`/api/private/*` returns 404 there unless `ALLOW_PRIVATE_MATERIALS=1` is set for a local `next start`) – and appear under *Modelltests → Official telc practice tests*:

```
private/telc/<test-id>/
  hoeren.mp3     the official recording (played once without pause under exam conditions, with controls in training mode)
  heft.pdf       the booklet, shown next to the answer sheet at the right page
  info.json      { "title", "examId": "telc-b1", "source", "pages": { "lesen", "sprachbausteine", "hoeren", "schreiben", "sprechen", "loesungen", "hoertexte" }, "key": { "1": "i", …, "41": "r", … } }
```

The answer sheet (items 1–60) is scored with the official points; without a `key` you enter the solutions once in the app. For Schreiben you can paste the booklet's task to get the AI correction. These files are telc's: keep them for yourself – don't commit, share or deploy them.

## Content policy

All texts, recordings, tasks and answer keys are written for this project in the exact telc format; nothing is copied from telc, publishers or other websites. „telc“ is a trademark of telc gGmbH; this project is independent and not affiliated with telc.

## Roadmap ideas

- Accounts and cloud sync (e.g. Auth.js + Postgres/Drizzle), teacher dashboards
- telc B2, C1 and DTZ content; more UI languages (Arabic, Turkish, Ukrainian …)
- Studio recordings with voice actors for the most-used Hören sets
- Full oral exam simulation (all three parts in sequence with the AI partner) and PWA/offline mode
