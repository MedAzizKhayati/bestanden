export const lists = {
  /** /listen */
  index: {
    metaTitle: "Word lists – verbs with prepositions, irregular verbs, connectors",
    metaDescription:
      "The reference lists that decide Sprachbausteine: verbs and adjectives with prepositions, irregular verbs, connectors and noun-verb collocations.",
    title: "Listen",
    description: "Fixed combinations decide many gaps in Sprachbausteine Teil 2. Learn them as chunks – each list has a quick drill.",
  },
  /** /listen/[list] */
  list: {
    metaFallback: "Word list",
    entries: (n: number) => (n === 1 ? "1 entry" : `${n} entries`),
  },
  tabs: { list: (n: number) => `List (${n})`, drill: "Drill" },
  /** Table headers. The German grammar terms stay German in both languages. */
  columns: {
    verbPreposition: "Verb + preposition",
    case: "Case",
    english: "English",
    example: "Example",
    infinitive: "Infinitiv",
    present: "Präsens",
    past: "Präteritum",
    perfect: "Perfekt",
    connector: "Connector",
    wordOrder: "Word order",
    meaning: "Meaning",
    expression: "Expression",
  },
  /** Word order after a connector (table cell and drill option). */
  groups: {
    hauptsatz: "Position 0 – normal word order",
    nebensatz: "Subordinate clause – verb at the end",
    adverb: "Adverb – verb comes right after it",
    zweiteilig: "Two-part connector",
    praeposition: "Preposition – followed by a noun",
  },
  drill: {
    whichWordOrder: "Which word order follows?",
    chooseGerman: "Choose the German expression",
    progress: (n: number, total: number, score: number) => `${n} / ${total} · ${score} correct`,
    newRound: "New round",
    typeForm: "Type the form",
    check: "Check",
  },
};
