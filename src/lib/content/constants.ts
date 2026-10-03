/** Plain constants shared by server and client (no zod – keeps client bundles small). */

/** Thematic tags taken from the telc / Zertifikat Deutsch topic catalogue. */
export const TOPICS = {
  arbeit: "Arbeit & Beruf",
  wohnen: "Wohnen",
  gesundheit: "Gesundheit",
  reisen: "Reisen & Verkehr",
  freizeit: "Freizeit & Hobbys",
  einkaufen: "Einkaufen & Konsum",
  essen: "Essen & Trinken",
  familie: "Familie & Beziehungen",
  bildung: "Schule & Bildung",
  medien: "Medien & Kommunikation",
  umwelt: "Umwelt & Natur",
  behoerden: "Ämter & Dienstleistungen",
  kultur: "Kultur & Feste",
  sport: "Sport",
  technik: "Technik & Alltag",
  gesellschaft: "Gesellschaft & Zusammenleben",
} as const;
export type TopicKey = keyof typeof TOPICS;

export const GRAMMAR_CATEGORIES = {
  satzbau: "Satzbau & Konnektoren",
  verben: "Verben & Zeiten",
  nomen: "Nomen, Artikel & Pronomen",
  adjektive: "Adjektive",
  praepositionen: "Präpositionen",
  wortschatz: "Wortbildung & Wendungen",
} as const;
export type GrammarCategoryKey = keyof typeof GRAMMAR_CATEGORIES;
