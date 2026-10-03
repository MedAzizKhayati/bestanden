import type { Messages } from "../en";

export const grammar: Messages["grammar"] = {
  topics: (n) => (n === 1 ? "1 Thema" : `${n} Themen`),
  drills: (n) => (n === 1 ? "1 Übung" : `${n} Übungen`),
  index: {
    metaTitle: "Grammatik für telc B1",
    metaDescription:
      "Alle Grammatikthemen, die du für telc B1 brauchst – mit Erklärungen, Tabellen, typischen Fehlern und interaktiven Übungen.",
    title: "Grammatik",
    description:
      "Alles, was in den Sprachbausteinen geprüft wird – und was dir beim Schreiben und Sprechen mehr Punkte bringt. Kurze, einfache Erklärungen, echte deutsche Beispiele, typische Fallen und Übungen, die sich selbst korrigieren.",
    masteredOf: (total) => `von ${total} Themen gemeistert (≥ 80 % der Übungen)`,
    levelA2: "A2-Auffrischung",
    levelB1: "B1-Kernthemen",
  },
  topic: {
    metaFallback: "Grammatik",
    mistakesTitle: "Typische Fehler",
    practiceTitle: "Üben",
    practiceIntro: "Prüfe jede Antwort direkt – deine Ergebnisse werden in deinem Fortschritt gespeichert.",
    related: "Verwandte Themen",
    nextTopic: "Nächstes Thema",
  },
  blocks: {
    tip: "Prüfungstipp",
    warning: "Achtung",
  },
  practice: {
    types: { mc: "Auswählen", gap: "Ergänzen", order: "Satz bauen", transform: "Umformen" },
    correctThisRound: "richtig in dieser Runde",
    exercises: (n) => (n === 1 ? "1 Übung" : `${n} Übungen`),
    overall: (correct, total) => `Gesamtstand: ${correct}/${total}`,
    startOver: "Neu starten",
    richtig: "Richtig!",
    resultTitle: (correct, total) => `${correct} von ${total} richtig`,
    mastered: "Thema gemeistert – wiederhole es in ein paar Tagen noch einmal.",
    tryAgain: "Lies die Erklärungen zu deinen Fehlern und versuch es noch einmal.",
    answerPlaceholder: "Deine Antwort",
    sentencePlaceholder: "Schreib den neuen Satz",
    check: "Prüfen",
    tapWords: "Tippe die Wörter in der richtigen Reihenfolge an …",
    clear: "Löschen",
  },
};
