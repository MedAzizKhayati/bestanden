export const mistakes = {
  page: {
    metaTitle: "Mistake trainer",
    title: "Mistake trainer",
    description:
      "Your own mistakes are the best material. Every wrong answer is saved as a short review card and comes back until you have it right three times.",
  },
  tabs: {
    review: (due: number) => `Review (${due} due)`,
    all: (open: number) => `All open mistakes (${open})`,
  },
  start: {
    due: (n: number): string => (n === 1 ? "mistake is due." : "mistakes are due."),
    schedule: "Each one comes back after 1, 3, 7 and 16 days until you get it right three times in a row.",
    button: "Start review",
    nothingDue: "Nothing due right now",
    noMistakes: "No mistakes yet",
    scheduled: (open: number, mastered: number) =>
      `${open === 1 ? "1 open mistake is" : `${open} open mistakes are`} scheduled for later. ${mastered} already mastered.`,
    howItWorks: "Wrong answers from every Lesen, Sprachbausteine and Hören exercise land here automatically.",
  },
  session: {
    progress: (current: number, total: number, correct: number) => `${current} / ${total} · ${correct} correct`,
    right: "Richtig!",
    correctIs: (answer: string) => `Correct: ${answer}`,
    done: "Review done. Mistakes you got right move further into the future.",
  },
  list: {
    correct: (answer: string) => `Correct: ${answer}`,
    streak: (n: number) => `streak ${n}/3`,
    dueNow: "due now",
    dueOn: (date: string) => `due ${date}`,
    empty: "No open mistakes.",
  },
};
