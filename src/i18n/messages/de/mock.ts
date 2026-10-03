import type { Messages } from "../en";

export const mock: Messages["mock"] = {
  title: (n) => `Modelltest ${n}`,
  page: {
    metaTitle: "Modelltests – die ganze schriftliche telc-B1-Prüfung",
    metaDescription: "Komplette schriftliche Modelltests für telc B1 mit offiziellen Zeiten und offizieller Bewertung.",
    crumb: "Modelltests",
    title: "Modelltests",
    description:
      "Die ganze schriftliche Prüfung unter echten Bedingungen: 90 Minuten Lesen + Sprachbausteine, ca. 30 Minuten Hören ohne Pause, 30 Minuten Schreiben. Bewertet genau wie bei telc – mit 135 von 225 Punkten hast du bestanden.",
    tip: "Tipp: Mach deinen ersten Modelltest früh, damit du deine schwachen Teile findest. Übe diese Teile und mach im letzten Monat einen Modelltest pro Woche.",
  },
  list: {
    empty: "Modelltests erscheinen, sobald es für jeden Teil genug Übungssätze gibt.",
    best: (points, max) => `Bestwert ${points}/${max}`,
    parts: "Lesen · Sprachbausteine · Hören · Schreiben · ca. 2½ Std.",
    takeAgain: "Nochmal machen",
  },
  intro: {
    text: "Die ganze schriftliche Prüfung – in der echten Reihenfolge und mit den echten Zeiten. Plane ca. 2½ Stunden an einem ruhigen Ort ein.",
    reading: (minutes) => `${minutes} Minuten für fünf Teile – du kannst frei zwischen den Teilen wechseln.`,
    listening: "Drei Teile ohne Pause – Teil 1 hörst du einmal, Teil 2 und 3 zweimal.",
    writing: (minutes) => `${minutes} Minuten für eine E-Mail.`,
    strictOn: "Das strenge Zeitlimit ist an: Jeder Abschnitt endet automatisch, wenn die Zeit um ist – auch wenn du die Seite neu lädst.",
    strictOff: "Das strenge Zeitlimit ist in deinen Einstellungen aus – die Abschnitte enden nicht automatisch. Schalte es für eine echte Prüfungssimulation ein.",
    start: "Schriftliche Prüfung starten",
    taken: (times, best, max) => `${times}× gemacht · Bestwert ${best}/${max}`,
  },
  allMocks: "Alle Modelltests",
  header: {
    abortLabel: "Modelltest abbrechen",
    abortTitle: "Modelltest abbrechen?",
    abortText: "Deine Antworten aus diesem Versuch werden gelöscht.",
    continue: "Prüfung fortsetzen",
    abort: "Abbrechen",
  },
  toasts: {
    readingTimeUp: "Die Zeit für Lesen und Sprachbausteine ist um.",
    writingTimeUp: "Die Zeit ist um – deine E-Mail wurde abgegeben.",
    feedbackFailed: "Die Bewertung deiner E-Mail konnte nicht geladen werden.",
  },
  reading: {
    finish: "Leseteil beenden",
    finishTitle: "Lesen und Sprachbausteine beenden?",
    finishText: (answered, total) =>
      `${answered} von ${total} Aufgaben beantwortet. Danach kannst du nicht mehr zurück – als Nächstes kommt Hören.`,
    keepWorking: "Weiterarbeiten",
    toListening: "Weiter zu Hören",
  },
  listening: {
    header: (teil, total) => `Hörverstehen · Teil ${teil} von ${total}`,
    start: (teil) => `Teil ${teil} starten`,
  },
  writing: {
    words: (n) => (n === 1 ? "1 Wort" : `${n} Wörter`),
    submit: "Abgeben und Prüfung beenden",
    finishTitle: "Schriftliche Prüfung beenden?",
    finishText: (words) => `Deine E-Mail (${words === 1 ? "1 Wort" : `${words} Wörter`}) und alle Antworten werden jetzt bewertet.`,
    keepWriting: "Weiterschreiben",
    finish: "Beenden",
  },
  results: {
    of: (max) => `von ${max}`,
    passed: "Schriftliche Prüfung bestanden",
    failed: "Unter der Bestehensgrenze",
    heading: (points, max) => `${points} / ${max} Punkte`,
    withoutWriting: "(ohne Schreiben)",
    need: (points) => `Du brauchst ${points} Punkte (60 %).`,
    projection: (points, max, grade) =>
      `Wenn die mündliche Prüfung genauso gut läuft, kommst du auf ca. ${points}/${max} Punkte – „${grade}“.`,
    writingPending: "Schreiben wird bewertet, wenn KI-Feedback verfügbar ist. Sonst vergleiche deinen Text mit der Musterlösung unten.",
    partScore: (points, max, correct, total) => `${points}/${max} · ${correct}/${total} richtig`,
    yourEmail: "Deine E-Mail",
    empty: "(leer)",
    model: "Musterlösung",
    reviewMistakes: "Deine Fehler wiederholen",
  },
};
