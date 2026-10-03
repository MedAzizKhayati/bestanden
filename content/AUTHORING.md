# Content authoring guide

All learning material is JSON in `/content`, validated by `bun run content:validate <path>`.
The schemas live in `src/lib/content/schemas.ts`, extra consistency rules in `src/lib/content/checks.ts`.
**Read both files before writing content.** A file is only done when the validator reports 0 errors for it
(fix warnings too unless you have a good reason).

## 1. Non-negotiable principles

1. **100 % original.** Never copy or closely paraphrase texts from telc, Goethe, ÖSD, textbooks, websites or
   any other source. Invent your own articles, ads, letters, dialogues, people and companies.
   Use fictional businesses ("Bäckerei Krumbach", "Sprachschule Lingua Plus"), fictional phone numbers,
   and realistic but invented places or real big cities (Köln, Leipzig, Graz, Basel …).
2. **Exam realism.** Every set must feel exactly like the real telc Deutsch B1 task: same text types, same
   length, same kind of traps. A learner who masters our sets must be ready for the real exam.
3. **One unambiguous answer.** Each item has exactly one defensible answer. Distractors must be clearly wrong
   for a careful reader, yet tempting for a careless one (shared keywords, partial truths, wrong detail,
   wrong person, wrong time). Before saving, **solve every item yourself as a test taker** without looking at
   the key. If two answers could be argued, rewrite.
4. **Correct German.** Reformed orthography (dass, muss, Fluss), correct cases and endings, natural word
   order, ß/ä/ö/ü (never ae/oe/ue/ss substitutes), German quotation marks „…“ (never `"`), en dash – for
   ranges ("9–17 Uhr"), decimal comma ("12,50 Euro"). Nouns capitalised. No typos – the whole point of this
   project is to be better than OCR'd material.
5. **B1 level.** Vocabulary and grammar from the B1 inventory (Zertifikat Deutsch / Goethe B1 Wortliste).
   Occasional B2 words are fine in reading texts if the context makes them clear – add them to the glossary.
6. **Variety.** Spread topics, text types, regions (Germany, Austria, Switzerland), ages, jobs, and genders.
   Do not reuse names or scenarios across sets of the same part.

## 2. Explanations (English)

- 1–3 short sentences, written for a B1 learner. Quote the decisive German words in „…“.
- Say *why the answer is right* and, where useful, *why the most tempting distractor is wrong*.
- Example: `„Ab sofort … auch für Radfahrer“ – the text announces a new brochure for cyclists who travel by train, so (d). Headline (g) is a trap: holidays by bike are mentioned, but not that they are getting more popular.`
- `glossary`: 5–12 useful words/phrases from the set with English meanings (lemma form for nouns with article: „die Ermäßigung“).

### German versions (German UI)

The site has a German interface. Every English explanation field gets a German twin next to it:
`explanation` → `explanationDe`, `md` → `mdDe`, `traps` → `trapsDe` (same number of entries), …
The loader shows the `…De` version in the German UI and falls back to English where it is missing.
`src/lib/content/translations.ts` lists the fields per content type (`TRANSLATED_FIELDS`).

- Write the German in clear, simple B1 German, addressing the learner with **du**. Keep every German example,
  quote, option letter and Markdown structure unchanged – only the explanation around it is translated.
- Workflow for new or changed content:
  1. `bun scripts/i18n/extract.ts /tmp/ws.json <files…>` – collects the English texts that still lack a German version.
  2. Translate the values of that JSON (keep the keys) into one or more files.
  3. `bun scripts/i18n/apply.ts <translated files…>` – inserts the `…De` fields next to the originals without reformatting the file.
  4. `bun run content:validate --i18n=de <files…>` – must report 0 errors (it also warns about German fields that look English).
- If you change an English explanation, update its German twin too (re-run apply with the corrected text).

## 3. Topic tags

`topic` must be one of: arbeit, wohnen, gesundheit, reisen, freizeit, einkaufen, essen, familie, bildung,
medien, umwelt, behoerden, kultur, sport, technik, gesellschaft.

`difficulty`: 1 = slightly easier than the exam, 2 = exam level (most sets), 3 = demanding exam level.

## 4. File naming

`content/telc-b1/<partId>/<NN>.json` with `"id": "<partId>-<NN>"`, e.g. `content/telc-b1/lesen-1/03.json` →
`"id": "lesen-1-03"`. `"examId": "telc-b1"`. NN is two digits.

---

## 5. Exam part formats

### Lesen Teil 1 – `headline-matching` (part `lesen-1`)

- 5 short press texts (55–110 words each): news items, book/product/event tips, survey results, short
  reports. Write them like real newspaper "Kurzmeldungen".
- 10 headlines (a–j), newspaper style, 3–9 words, often with a colon ("Neu im Kino: …", "Studie: …").
- 5 headlines are correct (one per text, each used once). The other 5 are distractors: each reuses topic words
  of one of the texts but states something the text does **not** say (wrong focus, wrong group, exaggeration,
  opposite). Order headlines so that answers are spread over a–j (never a,b,c,d,e).
- `evidence`: 1–3 exact substrings of the text that prove the answer.
- `distractors`: exactly the 5 unused keys, each with a `why`.

```json
{
  "id": "lesen-1-01", "examId": "telc-b1", "type": "headline-matching",
  "title": "Neues aus Stadt und Land", "topic": "reisen", "difficulty": 2,
  "headlines": [{ "key": "a", "text": "…" }, "… 10 total, keys a–j in order"],
  "texts": [{ "n": 1, "text": "…", "answer": "d", "explanation": "…", "evidence": ["…"] }, "… 5 total"],
  "distractors": [{ "key": "a", "why": "…" }, "… exactly the 5 unused keys"],
  "glossary": [{ "de": "die Ermäßigung", "en": "discount" }]
}
```

### Lesen Teil 2 – `text-mc` (part `lesen-2`)

- One magazine/newspaper article of 350–500 words in 5–8 paragraphs: a portrait, a report on a social project,
  a trend, a local initiative, a career story. Headline + optional lead (1–2 sentences).
- 5 questions in the order of the text. `stem` is usually the start of a sentence ("Frau Berger hat ihr
  Café eröffnet, weil sie …") or a short question; options complete it.
- Options a/b/c, similar length. Distractors reuse words from the text with wrong meaning, wrong person or
  wrong time. Mix answer letters (not all "c").
- `evidence`: an exact substring of the article (one sentence or clause) that proves the answer.

```json
{
  "id": "lesen-2-01", "examId": "telc-b1", "type": "text-mc", "title": "…", "topic": "arbeit", "difficulty": 2,
  "article": { "headline": "…", "lead": "…", "paragraphs": ["…", "…"], "source": "Rheinpfalz am Sonntag" },
  "questions": [{
    "n": 1, "stem": "…",
    "options": [{ "key": "a", "text": "…" }, { "key": "b", "text": "…" }, { "key": "c", "text": "…" }],
    "answer": "b", "explanation": "…", "evidence": "…"
  }],
  "glossary": []
}
```

### Lesen Teil 3 – `ad-matching` (part `lesen-3`)

- 10 situations (one or two sentences, "Sie …" / "Ihre Freundin …"), each describing a concrete need with
  1–2 decisive conditions (price, time, age group, place, indoor/outdoor, delivery, beginners …).
- 12 ads (a–l): classifieds, shop/course/restaurant/event/service ads. `heading` = name or title,
  `subheading` optional slogan, `lines` = 2–6 short lines (offers, times, prices, conditions), `footer` =
  address/phone/web. Ads use typical ad style: short, nominal, abbreviations allowed (Mo.–Fr., inkl., ab 10 €).
- Exactly 1–2 situations have **no** matching ad → `"answer": "x"`. Make those tempting: there is an ad on the
  same topic that fails one condition.
- Each ad matches at most one situation. Include near-miss ads so that every situation needs careful reading.

```json
{
  "id": "lesen-3-01", "examId": "telc-b1", "type": "ad-matching", "title": "…", "topic": "freizeit", "difficulty": 2,
  "situations": [{ "n": 1, "text": "…", "answer": "f", "explanation": "…" }, "… 10 total"],
  "ads": [{ "key": "a", "heading": "…", "subheading": "…", "lines": ["…"], "footer": "…" }, "… 12 total, a–l"],
  "glossary": []
}
```

### Sprachbausteine Teil 1 – `gap-mc` (part `sprachbausteine-1`)

- A personal or semi-formal letter/e-mail of 150–220 words with 10 gaps marked `[[1]]` … `[[10]]` in order.
  Paragraphs separated by a blank line (`\n\n`). Include salutation and closing.
- Each gap tests **grammar**: connectors (weil/denn/deshalb/obwohl/trotzdem/als/wenn/ob/dass), case & article
  endings, adjective endings, prepositions + case, relative pronouns, reflexive pronouns, pronouns (ihm/ihn),
  verb forms (haben/sein in Perfekt, Präteritum, Konjunktiv II, Passiv), comparatives, infinitive with zu,
  zu/um…zu/damit, Possessivartikel, n-Deklination.
- Three options of the same kind (e.g. „dem / den / der“). Exactly one is grammatical in context.
- `grammar`: the matching topic id from the grammar list in section 7 (whenever one fits).

```json
{
  "id": "sprachbausteine-1-01", "examId": "telc-b1", "type": "gap-mc", "title": "…", "topic": "familie",
  "difficulty": 2, "textType": "email-informal",
  "text": "Liebe Karin,\n\nnach meinem Praktikum [[1]] …\n\nLiebe Grüße\nFritz",
  "gaps": [{ "n": 1, "options": [{ "key": "a", "text": "…" }, { "key": "b", "text": "…" }, { "key": "c", "text": "…" }],
             "answer": "a", "explanation": "…", "grammar": "verbindungsadverbien" }],
  "glossary": []
}
```

### Sprachbausteine Teil 2 – `gap-wordbank` (part `sprachbausteine-2`)

- A letter/e-mail (often a reply to an ad – then put the ad in `stimulus`) of 150–220 words with gaps
  `[[1]]`…`[[10]]`.
- 15 words (a–o), written in normal case (the UI shows them in capitals). Mix of prepositions, connectors,
  adverbs, verbs, adjectives, nouns, pronouns. 10 are used once each, 5 are distractors.
- Gaps should be decided by **collocations, fixed prepositions and meaning** (sich interessieren **für**,
  **Bescheid** geben, Ihnen sehr **dankbar** sein, **damit** wir uns entscheiden können). A distractor may fit
  grammatically in one gap but must be wrong in meaning; it must not be a perfect second answer anywhere.

```json
{
  "id": "sprachbausteine-2-01", "examId": "telc-b1", "type": "gap-wordbank", "title": "…", "topic": "reisen",
  "difficulty": 2, "textType": "email-semiformal",
  "stimulus": { "heading": "Hotel-Pension …", "lines": ["…"] },
  "text": "Sehr geehrte Frau …,\n\nich habe Ihre Anzeige gelesen und interessiere mich sehr [[1]] …",
  "words": [{ "key": "a", "text": "besonders" }, "… 15 total, a–o"],
  "gaps": [{ "n": 1, "answer": "h", "explanation": "…" }, "… 10 total, each word key at most once"],
  "glossary": []
}
```

### Hören – general rules for scripts (parts `hoeren-1`, `hoeren-2`, `hoeren-3`)

Scripts are read aloud by text-to-speech with different voices per speaker, so:
- Each `Line` = 1–3 sentences by one speaker. Split long turns into several lines.
- Write the way people **speak**: contractions are fine ("hab", "gibt's", "na ja", "ehrlich gesagt", "also"),
  but **no "äh/ähm"** and **no symbols or abbreviations**: write "Euro", "Prozent", "zum Beispiel", "Straße",
  "Nummer", "und so weiter". Times like "um halb acht", "um 18 Uhr 30"; prices "12 Euro 50"; phone numbers
  digit by digit with spaces ("0 6 9 – 4 4 2 1 7").
- `speakers`: declare every speaker id used in lines, with gender and age – it selects the voice.
- `evidence`: an exact substring of **one** script line.
- Statements are short (8–16 words), clear, in the present or perfect tense.

#### Hören Teil 1 – `audio-short` (part `hoeren-1`), heard ONCE

- `intro`: 1–2 lines by a radio presenter (`mod`) introducing a survey: "Wir haben Menschen auf der Straße
  gefragt: …". All five speakers talk about this one question.
- 5 items; each `script` is one different speaker's statement, 50–90 words, personal and lively.
- The statement tests the speaker's **main opinion or overall situation**, not a tiny detail. Heard only once,
  so avoid traps that depend on a single word. 2–3 true, 2–3 false.

#### Hören Teil 2 – `audio-long` (part `hoeren-2`), heard TWICE

- A radio interview or conversation, 450–750 words, 2–3 speakers (presenter + guest(s)). `context` tells the
  situation in German.
- 10 statements in the order of the recording (validator enforces it), testing details: reasons, numbers,
  who does what, before/after, plans. 4–6 true. False statements must contradict the recording clearly
  (not just "not mentioned" – use a wrong detail).

#### Hören Teil 3 – `audio-short` (part `hoeren-3`), each text heard TWICE

- No intro. 5 unrelated everyday recordings, 40–90 words each: station/airport/train announcements, voicemail
  messages, supermarket or department store announcements, radio traffic/weather, event tips, doctor's
  office phone messages. Set `label` (German, e.g. „Durchsage am Bahnhof“).
- The statement tests one precise detail (time, platform, price, place, what to bring, what to do).
  Include plausible wrong details elsewhere in the text (e.g. two times mentioned). 2–3 true.

### Schreiben – `writing-email` (part `schreiben`)

- `register`: "informal" (friend, family, neighbour you say "du" to) or "semiformal" (landlord, course
  leader, colleague you say "Sie" to, a company after an ad). Aim for about half/half.
- `situation`: German framing sentence, e.g. „Sie haben von Ihrer Freundin Marie folgende E-Mail erhalten:“
  or „Sie haben im Internet folgende Anzeige gelesen:“.
- `stimulus.body`: the received e-mail (60–120 words, with salutation and signature) or the ad/notice.
- `leitpunkte`: exactly 4 points in German, phrased like the exam („Warum Sie nicht kommen können“,
  „Was Sie stattdessen vorschlagen“ …). They must not simply follow the order of the stimulus.
- `model.text`: a model answer of 130–190 words that would score A in all criteria: subject line in
  `model.subject`, salutation, short introduction, all four points in a sensible order and linked with
  varied connectors (außerdem, deshalb, trotzdem, weil, obwohl, damit …), consistent register, sentences that
  do not all start with „Ich“, closing sentence and sign-off. Use "\n" line breaks between paragraphs.
- `modelNotes`: 3–5 English notes explaining why the model works (structure, connectors, register …).
- `phrases`: 5–10 task-specific Redemittel with English.

### Sprechen Teil 1 – `speaking-intro` (part `sprechen-1`)

- `points`: the Stichpunkte on the sheet (Name, Herkunft, Wohnort/Wohnung, Familie, Beruf/Ausbildung,
  Deutsch lernen, Sprachen, Hobbys …). `extraTopics`: what the examiner may add.
- `questions`: for each point, natural questions to ask the partner (du or Sie – give both where useful).
- `speakers`: `A` and `B` (candidates) and optionally `P` (examiner). `model`: a realistic 2–3 minute dialogue
  where both introduce themselves AND ask each other questions, react ("Ach, interessant!"), and follow up.

### Sprechen Teil 2 – `speaking-topic` (part `sprechen-2`)

- `theme`: a debatable everyday topic (Homeoffice, Smartphone für Kinder, Leben auf dem Land, Online-
  Einkaufen …). `medium`: „in einer Zeitschrift“ / „im Internet“ / „in einer Zeitung“.
- `cardA` and `cardB`: two people with **opposite** opinions; quote 35–60 words, first person, natural.
- `ideas.pro` / `ideas.contra`: 4–6 short German arguments each.
- `questions`: 4–6 examiner follow-up questions („Wie ist das in Ihrem Heimatland?“).
- `model`: A reports card A (with reported speech or „Sie/Er meint, dass …“), B reports card B, then both
  discuss, give own opinion and experience, ask each other questions. Optional `P` prompts.
- `phrases`: Redemittel for reporting, opinion, agreeing, disagreeing. `vocabulary`: topic words.

### Sprechen Teil 3 – `speaking-planning` (part `sprechen-3`)

- `situation`: German task text (2–4 sentences) – plan a party, a trip, a visit, a present, an event, help
  for a neighbour, a course excursion …
- `checklist`: 5–7 points („Wann?“, „Wo?“, „Essen und Getränke?“, „Wer kümmert sich um was?“ …).
- `model`: A and B make suggestions, give reasons, accept, object politely, make counter-proposals, distribute
  tasks and summarise the plan at the end. Natural, B1, 2–4 minutes.

---

## 6. Learning content

### Grammar topics – `content/grammar/<id>.json` (schema `GrammarTopic`)

- English explanations (`md`, simple language) with German examples. Use `table` blocks for paradigms,
  `rule` for the one-sentence core rule, `tip` for memory aids, `warning` for typical traps.
- At least 4 blocks: core rule, explanation, table and/or examples, exam tip ("In Sprachbausteine Teil 1 you
  often have to choose between …").
- `mistakes`: 3–5 typical learner errors with corrections.
- `exercises`: 10–14, at least 3 types. `mc` and `gap` prompts contain `___`. `gap.answers` lists every
  accepted spelling. `order.words` are the tokens of `answers[0]` (punctuation attached to its word) in
  scrambled order. Each exercise has an English `explanation`.

### Vocabulary – `content/vocabulary/<id>.json` (schema `VocabTheme`)

- 40–60 high-value B1 words per theme. Nouns: `de` without article, `article`, `plural` (full plural form or
  "–"). Verbs: `forms` = "er/sie/es-Präsens – Präteritum – Perfekt" (e.g. „zieht um – zog um – ist
  umgezogen“). Reflexive verbs: `de` = „sich bewerben“. Example sentences natural and B1.
- `id` unique across all themes: `<themeId>-<word-slug>`.

### Redemittel – `content/phrases/<id>.json` (schema `PhraseBank`)
### Reference lists – `content/lists/<id>.json` (schema `ReferenceList`)
### Strategies – `content/telc-b1/strategies.json` (schema `StrategyFile`)

## 7. Grammar topic ids (use these for `grammar` references and file names)

satzbau-hauptsatz, konnektoren-hauptsatz, nebensaetze-grundlagen, konzessive-saetze, verbindungsadverbien,
temporale-nebensaetze, finale-saetze, kausale-konsekutive-saetze, zweiteilige-konnektoren, indirekte-fragen,
relativsaetze, infinitiv-mit-zu, negation, perfekt, praeteritum, plusquamperfekt, futur-1, modalverben,
konjunktiv-2, passiv, reflexive-verben, verben-mit-praepositionen, trennbare-verben, lassen, imperativ,
verben-mit-dativ, kasus-und-artikel, genitiv, n-deklination, pronomen, adjektivdeklination, komparation,
partizip-als-adjektiv, adjektive-mit-praepositionen, praepositionen-mit-kasus, wechselpraepositionen,
temporale-praepositionen, lokale-praepositionen, wortbildung, nomen-verb-verbindungen
