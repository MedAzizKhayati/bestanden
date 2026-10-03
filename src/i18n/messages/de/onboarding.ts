import type { Messages } from "../en";

export const onboarding: Messages["onboarding"] = {
  welcome: {
    eyebrow: "Willkommen bei Bestanden",
    title: "Dein Weg zum telc-B1-Zertifikat",
    lead: "Übe jeden Teil der Prüfung genau so, wie er geprüft wird, lerne, was dir noch fehlt, und sieh, wie nah du am Bestehen bist.",
    points: [
      { title: "Echtes Prüfungsformat", text: "Alle 12 Teile mit den offiziellen Zeiten – der Timer lässt sich nicht überspringen." },
      { title: "Lernen, was fehlt", text: "B1-Grammatik, über 1 100 Wörter mit Karteikarten, Redemittel und Strategien." },
      { title: "Feedback, das hilft", text: "KI-Korrektur für Schreiben und Sprechen, ein Fehlertrainer und ein Lernplan." },
    ],
    language: "In welcher Sprache möchtest du die Erklärungen?",
    languageHint: "Die Prüfungsaufgaben sind immer auf Deutsch. Du kannst das jederzeit ändern.",
    start: "Los geht’s",
    skip: "Einführung überspringen",
  },
  goal: {
    step: (n, total) => `Schritt ${n} von ${total}`,
    title: "Wann ist deine Prüfung?",
    lead: "Mit dem Datum planen wir deine Wochen. Du kannst es später ändern.",
    noDate: "Weiß ich noch nicht",
    daily: "Wie viel Zeit hast du pro Tag zum Üben?",
    next: "Weiter",
    back: "Zurück",
  },
  level: {
    title: "Wo stehst du?",
    lead: "Die Einstufung dauert 20 Minuten und prüft Grammatik, Wortschatz, Lesen und Hören. Danach siehst du dein Niveau für jede Fertigkeit und wo du am besten anfängst.",
    facts: ["Etwa 20 Minuten", "39 kurze Aufgaben", "Ergebnis pro Fertigkeit"],
    start: "Einstufung starten",
    later: "Später – zeig mir die Übungen",
  },
  firstSteps: {
    title: "Deine ersten Schritte",
    lead: "Fünf Schritte, damit du das Beste aus Bestanden herausholst.",
    progress: (done, total) => `${done} von ${total} erledigt`,
    dismiss: "Ausblenden",
    items: {
      placement: { title: "Mach die Einstufung", text: "Finde dein Niveau in 20 Minuten heraus." },
      exam: { title: "Probier deine erste Prüfungsaufgabe", text: "Zum Beispiel Lesen Teil 1 – mit dem echten Timer." },
      date: { title: "Trag dein Prüfungsdatum ein", text: "Du bekommst einen Lernplan Woche für Woche." },
      words: { title: "Lerne 10 Wörter", text: "Karteikarten mit Wiederholung für den B1-Wortschatz." },
      writing: { title: "Schreib deine erste E-Mail", text: "Schreiben mit Korrektur und Musterlösung." },
    },
  },
};
