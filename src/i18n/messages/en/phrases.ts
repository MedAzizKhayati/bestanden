export const phrases = {
  /** /redemittel */
  metaTitle: "Redemittel for Schreiben and Sprechen",
  metaDescription: "Ready-to-use German phrases for telc B1 e-mails and the oral exam – organised by exam part and function.",
  title: "Phrases (Redemittel)",
  description:
    "Examiners reward varied, appropriate phrases (criterion II in Schreiben, Ausdrucksfähigkeit in Sprechen). Learn a few per function and use them in every practice task.",
  count: (n: number) => (n === 1 ? "1 phrase" : `${n} phrases`),
  searchPlaceholder: "Search all phrases – e.g. „Vorschlag“, apologise, opinion",
  /** Badge per phrase group; neutral groups get none. */
  register: { informal: "du / informal", formal: "Sie / semi-formal", neutral: "" },
  copyPhrase: "Copy phrase",
};
