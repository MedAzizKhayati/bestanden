import type { Messages } from "../en";

export const lists: Messages["lists"] = {
  index: {
    metaTitle: "Wortlisten – Verben mit Präpositionen, unregelmäßige Verben, Konnektoren",
    metaDescription:
      "Die wichtigsten Listen für die Sprachbausteine: Verben und Adjektive mit Präpositionen, unregelmäßige Verben, Konnektoren und Nomen-Verb-Verbindungen.",
    title: "Listen",
    description:
      "In Sprachbausteine Teil 2 geht es bei vielen Lücken um feste Verbindungen. Lerne sie immer als Ganzes – zu jeder Liste gibt es eine kurze Übung.",
  },
  list: {
    metaFallback: "Wortliste",
    entries: (n) => (n === 1 ? "1 Eintrag" : `${n} Einträge`),
  },
  tabs: { list: (n) => `Liste (${n})`, drill: "Üben" },
  columns: {
    verbPreposition: "Verb + Präposition",
    case: "Kasus",
    english: "Englisch",
    example: "Beispiel",
    infinitive: "Infinitiv",
    present: "Präsens",
    past: "Präteritum",
    perfect: "Perfekt",
    connector: "Konnektor",
    wordOrder: "Wortstellung",
    meaning: "Bedeutung",
    expression: "Ausdruck",
  },
  groups: {
    hauptsatz: "Position 0 – normale Wortstellung",
    nebensatz: "Nebensatz – Verb am Ende",
    adverb: "Adverb – Verb direkt danach",
    zweiteilig: "Zweiteiliger Konnektor",
    praeposition: "Präposition – danach ein Nomen",
  },
  drill: {
    whichWordOrder: "Welche Wortstellung folgt?",
    chooseGerman: "Wähle den deutschen Ausdruck",
    progress: (n, total, score) => `${n} / ${total} · ${score} richtig`,
    newRound: "Neue Runde",
    typeForm: "Form eingeben",
    check: "Prüfen",
  },
};
