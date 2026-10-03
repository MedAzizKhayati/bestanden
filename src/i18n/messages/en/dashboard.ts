export const dashboard = {
  examDay: "Exam day – viel Erfolg!",
  daysUntilExam: (n: number) => (n === 1 ? "1 day until your exam" : `${n} days until your exam`),
  setExamDate: "Set your exam date",
  hero: {
    titleNew: "Pass telc B1 – with a plan.",
    titleStreak: (day: number) => `Day ${day} – weiter so!`,
    titleBack: "Willkommen zurück!",
    introNew: (sets: number) =>
      `${sets} original exam sets with real timing, listening with audio, AI feedback on your writing and speaking, and every B1 grammar topic.`,
    introBack: "Here is the most useful thing to do next.",
  },
  next: {
    resume: "Unfinished – your timer is still running",
    startHere: "Start here",
    weakest: "Recommended: your weakest part",
  },
  mockExam: "Mock exam",
  today: {
    title: "Today",
    goalReached: "Daily goal reached – great work!",
    autoCount: "Practice time counts automatically.",
    mistakesDue: (n: number): string => (n === 1 ? "mistake to review" : "mistakes to review"),
    wordsDue: (n: number): string => (n === 1 ? "word due" : "words due"),
  },
  practice: {
    title: "Exam practice",
    structure: "Structure & scoring →",
  },
  learn: {
    title: "Learn & revise",
    grammar: (topics: number) => `${topics} topics with drills – every point Sprachbausteine tests.`,
    vocab: (words: number, inCards: number) => `${words} B1 words · ${inCards} in your flashcards.`,
    phrasesTitle: "Redemittel",
    phrases: (n: number) => `${n} phrases for Schreiben and Sprechen.`,
    strategies: "How to approach every part – and the traps to avoid.",
  },
  level: "Your level",
};
