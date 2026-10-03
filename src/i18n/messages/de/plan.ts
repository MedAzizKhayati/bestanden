import type { Messages } from "../en";

export const plan: Messages["plan"] = {
  page: {
    metaTitle: "Dein Lernplan",
    title: "Lernplan",
    description:
      "Ein Plan Woche für Woche bis zu deinem Prüfungstag. Deine schwächsten Teile kommen zuerst, Modelltests sind für die letzten Wochen geplant, und erledigte Aufgaben werden automatisch abgehakt.",
  },
  examDate: "Prüfungsdatum",
  perDay: "Zeit pro Tag",
  daysLeft: (n) => (n === 1 ? "Tag übrig" : "Tage übrig"),
  weeks: (n) => (n === 1 ? "1 Woche" : `${n} Wochen`),
  pastDate: "Dein Prüfungsdatum liegt in der Vergangenheit.",
  noDate: "Kein Prüfungsdatum gesetzt – hier ist ein Plan für 8 Wochen.",
  week: (n) => `Woche ${n}`,
  thisWeek: "Diese Woche",
  tasks: (n) => (n === 1 ? "1 Aufgabe" : `${n} Aufgaben`),
  done: (n) => `${n} erledigt`,
  builder: {
    phases: {
      foundations: {
        name: "Grundlagen",
        focus: "Wiederhole die wichtigste Grammatik und den Grundwortschatz und lerne alle Teile der Prüfung kennen.",
      },
      training: {
        name: "Prüfungstraining",
        focus: "Übe jeden Teil mit den Prüfungszeiten und konzentriere dich auf deine schwächsten Teile.",
      },
      mocks: {
        name: "Modelltests",
        focus: "Komplette Modelltests unter echten Bedingungen und gezieltes Üben an den letzten Lücken.",
      },
      final: {
        name: "Endspurt",
        focus: "Locker wiederholen, Redemittel, Strategien – und vor der Prüfung gut ausruhen.",
      },
    },
    grammar: (title) => `Grammatik · ${title}`,
    grammarDetail: "Erklärung + Übungen",
    vocab: (title) => `Wortschatz · ${title}`,
    vocabDetail: "Karteikarten + Quiz",
    mockDetail: (minutes) => `schriftliche Prüfung · ${minutes} Min.`,
    review: "Fehlertrainer",
    reviewDetail: "10 Min. an 3 Tagen",
    strategies: "Lies die Strategien für alle Teile",
    strategiesDetail: "und Tipps für den Prüfungstag",
    phrases: "Wiederhole die Redemittel für Schreiben und Sprechen",
    phrasesDetail: "sprich sie laut",
  },
};
