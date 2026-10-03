/**
 * Cross-field consistency checks that a schema alone cannot express.
 * Errors make `content:validate` fail; warnings are printed but tolerated.
 */
import type {
  AdMatchingSet,
  AudioLongSet,
  AudioShortSet,
  ExamSet,
  GapMcSet,
  GapWordbankSet,
  GrammarTopic,
  HeadlineMatchingSet,
  Line,
  PlacementItem,
  PlacementTest,
  Speaker,
  SpeakingIntroSet,
  SpeakingPlanningSet,
  SpeakingTopicSet,
  TextMcSet,
  VocabTheme,
  WritingSet,
} from "./schemas";

export interface Issue {
  level: "error" | "warning";
  message: string;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

class Collector {
  issues: Issue[] = [];
  error(message: string) {
    this.issues.push({ level: "error", message });
  }
  warn(message: string) {
    this.issues.push({ level: "warning", message });
  }
  expect(condition: unknown, message: string) {
    if (!condition) this.error(message);
  }
}

function expectSequence(c: Collector, values: number[], label: string) {
  values.forEach((v, i) => c.expect(v === i + 1, `${label}: expected n=${i + 1} at position ${i + 1}, found ${v}`));
}

function expectKeys(c: Collector, keys: string[], count: number, label: string) {
  const expected = ALPHABET.slice(0, count);
  c.expect(
    keys.join(",") === expected.join(","),
    `${label}: keys must be ${expected[0]}–${expected[count - 1]} in order, found ${keys.join(",")}`,
  );
}

function duplicates<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const dups = new Set<T>();
  for (const v of values) (seen.has(v) ? dups : seen).add(v);
  return [...dups];
}

/** Normalise whitespace and typographic quotes for substring checks. */
export function normalizeForMatch(s: string): string {
  return s
    .replace(/[„“”"]/g, '"')
    .replace(/[‚‘’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function containsQuote(haystack: string, needle: string): boolean {
  return normalizeForMatch(haystack).includes(normalizeForMatch(needle));
}

function checkStraightQuotes(c: Collector, value: unknown, path: string) {
  if (typeof value === "string") {
    if (value.includes('"')) c.warn(`${path}: contains straight double quotes – use German „…“`);
    return;
  }
  if (Array.isArray(value)) value.forEach((v, i) => checkStraightQuotes(c, v, `${path}[${i}]`));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) checkStraightQuotes(c, v, path ? `${path}.${k}` : k);
}

function checkGapMarkers(c: Collector, text: string, count: number) {
  const markers = [...text.matchAll(/\[\[(\d+)\]\]/g)].map((m) => Number(m[1]));
  c.expect(
    markers.join(",") === Array.from({ length: count }, (_, i) => i + 1).join(","),
    `text: gap markers must be [[1]]…[[${count}]] exactly once each and in order, found ${markers.join(",") || "none"}`,
  );
}

function checkSpeakers(c: Collector, speakers: Speaker[], lines: Line[], label: string) {
  const ids = new Set(speakers.map((s) => s.id));
  c.expect(ids.size === speakers.length, `${label}: duplicate speaker ids`);
  lines.forEach((l, i) => c.expect(ids.has(l.s), `${label}[${i}]: unknown speaker "${l.s}"`));
  for (const l of lines) {
    if (/[€%&§]|\bz\. ?B\.|\bca\.|\bStr\.|\bNr\.|\busw\.|\bDr\.|\bbzw\.|\bd\. ?h\.|\bvgl\.|\bu\. ?a\./.test(l.t))
      c.warn(`${label}: "${l.t.slice(0, 40)}…" contains a symbol/abbreviation that text-to-speech reads badly`);
    if (/(?<!\p{L})(äh|ähm|öhm)(?!\p{L})/iu.test(l.t)) c.warn(`${label}: avoid "äh/ähm" – TTS renders them poorly`);
    if (/\d+\.(\s+[A-ZÄÖÜ]|\s*$)/.test(l.t)) c.warn(`${label}: "${l.t.slice(0, 40)}…" – a number before a full stop is often read as an ordinal ("zwölften")`);
  }
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/* ------------------------------------------------------------------ */

function checkHeadlineMatching(c: Collector, s: HeadlineMatchingSet) {
  expectKeys(c, s.headlines.map((h) => h.key), 10, "headlines");
  expectSequence(c, s.texts.map((t) => t.n), "texts");
  const answers = s.texts.map((t) => t.answer);
  const dup = duplicates(answers);
  c.expect(dup.length === 0, `texts: headline(s) ${dup.join(",")} used more than once`);
  const unused = s.headlines.map((h) => h.key).filter((k) => !answers.includes(k));
  const distractorKeys = s.distractors.map((d) => d.key).sort();
  c.expect(
    distractorKeys.join(",") === [...unused].sort().join(","),
    `distractors: must explain exactly the unused headlines ${unused.join(",")}, found ${distractorKeys.join(",")}`,
  );
  s.texts.forEach((t) =>
    t.evidence.forEach((e) =>
      c.expect(containsQuote(t.text, e), `texts[${t.n}].evidence "${e}" is not a substring of the text`),
    ),
  );
  if (answers.join("") === "abcde") c.warn("answers are a,b,c,d,e in order – shuffle the headlines");
  s.texts.forEach((t) => {
    const wc = wordCount(t.text);
    if (wc < 45 || wc > 130) c.warn(`texts[${t.n}]: ${wc} words (aim for 55–110)`);
  });
}

function checkTextMc(c: Collector, s: TextMcSet) {
  expectSequence(c, s.questions.map((q) => q.n), "questions");
  const corpus = [s.article.lead ?? "", ...s.article.paragraphs].join("\n");
  s.questions.forEach((q) => {
    expectKeys(c, q.options.map((o) => o.key), 3, `questions[${q.n}].options`);
    c.expect(duplicates(q.options.map((o) => o.text)).length === 0, `questions[${q.n}]: duplicate option texts`);
    c.expect(containsQuote(corpus, q.evidence), `questions[${q.n}].evidence is not a substring of the article`);
  });
  const positions = s.questions.map((q) => normalizeForMatch(corpus).indexOf(normalizeForMatch(q.evidence)));
  for (let i = 1; i < positions.length; i++)
    if (positions[i] >= 0 && positions[i - 1] >= 0 && positions[i] < positions[i - 1])
      c.warn(`questions should follow the order of the text (question ${i + 1} refers to an earlier passage)`);
  const counts = new Set(s.questions.map((q) => q.answer));
  if (counts.size === 1) c.warn("all answers share the same letter");
  const wc = wordCount(corpus);
  if (wc < 300 || wc > 600) c.warn(`article has ${wc} words (aim for 350–500)`);
}

function checkAdMatching(c: Collector, s: AdMatchingSet) {
  expectKeys(c, s.ads.map((a) => a.key), 12, "ads");
  expectSequence(c, s.situations.map((x) => x.n), "situations");
  const used = s.situations.map((x) => x.answer).filter((a) => a !== "x");
  const dup = duplicates(used);
  c.expect(dup.length === 0, `situations: ad(s) ${dup.join(",")} used more than once`);
  const xCount = s.situations.filter((x) => x.answer === "x").length;
  c.expect(xCount >= 1 && xCount <= 3, `situations: ${xCount} situations marked x (must be 1–3)`);
  if (xCount === 3) c.warn("3 situations without an ad – the real exam usually has 1–2");
}

function checkGapMc(c: Collector, s: GapMcSet) {
  checkGapMarkers(c, s.text, 10);
  expectSequence(c, s.gaps.map((g) => g.n), "gaps");
  s.gaps.forEach((g) => {
    expectKeys(c, g.options.map((o) => o.key), 3, `gaps[${g.n}].options`);
    c.expect(duplicates(g.options.map((o) => o.text)).length === 0, `gaps[${g.n}]: duplicate options`);
  });
  if (new Set(s.gaps.map((g) => g.answer)).size === 1) c.warn("all answers share the same letter");
}

function checkGapWordbank(c: Collector, s: GapWordbankSet) {
  checkGapMarkers(c, s.text, 10);
  expectKeys(c, s.words.map((w) => w.key), 15, "words");
  c.expect(duplicates(s.words.map((w) => w.text.toLowerCase())).length === 0, "words: duplicate words");
  expectSequence(c, s.gaps.map((g) => g.n), "gaps");
  const dup = duplicates(s.gaps.map((g) => g.answer));
  c.expect(dup.length === 0, `gaps: word(s) ${dup.join(",")} used more than once`);
}

function checkAudioShort(c: Collector, s: AudioShortSet, partId: string) {
  expectSequence(c, s.items.map((i) => i.n), "items");
  checkSpeakers(c, s.speakers, [...s.intro, ...s.items.flatMap((i) => i.script)], "script");
  s.items.forEach((i) =>
    c.expect(
      i.script.some((l) => containsQuote(l.t, i.evidence)),
      `items[${i.n}].evidence is not a substring of a single script line`,
    ),
  );
  if (partId === "hoeren-1" && s.intro.length === 0) c.warn("Hören Teil 1 usually starts with a presenter intro");
  const trues = s.items.filter((i) => i.answer).length;
  if (trues === 0 || trues === 5) c.warn(`${trues}/5 statements are true – mix richtig and falsch`);
}

function checkAudioLong(c: Collector, s: AudioLongSet) {
  expectSequence(c, s.statements.map((x) => x.n), "statements");
  checkSpeakers(c, s.speakers, s.script, "script");
  const lineIndex = s.statements.map((st) => s.script.findIndex((l) => containsQuote(l.t, st.evidence)));
  lineIndex.forEach((idx, i) =>
    c.expect(idx >= 0, `statements[${i + 1}].evidence is not a substring of a single script line`),
  );
  for (let i = 1; i < lineIndex.length; i++)
    if (lineIndex[i] >= 0 && lineIndex[i - 1] >= 0 && lineIndex[i] < lineIndex[i - 1])
      c.error(`statements must follow the order of the recording (statement ${i + 1} refers to an earlier line)`);
  const trues = s.statements.filter((x) => x.answer).length;
  if (trues < 3 || trues > 7) c.warn(`${trues}/10 statements are true – aim for 4–6`);
  const wc = wordCount(s.script.map((l) => l.t).join(" "));
  if (wc < 380 || wc > 900) c.warn(`script has ${wc} words (aim for 450–750)`);
}

function checkWriting(c: Collector, s: WritingSet) {
  const text = s.model.text;
  if (!/^(Liebe|Lieber|Hallo|Hi|Sehr geehrte|Guten Tag)/m.test(text)) c.error("model: missing salutation");
  if (!/(Grüße|Gruß|Grüßen|Bis bald|Alles Liebe|Viele Grüße)/.test(text)) c.error("model: missing closing formula");
  const wc = wordCount(text);
  if (wc < 110 || wc > 230) c.warn(`model has ${wc} words (aim for 130–190)`);
  if (s.register === "semiformal" && /\b(du|dich|dir|dein|deine|deinen|deinem|deiner|deines|euch|euer|eure)\b/i.test(text))
    c.warn("model: semi-formal e-mail uses du-forms");
}

function checkSpeakingLines(c: Collector, s: SpeakingIntroSet | SpeakingTopicSet | SpeakingPlanningSet) {
  checkSpeakers(c, s.speakers, s.model, "model");
}

export function checkExamSet(set: ExamSet, partId: string): Issue[] {
  const c = new Collector();
  checkStraightQuotes(c, set, "");
  switch (set.type) {
    case "headline-matching":
      checkHeadlineMatching(c, set);
      break;
    case "text-mc":
      checkTextMc(c, set);
      break;
    case "ad-matching":
      checkAdMatching(c, set);
      break;
    case "gap-mc":
      checkGapMc(c, set);
      break;
    case "gap-wordbank":
      checkGapWordbank(c, set);
      break;
    case "audio-short":
      checkAudioShort(c, set, partId);
      break;
    case "audio-long":
      checkAudioLong(c, set);
      break;
    case "writing-email":
      checkWriting(c, set);
      break;
    case "speaking-intro":
    case "speaking-topic":
    case "speaking-planning":
      checkSpeakingLines(c, set);
      break;
  }
  return c.issues;
}

export function checkGrammarTopic(t: GrammarTopic): Issue[] {
  const c = new Collector();
  checkStraightQuotes(c, t, "");
  t.exercises.forEach((e, i) => {
    if (e.type === "mc") {
      c.expect(e.answer < e.options.length, `exercises[${i}]: answer index out of range`);
      c.expect(e.prompt.includes("___"), `exercises[${i}]: mc prompt must contain ___`);
      c.expect(duplicates(e.options).length === 0, `exercises[${i}]: duplicate options`);
    }
    if (e.type === "gap") c.expect(e.prompt.includes("___"), `exercises[${i}]: gap prompt must contain ___`);
    if (e.type === "order") {
      const tokens = e.words.map((w) => w.toLowerCase()).sort().join(" ");
      e.answers.forEach((answer, j) => {
        const answerTokens = answer.split(/\s+/).map((w) => w.toLowerCase()).sort().join(" ");
        c.expect(tokens === answerTokens, `exercises[${i}].answers[${j}]: cannot be built from the word tiles`);
      });
    }
  });
  t.blocks.forEach((b, i) => {
    if (b.type === "table")
      b.rows.forEach((r, j) =>
        c.expect(r.length === b.columns.length, `blocks[${i}].rows[${j}]: ${r.length} cells for ${b.columns.length} columns`),
      );
  });
  const types = new Set(t.exercises.map((e) => e.type));
  if (types.size < 3) c.warn("use at least three exercise types");
  return c.issues;
}

export function checkVocabTheme(t: VocabTheme): Issue[] {
  const c = new Collector();
  checkStraightQuotes(c, t, "");
  c.expect(duplicates(t.words.map((w) => w.id)).length === 0, "duplicate word ids");
  c.expect(duplicates(t.words.map((w) => `${w.article ?? ""} ${w.de}`)).length === 0, "duplicate words");
  t.words.forEach((w) => {
    if (w.pos === "noun") {
      c.expect(w.article, `${w.id}: nouns need an article`);
      c.expect(w.plural, `${w.id}: nouns need a plural (use "–" if none)`);
      c.expect(/^[A-ZÄÖÜ]/.test(w.de), `${w.id}: nouns are capitalised`);
    }
    if (w.pos === "verb" && !w.forms) c.warn(`${w.id}: verbs should list forms`);
    if (w.article && /^(der|die|das) /.test(w.de)) c.error(`${w.id}: "de" must not include the article`);
  });
  return c.issues;
}

/** Generic typography check for phrase banks, lists and strategies. */
export function checkTypography(value: unknown): Issue[] {
  const c = new Collector();
  checkStraightQuotes(c, value, "");
  return c.issues;
}

/** Placement test: unique ids, valid answers, levels spread, clean TTS scripts, known grammar topics. */
export function checkPlacementTest(test: PlacementTest, grammarIds: Set<string>): Issue[] {
  const c = new Collector();
  checkStraightQuotes(c, test, "");
  const skills = test.sections.map((s) => s.skill);
  c.expect(new Set(skills).size === 4, `sections must be grammatik, wortschatz, lesen and hoeren once each, found ${skills.join(", ")}`);

  const all: { item: PlacementItem; where: string }[] = [];
  for (const section of test.sections) {
    if (section.skill === "grammatik" || section.skill === "wortschatz")
      section.items.forEach((item, i) => all.push({ item, where: `${section.skill}[${i}]` }));
    else if (section.skill === "lesen")
      section.texts.forEach((t) => t.items.forEach((item, i) => all.push({ item, where: `lesen.${t.id}[${i}]` })));
    else
      section.recordings.forEach((r) => {
        checkSpeakers(c, r.speakers, r.script, `hoeren.${r.id}`);
        r.items.forEach((item, i) => all.push({ item, where: `hoeren.${r.id}[${i}]` }));
      });
  }
  c.expect(duplicates(all.map((x) => x.item.id)).length === 0, `duplicate item ids: ${duplicates(all.map((x) => x.item.id)).join(", ")}`);
  for (const { item, where } of all) {
    if (item.type === "mc") {
      c.expect(item.answer < item.options.length, `${where}: answer index out of range`);
      c.expect(duplicates(item.options).length === 0, `${where}: duplicate options`);
      if (item.grammar && grammarIds.size) c.expect(grammarIds.has(item.grammar), `${where}: unknown grammar topic "${item.grammar}"`);
    }
  }
  for (const section of test.sections) {
    if (section.skill === "lesen")
      section.texts.forEach((t) =>
        t.items.forEach((item, i) => {
          if (item.type === "mc" && item.prompt.includes("___")) c.warn(`lesen.${t.id}[${i}]: reading questions are stems, not gaps – remove "___"`);
        }),
      );
    if (section.skill === "grammatik" || section.skill === "wortschatz") {
      section.items.forEach((item, i) => c.expect(item.prompt.includes("___"), `${section.skill}[${i}]: prompt needs a "___" gap`));
      for (const level of ["A2", "B1", "B2"] as const)
        c.expect(section.items.some((i) => i.level === level), `${section.skill}: needs at least one ${level} item`);
    }
  }
  const answersByLevel = all.filter((x) => x.item.type === "mc").map((x) => (x.item as { answer: number }).answer);
  if (answersByLevel.length >= 8 && new Set(answersByLevel).size < 3) c.warn("mc answers are not spread over the options");
  return c.issues;
}
