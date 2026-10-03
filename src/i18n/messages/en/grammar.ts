export const grammar = {
  topics: (n: number) => (n === 1 ? "1 topic" : `${n} topics`),
  drills: (n: number) => (n === 1 ? "1 drill" : `${n} drills`),
  /** /grammatik */
  index: {
    metaTitle: "Grammar for telc B1",
    metaDescription: "Every grammar topic you need for telc B1 – explanations, tables, typical mistakes and interactive drills.",
    title: "Grammatik",
    description:
      "Everything Sprachbausteine tests – and what makes your Schreiben and Sprechen score higher. Short explanations in English, real German examples, typical traps and drills that check themselves.",
    /** Follows the bold number of mastered topics: "**3** of 40 topics mastered …". */
    masteredOf: (total: number) => `of ${total} topics mastered (≥ 80% of the drills)`,
    levelA2: "A2 refresher",
    levelB1: "B1 core",
  },
  /** /grammatik/[topic] */
  topic: {
    metaFallback: "Grammar",
    mistakesTitle: "Typical mistakes",
    practiceTitle: "Üben",
    practiceIntro: "Check each answer as you go – your results are saved to your progress.",
    related: "Related topics",
    nextTopic: "Next topic",
  },
  /** Explanation blocks. */
  blocks: {
    tip: "Exam tip",
    warning: "Watch out",
  },
  /** Self-checking drills under each topic. */
  practice: {
    types: { mc: "Choose", gap: "Fill in", order: "Build the sentence", transform: "Rewrite" },
    correctThisRound: "correct this round",
    exercises: (n: number) => (n === 1 ? "1 exercise" : `${n} exercises`),
    overall: (correct: number, total: number) => `best overall: ${correct}/${total}`,
    startOver: "Start over",
    richtig: "Richtig!",
    resultTitle: (correct: number, total: number) => `${correct} of ${total} correct`,
    mastered: "Topic mastered – review it again in a few days.",
    tryAgain: "Read the explanations of your mistakes and try again.",
    answerPlaceholder: "Your answer",
    sentencePlaceholder: "Write the new sentence",
    check: "Check",
    tapWords: "Tap the words in the right order…",
    clear: "Clear",
  },
};
