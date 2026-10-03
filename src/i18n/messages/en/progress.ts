export const progress = {
  page: {
    metaTitle: "Your progress",
    title: "Progress",
    description: "Where you stand in every part of the exam – and whether you finish within the time limits.",
  },
  tiles: {
    totalTime: "total practice time",
    exercises: "exercises completed",
    streakDays: (n: number) => (n === 1 ? "1 day" : `${n} days`),
    streak: "current streak",
    words: "words in flashcards",
  },
  chart: {
    title: "Last 4 weeks",
    today: "today",
  },
  byPart: {
    title: "By exam part",
    hint: "Average of your last five attempts. The line marks the 60% pass level.",
    attempts: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
    onTime: (percent: string) => `${percent} on time`,
  },
  recent: {
    title: "Recent exercises",
    empty: "No exercises yet.",
  },
  productive: {
    title: "Writing & speaking",
    empty: "No writing or speaking practice yet.",
  },
};
