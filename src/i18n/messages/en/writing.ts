export const writing = {
  meta: {
    title: "Schreiben – informal and semi-formal e-mails with AI correction",
    description: "Write telc B1 e-mails under exam conditions and get scored with the official criteria.",
    setTitle: (number: string, title: string) => `Schreiben ${number} · ${title}`,
  },

  /** Section page /[exam]/schreiben. */
  page: {
    minutes: (n: number) => `${n} minutes`,
    points: (n: number) => `${n} points`,
    tasks: "Writing tasks",
    structure: {
      title: "The structure of a top-scoring e-mail",
      text: "Raters check text-type features and register – get these right and criterion II is yours.",
      part: "Part",
      informal: "Informal (du)",
      semiformal: "Semi-formal (Sie)",
    },
    marking: {
      title: "How it is marked",
      text: "A = 5 · B = 3 · C = 1 · D = 0 per criterion, the sum × 3.",
    },
  },

  register: { informal: "informal · du", semiformal: "semi-formal · Sie" },
  emailType: { informal: "Informal e-mail", semiformal: "Semi-formal e-mail" },

  intro: {
    strictTitle: "Strict exam timing",
    strictOn: (min: number) => `Your e-mail is submitted automatically after ${min} minutes.`,
    strictOff: (min: number) => `You can keep writing after ${min} minutes – overtime is recorded.`,
    selfTitle: "Self-assessment",
    selfText:
      "AI correction is not configured on this server – you will compare with the model answer and rate yourself with the official criteria.",
    aiTitle: "AI examiner feedback",
    aiText: (max: number) =>
      `After submitting, an AI examiner scores your e-mail with the official telc criteria (max. ${max} points) and corrects every mistake.`,
    start: "Start writing",
    allTasks: "All tasks",
    writtenBefore: (n: number) => `You wrote this task ${n}× before`,
    bestScore: (points: number, max: number) => ` · best score ${points}/${max}`,
  },

  editor: {
    situation: "Situation",
    tickHint: "Tick a point once you have written about it. Choose a sensible order – not necessarily this one.",
    backToTasks: "Back to all tasks",
    subjectPlaceholder: "e.g. Deine Einladung zum Grillfest",
    spellcheckOff: "Spell-check is off, like in the exam.",
    liveChecks: "Live checks",
    timeUp: "Time is up – your e-mail was submitted.",
    confirmTitle: "Submit your e-mail?",
    confirmText: (words: string, ticked: number) => `${words} · ${ticked} of 4 points ticked. You can't edit it afterwards.`,
    keepWriting: "Keep writing",
  },

  /** Umlaut bar and Redemittel sheet. */
  tools: {
    insertChars: "Insert special characters",
    phrasesHint: "Click a phrase to insert it at your cursor. Adapt the „…“ parts.",
    phrasesSearch: "Search phrases (e.g. Einladung, sorry, Vorschlag)",
  },

  review: {
    submitted: "Submitted",
    durationOf: (used: string, limit: string) => `${used} of ${limit}`,
    autoSubmitted: " · submitted at time-up",
    writeAgain: "Write again",
    nextTask: "Next task",
    loadingTitle: "The examiner is reading your e-mail…",
    loadingText: "Checking the four Leitpunkte, structure and register, and marking every mistake. This usually takes 20–60 seconds.",
    aiFailed: "AI feedback failed:",
    /** Shown when the server sent no error message (e.g. no connection). */
    aiFailedFallback: "Please try again.",
    yourEmail: "Your e-mail",
    empty: "(empty)",
    modelAnswer: "Model answer",
    selfTitle: "Rate yourself like a telc examiner",
    selfTotal: "Self-assessed:",
    apiKeyTip: "Tip: set ANTHROPIC_API_KEY on the server to get automatic AI scoring and corrections.",
  },

  feedback: {
    of: (max: number) => `of ${max}`,
    level: (level: string) => `Level: ${level}`,
    estimate: "AI examiner estimate",
    /** Criterion heading; the German UI shows no English criterion name. */
    criterionHeading: (id: string, nameEn: string) => `${id}. ${nameEn}`,
    tabs: {
      annotated: (errors: number) => `Your e-mail (${errors})`,
      corrected: "Corrected",
      improved: "Improved",
      model: "Model answer",
    },
    clickHint: "Click an underlined passage to see the correction.",
    noErrors: "No errors found – excellent!",
    correctedHint: "Your text with only the mistakes fixed.",
    improvedHint: "Your ideas at upper-B1 level – study the connectors and phrases.",
    whatWorked: "What worked",
    nextTime: "Next time",
    /** Error categories reported by the AI. */
    errorTypes: {
      grammar: "grammar",
      "word-order": "word order",
      spelling: "spelling",
      punctuation: "punctuation",
      vocabulary: "vocabulary",
      register: "register",
      style: "style",
    },
  },

  /** Live checks while writing (src/lib/writing/checks.ts). */
  checks: {
    subject: { label: "Subject line", missing: "Add a short, specific Betreff." },
    salutation: {
      label: "Salutation",
      ok: "Good – the e-mail opens with a salutation.",
      informal: "Start with „Liebe Anna,“ / „Lieber Tom,“ / „Hallo Max,“.",
      semiformal: "Start with „Sehr geehrte Frau …,“ / „Sehr geehrter Herr …,“.",
    },
    register: {
      informal: "du-form throughout",
      semiformal: "Sie-form throughout",
      sieInInformal: (forms: string) => `You use polite forms (${forms}) – write to a friend with du.`,
      informalOk: "Consistent – keep using du, dich, dir, dein.",
      duInSemiformal: (forms: string) => `You use du-forms (${forms}) – use Sie, Ihnen, Ihr.`,
      semiformalOk: "Consistent – keep using Sie, Ihnen, Ihr.",
    },
    starts: {
      label: "Varied sentence starts",
      tooFew: "Avoid starting most sentences with „Ich“ – raters penalise this (criterion II).",
      count: (ich: number, total: number) => `${ich} of ${total} sentences start with „Ich/Wir“.`,
      tip: " Start some with a time, place or connector: „Am Samstag …“, „Leider …“, „Deshalb …“.",
    },
    connectors: {
      label: "Linking words",
      used: (n: number, list: string) => `${n} different: ${list}`,
      aim: " – aim for 5+.",
      none: "Link your points: weil, deshalb, außerdem, trotzdem, obwohl, damit …",
    },
    length: {
      label: "Length",
      detail: (words: number) =>
        `${words} ${words === 1 ? "word" : "words"} · aim for about 130–180 (no official minimum, but all 4 points need space).`,
    },
    closing: {
      label: "Closing & sign-off",
      ok: "Good – the e-mail ends with a greeting.",
      informal: "End with a closing sentence and „Viele Grüße / Liebe Grüße, [Name]“.",
      semiformal: "End with „Mit freundlichen Grüßen, [Name]“.",
    },
  },
};
