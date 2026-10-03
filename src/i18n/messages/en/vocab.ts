export const vocab = {
  direction: { deEn: "German → English", enDe: "English → German" },
  plural: (plural: string) => `Plural: die ${plural}`,
  noPlural: "no plural",
  /** /wortschatz */
  index: {
    metaTitle: "B1 vocabulary – themes, flashcards and der/die/das",
    metaDescription: "The B1 words you need for telc, by topic – with pronunciation, examples and spaced-repetition flashcards.",
    title: "Vocabulary",
    description:
      "The words that come up again and again in telc B1 texts, recordings and tasks. Every noun with its article and plural, every verb with its forms, an example sentence and pronunciation.",
    themes: (n: number) => (n === 1 ? "1 theme" : `${n} themes`),
    masculine: "masculine",
    feminine: "feminine",
    neuter: "neuter",
    statWords: "Words",
    statInDeck: "In your flashcards",
    statMature: "Well known (21+ days)",
    statDue: "due for review",
    reviewNow: "Review now",
  },
  /** /wortschatz/[theme] */
  theme: {
    metaTitle: (title: string) => `Wortschatz: ${title}`,
    metaFallback: "Wortschatz",
    tabs: { words: "Words", cards: "Flashcards", quiz: "Quiz", article: "der/die/das" },
    inDeck: (n: number, total: number) => `${n}/${total} in your flashcards`,
    addAll: "Add all",
    added: (n: number) => (n === 1 ? "1 word added to your flashcards" : `${n} words added to your flashcards`),
    searchPlaceholder: "Search German or English",
    pluralShort: "Pl.",
    addCard: "Add to flashcards",
    removeCard: "Remove from flashcards",
    noMatch: "No words match.",
  },
  /** /wortschatz/wiederholen */
  review: {
    metaTitle: "Review your flashcards",
    crumb: "Review",
    title: "Wiederholen",
    description:
      "Your due flashcards from all themes. Grade honestly – spaced repetition shows each word again just before you would forget it.",
    emptyTitle: "Your flashcard deck is empty",
    emptyText: "Open a theme and add words – or start a flashcard session there.",
    chooseTheme: "Choose a theme",
  },
  /** Spaced-repetition flashcards. */
  flashcards: {
    grades: { again: "Again", hard: "Hard", good: "Good", easy: "Easy" },
    /** Next interval shown on the grade buttons. */
    interval: {
      minutes: (n: number) => `${n} min`,
      days: (n: number) => `${n} d`,
      months: (n: number) => `${n} mo`,
    },
    complete: "Session complete!",
    nothingDue: "Nothing to review right now",
    reviewed: (n: number) =>
      `You reviewed ${n === 1 ? "1 card" : `${n} cards`}. Come back tomorrow – spaced repetition works best a little every day.`,
    allScheduled: "All cards in this set are scheduled for later.",
    newSession: "New session",
    progress: (n: number, total: number) => `Card ${n} of ${total}`,
    newBadge: "new",
    reveal: "Tap or press space to reveal",
    showAnswer: "Show answer",
  },
  /** Multiple-choice meaning quiz. */
  quiz: {
    great: "Excellent – these words are sticking.",
    addMissed: "Add the words you missed to your flashcards.",
    newQuiz: "New quiz",
    progress: (n: number, total: number, score: number) => `Question ${n} of ${total} · ${score} correct`,
  },
  /** der/die/das trainer. */
  articles: {
    noNouns: "No nouns in this set.",
    progress: (score: number, n: number, total: number) => `${score} correct · ${n}/${total}`,
    best: (n: number) => `(best ${n})`,
    key: (n: number) => `key ${n}`,
    nextWord: "Next word",
  },
};
