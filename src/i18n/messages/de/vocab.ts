import type { Messages } from "../en";

export const vocab: Messages["vocab"] = {
  direction: { deEn: "Deutsch → Englisch", enDe: "Englisch → Deutsch" },
  plural: (plural) => `Plural: die ${plural}`,
  noPlural: "kein Plural",
  index: {
    metaTitle: "B1-Wortschatz – Themen, Karteikarten und der/die/das",
    metaDescription:
      "Die B1-Wörter, die du für telc brauchst, nach Themen geordnet – mit Aussprache, Beispielsätzen und Karteikarten, die du in klugen Abständen wiederholst.",
    title: "Wortschatz",
    description:
      "Die Wörter, die bei telc B1 in Texten, Hörtexten und Aufgaben immer wieder vorkommen. Jedes Nomen mit Artikel und Plural, jedes Verb mit seinen Formen – dazu ein Beispielsatz und die Aussprache.",
    themes: (n) => (n === 1 ? "1 Thema" : `${n} Themen`),
    masculine: "maskulin",
    feminine: "feminin",
    neuter: "neutral",
    statWords: "Wörter",
    statInDeck: "In deinen Karteikarten",
    statMature: "Gut gelernt (21+ Tage)",
    statDue: "fällige Karten",
    reviewNow: "Wiederholen",
  },
  theme: {
    metaTitle: (title) => `Wortschatz: ${title}`,
    metaFallback: "Wortschatz",
    tabs: { words: "Wörter", cards: "Karteikarten", quiz: "Quiz", article: "der/die/das" },
    inDeck: (n, total) => `${n}/${total} in deinen Karteikarten`,
    addAll: "Alle hinzufügen",
    added: (n) => (n === 1 ? "1 Wort zu deinen Karteikarten hinzugefügt" : `${n} Wörter zu deinen Karteikarten hinzugefügt`),
    searchPlaceholder: "Auf Deutsch oder Englisch suchen",
    pluralShort: "Pl.",
    addCard: "Zu den Karteikarten hinzufügen",
    removeCard: "Aus den Karteikarten entfernen",
    noMatch: "Keine passenden Wörter.",
  },
  review: {
    metaTitle: "Karteikarten wiederholen",
    crumb: "Wiederholen",
    title: "Wiederholen",
    description:
      "Deine fälligen Karteikarten aus allen Themen. Bewerte dich ehrlich – dann zeigt dir das System jedes Wort wieder, kurz bevor du es vergessen würdest.",
    emptyTitle: "Dein Kartenstapel ist leer",
    emptyText: "Öffne ein Thema und füge Wörter hinzu – oder starte dort direkt eine Runde mit Karteikarten.",
    chooseTheme: "Thema wählen",
  },
  flashcards: {
    grades: { again: "Nochmal", hard: "Schwer", good: "Gut", easy: "Leicht" },
    interval: {
      minutes: (n) => `${n} Min.`,
      days: (n) => (n === 1 ? "1 Tag" : `${n} Tage`),
      months: (n) => (n === 1 ? "1 Monat" : `${n} Monate`),
    },
    complete: "Runde geschafft!",
    nothingDue: "Im Moment gibt es nichts zu wiederholen",
    reviewed: (n) =>
      `Du hast ${n === 1 ? "1 Karte" : `${n} Karten`} wiederholt. Komm morgen wieder – am besten wiederholst du jeden Tag ein bisschen.`,
    allScheduled: "Alle Karten hier sind erst später wieder dran.",
    newSession: "Neue Runde",
    progress: (n, total) => `Karte ${n} von ${total}`,
    newBadge: "neu",
    reveal: "Zum Aufdecken tippen oder Leertaste drücken",
    showAnswer: "Antwort zeigen",
  },
  quiz: {
    great: "Sehr gut – diese Wörter sitzen.",
    addMissed: "Nimm die Wörter, die du nicht wusstest, in deine Karteikarten auf.",
    newQuiz: "Neues Quiz",
    progress: (n, total, score) => `Frage ${n} von ${total} · ${score} richtig`,
  },
  articles: {
    noNouns: "In diesem Thema gibt es keine Nomen.",
    progress: (score, n, total) => `${score} richtig · ${n}/${total}`,
    best: (n) => `(Rekord: ${n})`,
    key: (n) => `Taste ${n}`,
    nextWord: "Nächstes Wort",
  },
};
