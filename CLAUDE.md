@AGENTS.md

# Bestanden – project notes

- Bun for everything: `bun dev`, `bun run build`, `bun run typecheck`, `bun run lint`, `bun run content:validate`.
- Content is JSON in `content/`, validated by `src/lib/content/schemas.ts` + `checks.ts`. Read `content/AUTHORING.md` before adding or editing content; all content must be original (never copy telc/publisher material). Run `bun run content:validate` after every content change (must be 0 errors).
- Exam structure, timing, points and rubrics live only in `src/lib/exams/<exam>.ts`. New levels/exams: see README "Adding a level or exam".
- Client code must not import values from `src/lib/content/schemas.ts` (pulls zod into the browser bundle); use `src/lib/content/constants.ts` or `import type`.
- React Compiler lint rules are on: no `Date.now()`/`Math.random()` during render (use `useNow()`), no synchronous setState in effects.
- AI goes through the provider layer `src/lib/ai/providers/` (Anthropic via the official SDK, OpenAI, Gemini, OpenAI-compatible); routes resolve the config with `resolveConfig(req)` (user headers override env). Client calls use `aiFetch()`/`useAiAvailability()` from `src/lib/ai/request.ts`. Points are computed server-side from A–D grades. Without any key the UI falls back to self-assessment.
- Audio: `playLines()` in `src/lib/audio/speech.ts` resolves recordings → pre-rendered files (`bun run audio:render`) → the user's neural voice → device voices. Never add novelty voices; keep `audioKey()`/`speakerProfiles()` in sync with the render script.
- Blind QA for answer keys: `bun scripts/qa/blind.ts` (exam sets) and `bun scripts/qa/grammar-blind.ts` (grammar drills).
- UI is bilingual (`/de/…`, `/en/…`): all routes live under `src/app/[locale]`, `src/proxy.ts` redirects unprefixed URLs (cookie → Accept-Language → en). UI strings live in `src/i18n/messages/{en,de}/<namespace>.ts` (en defines the shape, de is typed `Messages["ns"]`); server code uses `getT()`/`getLocale()` from `@/i18n/server`, client code `useT()`/`useLocale()` from `@/i18n/client`. Always import `Link` from `@/i18n/link` (never `next/link`), and wrap `router.push` paths in `localizeHref`.
- Pass `locale` to the content loaders (`getSet(…, locale)`, `getGrammarTopic(id, locale)`, …) and use `requireExam(slug, locale)` / `useExam()` so German `…De` content fields and exam texts are used. English glosses (`nameEn`, `titleEn`, `instructionEn`, `labelEn`) are shown only in the English UI.
- German content fields: see `content/AUTHORING.md` → "German versions"; `bun run content:validate --i18n=de` checks completeness.
- Tests: `bun test` (must pass). Add a test when you change scoring, content checks, i18n helpers or AI providers.
- `private/` holds the user's personal copies of official telc material (gitignored). Never commit, copy into `content/`, or serve them in production; never transcribe their texts into the codebase. See README → "Private official materials".
