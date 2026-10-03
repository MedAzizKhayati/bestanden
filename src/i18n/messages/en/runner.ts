/** Counts written as words in running text ("five words are left over"). */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n: number) => WORDS[n] ?? String(n);
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

/** Exercise runner, answer players, timers and results. */
export const runner = {
  /** Start screen of a practice set. */
  intro: {
    setOf: (set: string, count: number) => `Set ${set} of ${count}`,
    played: "Played",
    times,
    examMode: "Exam simulation",
    examModeText: (plays: number) =>
      `Reading time, then the recordings play ${times(plays)} without pause – exactly like the real exam. Submitted automatically at the end.`,
    trainingMode: "Training",
    trainingModeText: (plays: number) => `Play each recording yourself (still max. ${plays}×), adjust the speed, submit when ready.`,
    strict: "Strict exam timing",
    strictOn: (minutes: number) => `Your answers are submitted automatically after ${minutes} minutes – no extra time, even if you reload.`,
    strictOff: "The timer keeps running after the limit and your overtime is recorded.",
    strategy: "Strategy",
    startListening: "Start listening",
    startNow: "Start now",
    allSets: "All sets",
    /** Followed by the bold best score. */
    best: "Best:",
    attempts: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
  },

  /** Sticky bar while working on a set. */
  bar: {
    backToSets: "Back to all sets",
    answered: "answered",
  },

  /** Dialog when submitting with open items. */
  confirm: {
    title: (n: number) => (n === 1 ? "Submit with 1 unanswered item?" : `Submit with ${n} unanswered items?`),
    text: "In the real exam there is no penalty for wrong answers – always mark something. Unanswered items score zero.",
    keepWorking: "Keep working",
    submitAnyway: "Submit anyway",
  },

  /** Countdown timer. */
  timer: {
    minutesLeft: (n: number) => (n === 1 ? "1 minute left" : `${n} minutes left`),
    autoSubmit: "Answers are submitted automatically at 0:00.",
    strictTip: "Exam timing: your answers are submitted automatically when the time is up.",
    practiceTip: "Practice timing: you can continue after the time is up – overtime is recorded.",
  },

  /** Result summary after submitting. */
  result: {
    passMark: (percent: string) => `pass: ${percent}`,
    points: (points: string, max: number) => `${points} / ${max} points`,
    correctOf: (correct: number, total: number) => `${correct} of ${total} correct`,
    newBest: "· new personal best!",
    timeOf: (duration: string, limit: string) => `${duration} of ${limit}`,
    overtime: (duration: string) => `${duration} over time`,
    autoSubmitted: "Submitted automatically at time-up",
    bestBefore: (points: string) => `Best before: ${points}`,
    attempt: (n: number) => `Attempt #${n}`,
    nextSet: "Next set",
    allSets: "All sets",
    addedToTrainer: "Wrong answers were added to your mistake trainer.",
  },

  /** Shared by the players (answering and review). */
  review: {
    clearAnswer: "Clear answer",
    explanations: "Explanations",
    grammar: "Grammar",
    reviewGrammar: "Review the grammar",
  },

  /** Lesen Teil 1 – headline matching. */
  headlines: {
    trap: "Trap:",
    choose: "Choose a headline",
    chooseNow: "Now choose a headline →",
    forText: (n: number) => `for text ${n} · keys a–j`,
    drawerTitle: (n: number) => `Headline for text ${n}`,
    drawerText: "Each headline can be used once.",
  },

  /** Lesen Teil 3 – ad matching. */
  ads: {
    noAdFits: "x (no ad fits)",
    noAdForSituation: (n: number) => `x – no ad fits situation ${n}`,
    noAd: "x – no ad fits",
    drawerTitle: (n: number) => `Ad for situation ${n}`,
  },

  /** Lesen Teil 2 – multiple choice. */
  textMc: {
    showInText: "Show in text",
  },

  /** Sprachbausteine – gap texts. */
  gaps: {
    hint: (n: number) => `Lücke ${n} · press 1–3`,
    forGap: (n: number) => `for gap ${n}`,
    wordsLeft: (n: number) => `Each word fits only once – ${word(n)} ${n === 1 ? "word is" : "words are"} left over.`,
    drawerTitle: (n: number) => `Word for gap ${n}`,
    drawerText: "Each word fits only once.",
  },

  glossary: {
    title: "Useful words from this set",
  },

  /** Hören – players, exam audio console, voice check. */
  audio: {
    voiceUnsupported: "Your browser can't play speech.",
    voiceMissing: "No German voice found on this device.",
    voiceHelp:
      "Use Chrome, Edge or Safari, or install a German voice (macOS: System Settings → Accessibility → Spoken Content; Windows: Settings → Time & language → Speech).",
    ready: "Ready",
    finished: "Recording finished",
    playing: "Now playing",
    wait: "Please wait",
    checkAndSubmit: "Check your answers and submit",
    pressStart: "Press start",
    /** "Training mode · each text can be played **once**, like in the exam" */
    trainingLead: "Training mode · each text can be played",
    trainingRest: ", like in the exam",
    intro: "Intro",
    transcriptHint: "Transcript – click a line to hear it",
    playText: "Play text",
    introTranscript: "Introduction transcript",
    playAgain: "Play again",
    playConversation: "Play conversation",
    playsLeft: (left: number, total: number) => `${left} of ${total} plays left`,
    transcript: "Transcript",
    playAll: "Play all",
    transcriptTip: "Listening again with the transcript is one of the fastest ways to improve.",
    soundCheck: "Test sound",
    voiceBrowser: (name: string) => `Voice: ${name}`,
    voiceNeural: (engine: string) => `Natural voice: ${engine}`,
    voiceDefault: "the browser's default German voice",
    betterVoices: "Better voices",
    issueFailed:
      "A voice could not be played, so another one was used. If you still hear nothing, check your sound or pick a different voice in the settings.",
    issueNoVoice: "There is no German voice on this device, so the recording can't be played. Choose a natural voice in the settings or install a German voice.",
  },
};
