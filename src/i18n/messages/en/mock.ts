export const mock = {
  /** Name of one mock exam ("Modelltest 3"). */
  title: (n: number) => `Modelltest ${n}`,
  page: {
    metaTitle: "Mock exams – the full written telc B1 exam",
    metaDescription: "Complete written telc B1 mock exams with the official timing and scoring.",
    crumb: "Mock exams",
    title: "Modelltests",
    description:
      "The complete written exam under real conditions: 90 minutes Lesen + Sprachbausteine, about 30 minutes Hören without pause, 30 minutes Schreiben. Scored exactly like telc – 135 of 225 points to pass.",
    tip: "Tip: take your first mock exam early to find your weak parts, practise those, and take one mock exam a week in the last month.",
  },
  list: {
    empty: "Mock exams will appear once every part has enough sets.",
    best: (points: number, max: number) => `Best ${points}/${max}`,
    parts: "Lesen · Sprachbausteine · Hören · Schreiben · ~2½ h",
    takeAgain: "Take again",
  },
  intro: {
    text: "The complete written exam, in the real order and with the real time limits. Plan about 2½ hours in a quiet place.",
    reading: (minutes: number) => `${minutes} minutes for five parts – move freely between them.`,
    listening: "Three parts, played without pause – Teil 1 once, Teil 2 and 3 twice.",
    writing: (minutes: number) => `${minutes} minutes for one e-mail.`,
    strictOn: "Strict timing is on: each section ends automatically when its time is up – even if you reload the page.",
    strictOff: "Strict timing is off in your settings – sections will not end automatically. Turn it on for a realistic simulation.",
    start: "Start the written exam",
    taken: (times: number, best: string, max: number) => `Taken ${times}× · best ${best}/${max}`,
  },
  allMocks: "All mock exams",
  header: {
    abortLabel: "Abort mock exam",
    abortTitle: "Abort this mock exam?",
    abortText: "Your answers in this attempt will be discarded.",
    continue: "Continue the exam",
    abort: "Abort",
  },
  toasts: {
    readingTimeUp: "Time is up for Lesen and Sprachbausteine.",
    writingTimeUp: "Time is up – your e-mail was submitted.",
    feedbackFailed: "Could not get the writing assessment.",
  },
  reading: {
    finish: "Finish reading section",
    finishTitle: "Finish Lesen and Sprachbausteine?",
    finishText: (answered: number, total: number) =>
      `${answered} of ${total} items answered. You can't come back to this section – the listening section starts next.`,
    keepWorking: "Keep working",
    toListening: "Continue to Hören",
  },
  listening: {
    header: (teil: number, total: number) => `Hörverstehen · Teil ${teil} von ${total}`,
    start: (teil: number) => `Start Teil ${teil}`,
  },
  writing: {
    words: (n: number) => (n === 1 ? "1 word" : `${n} words`),
    submit: "Submit and finish the exam",
    finishTitle: "Finish the written exam?",
    finishText: (words: number) => `Your e-mail (${words === 1 ? "1 word" : `${words} words`}) and all answers will be scored.`,
    keepWriting: "Keep writing",
    finish: "Finish",
  },
  results: {
    of: (max: number) => `of ${max}`,
    passed: "Written exam passed",
    failed: "Below the pass mark",
    heading: (points: string, max: number) => `${points} / ${max} points`,
    withoutWriting: "(without Schreiben)",
    need: (points: number) => `You need ${points} points (60%).`,
    projection: (points: number, max: number, grade: string) =>
      `With an equally good oral exam you would get about ${points}/${max} – „${grade}“.`,
    writingPending: "Schreiben is scored when AI feedback is available, otherwise compare with the model answer below.",
    partScore: (points: string, max: number, correct: number, total: number) => `${points}/${max} · ${correct}/${total} correct`,
    yourEmail: "Your e-mail",
    empty: "(empty)",
    model: "Model answer",
    reviewMistakes: "Review your mistakes",
  },
};
