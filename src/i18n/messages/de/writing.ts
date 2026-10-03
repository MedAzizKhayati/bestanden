import type { Messages } from "../en";

export const writing: Messages["writing"] = {
  meta: {
    title: "Schreiben – informelle und halbformelle E-Mails mit KI-Korrektur",
    description: "Schreib E-Mails für telc B1 unter Prüfungsbedingungen und lass sie nach den offiziellen Kriterien bewerten.",
    setTitle: (number, title) => `Schreiben ${number} · ${title}`,
  },

  page: {
    minutes: (n) => `${n} Minuten`,
    points: (n) => `${n} Punkte`,
    tasks: "Schreibaufgaben",
    structure: {
      title: "So ist eine E-Mail mit voller Punktzahl aufgebaut",
      text: "Die Prüfenden achten auf die Merkmale der Textsorte und auf das Register. Wenn das stimmt, holst du in Kriterium II die vollen Punkte.",
      part: "Teil",
      informal: "Informell (du)",
      semiformal: "Halbformell (Sie)",
    },
    marking: {
      title: "So wird bewertet",
      text: "A = 5 · B = 3 · C = 1 · D = 0 pro Kriterium, die Summe × 3.",
    },
  },

  register: { informal: "informell · du", semiformal: "halbformell · Sie" },
  emailType: { informal: "Informelle E-Mail", semiformal: "Halbformelle E-Mail" },

  intro: {
    strictTitle: "Strenge Zeitvorgabe",
    strictOn: (min) => `Deine E-Mail wird nach ${min} Minuten automatisch abgegeben.`,
    strictOff: (min) => `Du kannst nach ${min} Minuten weiterschreiben – die zusätzliche Zeit wird gespeichert.`,
    selfTitle: "Selbsteinschätzung",
    selfText:
      "Die KI-Korrektur ist auf diesem Server nicht eingerichtet. Du vergleichst deinen Text mit der Musterlösung und bewertest dich selbst nach den offiziellen Kriterien.",
    aiTitle: "KI-Bewertung",
    aiText: (max) =>
      `Wenn du abgibst, bewertet die KI deine E-Mail nach den offiziellen telc-Kriterien (max. ${max} Punkte) und korrigiert jeden Fehler.`,
    start: "Schreiben starten",
    allTasks: "Alle Aufgaben",
    writtenBefore: (n) => `Du hast diese Aufgabe schon ${n}× geschrieben`,
    bestScore: (points, max) => ` · beste Punktzahl ${points}/${max}`,
  },

  editor: {
    situation: "Situation",
    tickHint: "Hake einen Punkt ab, wenn du darüber geschrieben hast. Wähle eine sinnvolle Reihenfolge – nicht unbedingt diese.",
    backToTasks: "Zurück zu allen Aufgaben",
    subjectPlaceholder: "z. B. Deine Einladung zum Grillfest",
    spellcheckOff: "Die Rechtschreibprüfung ist aus – wie in der Prüfung.",
    liveChecks: "Live-Checks",
    timeUp: "Die Zeit ist um – deine E-Mail wurde abgegeben.",
    confirmTitle: "E-Mail abgeben?",
    confirmText: (words, ticked) => `${words} · ${ticked} von 4 Punkten abgehakt. Danach kannst du nichts mehr ändern.`,
    keepWriting: "Weiterschreiben",
  },

  tools: {
    insertChars: "Sonderzeichen einfügen",
    phrasesHint: "Klicke auf ein Redemittel – es wird an der Cursorposition eingefügt. Passe die Stellen mit „…“ an.",
    phrasesSearch: "Redemittel suchen (z. B. Einladung, Absage, Vorschlag)",
  },

  review: {
    submitted: "Abgegeben",
    durationOf: (used, limit) => `${used} von ${limit}`,
    autoSubmitted: " · bei Zeitende abgegeben",
    writeAgain: "Nochmal schreiben",
    nextTask: "Nächste Aufgabe",
    loadingTitle: "Die KI liest deine E-Mail …",
    loadingText:
      "Sie prüft die vier Leitpunkte, den Aufbau und das Register und markiert jeden Fehler. Das dauert meistens 20–60 Sekunden.",
    aiFailed: "Das KI-Feedback hat nicht geklappt:",
    aiFailedFallback: "Bitte versuche es noch einmal.",
    yourEmail: "Deine E-Mail",
    empty: "(leer)",
    modelAnswer: "Musterlösung",
    selfTitle: "Bewerte dich selbst nach den telc-Kriterien",
    selfTotal: "Selbst bewertet:",
    apiKeyTip: "Tipp: Setze ANTHROPIC_API_KEY auf dem Server, dann bekommst du automatisch eine KI-Bewertung und Korrekturen.",
  },

  feedback: {
    of: (max) => `von ${max}`,
    level: (level) => `Niveau: ${level}`,
    estimate: "KI-Einschätzung",
    criterionHeading: (id) => `Kriterium ${id}`,
    tabs: {
      annotated: (errors) => `Deine E-Mail (${errors})`,
      corrected: "Korrigiert",
      improved: "Verbessert",
      model: "Musterlösung",
    },
    clickHint: "Klicke auf eine unterstrichene Stelle, dann siehst du die Korrektur.",
    noErrors: "Keine Fehler gefunden – ausgezeichnet!",
    correctedHint: "Dein Text – nur die Fehler sind korrigiert.",
    improvedHint: "Deine Ideen auf oberem B1-Niveau – achte auf die Konnektoren und Redemittel.",
    whatWorked: "Das war gut",
    nextTime: "Beim nächsten Mal",
    errorTypes: {
      grammar: "Grammatik",
      "word-order": "Wortstellung",
      spelling: "Rechtschreibung",
      punctuation: "Zeichensetzung",
      vocabulary: "Wortschatz",
      register: "Register",
      style: "Stil",
    },
  },

  checks: {
    subject: { label: "Betreffzeile", missing: "Schreib einen kurzen, konkreten Betreff." },
    salutation: {
      label: "Anrede",
      ok: "Gut – die E-Mail beginnt mit einer Anrede.",
      informal: "Beginne mit „Liebe Anna,“ / „Lieber Tom,“ / „Hallo Max,“.",
      semiformal: "Beginne mit „Sehr geehrte Frau …,“ / „Sehr geehrter Herr …,“.",
    },
    register: {
      informal: "Immer die du-Form",
      semiformal: "Immer die Sie-Form",
      sieInInformal: (forms) => `Du benutzt Höflichkeitsformen (${forms}) – Freunden schreibst du in der du-Form.`,
      informalOk: "Einheitlich – bleib bei du, dich, dir, dein.",
      duInSemiformal: (forms) => `Du benutzt du-Formen (${forms}) – schreib in der Sie-Form: Sie, Ihnen, Ihr.`,
      semiformalOk: "Einheitlich – bleib bei Sie, Ihnen, Ihr.",
    },
    starts: {
      label: "Abwechslungsreiche Satzanfänge",
      tooFew: "Beginne nicht die meisten Sätze mit „Ich“ – dafür gibt es Punktabzug (Kriterium II).",
      count: (ich, total) => `${ich} von ${total} Sätzen ${ich === 1 ? "beginnt" : "beginnen"} mit „Ich/Wir“.`,
      tip: " Beginne einige Sätze mit einer Zeit, einem Ort oder einem Konnektor: „Am Samstag …“, „Leider …“, „Deshalb …“.",
    },
    connectors: {
      label: "Konnektoren",
      used: (n, list) => `${n === 1 ? "1 Konnektor" : `${n} verschiedene`}: ${list}`,
      aim: " – Ziel: 5 oder mehr.",
      none: "Verbinde deine Punkte: weil, deshalb, außerdem, trotzdem, obwohl, damit …",
    },
    length: {
      label: "Länge",
      detail: (words) =>
        `${words === 1 ? "1 Wort" : `${words} Wörter`} · Ziel: etwa 130–180 (es gibt kein offizielles Minimum, aber alle 4 Punkte brauchen Platz).`,
    },
    closing: {
      label: "Schluss und Gruß",
      ok: "Gut – die E-Mail endet mit einem Gruß.",
      informal: "Beende die E-Mail mit einem Schlusssatz und „Viele Grüße / Liebe Grüße, [Name]“.",
      semiformal: "Beende die E-Mail mit „Mit freundlichen Grüßen, [Name]“.",
    },
  },
};
