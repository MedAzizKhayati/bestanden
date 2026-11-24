export const speaking = {
  meta: {
    title: "Sprechen – oral exam practice with an AI partner",
    description: "All three parts of the telc oral exam with model dialogues, Redemittel and an AI conversation partner.",
    partTitle: (teil: number, name: string) => `Sprechen Teil ${teil} – ${name}`,
    setTitle: (teil: number, title: string) => `Sprechen Teil ${teil} · ${title}`,
  },

  /** Section page /[exam]/sprechen. */
  page: {
    eyebrowPoints: (max: number, pass: number) => `${max} points · pass with ${pass}`,
    description: (prepMinutes: number) =>
      `You take the oral exam in pairs with another candidate, after ${prepMinutes} minutes of preparation. Practise every part with model dialogues – and with an AI partner who reacts to what you say.`,
    facts: {
      prepTitle: (n: number) => `${n} min preparation`,
      prepText: "Notes allowed – but don't read them out.",
      pairTitle: "Paired exam",
      pairText: "Two candidates, two examiners. Talk to your partner, not to the examiners.",
      aiTitle: "AI exam partner",
      aiText: "Speak or type – your partner answers aloud in German.",
    },
    partMeta: (minutes: number, points: number, tasks: number) => `~${minutes} min · ${points} P. · ${tasks} ${tasks === 1 ? "task" : "tasks"}`,
    practise: "Practise",
    scoringTitle: "How the examiners score you",
    scoringText: "Each part is rated A–D on four criteria. Teil 1 counts half as much as Teil 2 and Teil 3.",
    scoringTextEqual: (points: number) => `Each part is rated A–D on four criteria – all three parts count the same (${points} points each).`,
    criterion: "Criterion",
    assessed: "What is assessed",
  },

  /** Part page /[exam]/sprechen/[part]. */
  part: {
    tasks: "Tasks",
    instruction: "Exam instruction",
  },

  runner: {
    aiReady: "AI partner ready",
    tabs: { practice: "Practice", model: "Model dialogue", roleplay: "Role-play", phrases: "Phrases & ideas" },
    prepOver: "Preparation time is over – start speaking.",
    timeUp: "Time is up – the examiner ends this part.",
    notesHint: "Keywords only – in the exam you may not read out your notes.",
    preparation: "Preparation",
    prepText: (minutes: number) => `In the exam you get 20 minutes for all three parts. Here: ${minutes} min for this part – notes allowed.`,
    prepTextB2: (minutes: number) =>
      `In the exam you prepare Teil 1 at home and get 20 minutes for Teil 2 and 3. Here: ${minutes} min for this part – notes allowed.`,
    chooseFirst: "Choose your topic on the sheet first.",
    startPrep: "Start preparation",
    readyStart: "I'm ready – start speaking",
    startSpeaking: "Start speaking",
    modeTitle: "How do you want to practise?",
    modePartner: "Talk with an AI partner",
    modePartnerText: "A real two-way exam conversation in German – by voice or keyboard.",
    modePartnerMissing: "Requires ANTHROPIC_API_KEY on the server.",
    modeMonologue: "Record your own turn",
    modeMonologueText: "Speak your part, read the transcript, listen to yourself.",
    strictTiming: (minutes: number) => `Strict timing (${minutes} min)`,
    strategy: "Strategy",
    yourNotes: "Your notes",
    endFeedback: "End & get feedback",
    finished: "Finished",
    finishedStats: (clock: string, turns: number) => ` · ${clock} spoken · ${turns} ${turns === 1 ? "turn" : "turns"}`,
    finishedOn: (date: string) => `Practised on ${date}`,
    previousTitle: "Your previous attempts",
    previousHint: "Open an attempt to read your conversation and its feedback again.",
    attemptScore: (points: string, max: number) => `${points}/${max} points`,
    attemptNoFeedback: "no feedback yet",
    openAttempt: "Open",
    getFeedbackTitle: "This attempt has no AI feedback yet.",
    getFeedback: "Get AI feedback",
    practiseAgain: "Practise again",
    modelDialogue: "Model dialogue",
    loadingTitle: "The examiner is reviewing your conversation…",
    loadingText: "Rating range of expression, task management and accuracy with the official criteria.",
    aiFailed: "AI feedback failed:",
    /** Shown when the server sent no error message (e.g. no connection). */
    aiFailedFallback: "Please try again.",
    selfCheckTitle: "Self-check",
    selfCheckText: "What examiners listen for in this part – tick what you did.",
    transcript: "Transcript of your conversation",
  },

  /** What examiners listen for, per part. */
  selfCheck: {
    "sprechen-1": [
      "I said my name and where I come from",
      "I talked about my family and where I live",
      "I explained where and how long I have learned German",
      "I talked about my job, studies or training",
      "I asked my partner at least three questions",
      "I reacted to my partner's answers („Ach, interessant! Seit wann …?“)",
    ],
    "sprechen-2": [
      "I said whose opinion it is (name, age, job)",
      "I summarised the opinion in my own words („Er/Sie meint, dass …“)",
      "I gave my own opinion with a reason",
      "I told a personal experience or compared with my home country",
      "I asked my partner for their opinion",
      "I agreed or disagreed politely and gave reasons",
    ],
    "sprechen-3": [
      "I made at least three concrete suggestions",
      "I gave a reason for every suggestion",
      "I reacted to my partner's ideas (agreed, or objected politely with a counter-proposal)",
      "We talked about every point on the checklist",
      "We decided who does which task",
      "We summarised the plan at the end",
    ],
  },

  /** telc B2: what examiners listen for, per part. */
  selfCheckB2: {
    "sprechen-1": [
      "I named my topic and said why I chose it",
      "I told my experience in a clear order (what, when, where, with whom, what happened)",
      "I evaluated the experience – what it meant to me, what I learned",
      "I spoke for about 1½ minutes without reading out notes",
      "I answered my partner's questions with details",
      "I asked my partner at least two real follow-up questions about their talk",
    ],
    "sprechen-2": [
      "I summarised the main points of the article briefly in my own words",
      "I said which arguments I find convincing or interesting – and why",
      "I gave my own opinion with reasons and an example",
      "I reacted to my partner's arguments (agreed in part, objected, conceded a point)",
      "I asked my partner questions and kept the discussion going",
      "I made a suggestion or a compromise",
    ],
    "sprechen-3": [
      "I brought in several concrete ideas of my own",
      "I gave reasons for my proposals",
      "I reacted to my partner's proposals – accepted, questioned or politely rejected them with an alternative",
      "We negotiated a compromise where we disagreed",
      "We agreed on who takes care of what",
      "We summarised the plan at the end",
    ],
  },

  /** Task for the "record your own turn" mode. */
  monologuePrompt: {
    intro:
      "Introduce yourself as you would to your partner: name, origin, where you live, family, German, job, languages – then ask two questions you would ask your partner.",
    topic: (name: string, theme: string) =>
      `Report the opinion of ${name} to your partner in your own words, then say what you think about „${theme}“ and why, with an example from your life.`,
    planning: "Open the planning: make two or three concrete suggestions for the checklist points and give a reason for each.",
    experience: (topic: string) =>
      `Talk for about 1½ minutes about „${topic}“: what happened, when and where, who was there, why it mattered to you and how you see it today.`,
    discussion: (theme: string) =>
      `Comment briefly on the article about „${theme}“ (main points, what you find interesting), then give your own opinion with reasons and an example.`,
    planningB2: "Open the planning: bring in two or three ideas for the project, give reasons and suggest who could take care of what.",
  },

  /** "Phrases & ideas" tab. */
  ideas: {
    title: "Ideas for the discussion",
    pro: "Pro",
    contra: "Contra",
    examinerQuestions: "Questions the examiner may ask",
    partnerQuestions: "Questions to ask your partner",
    taskPhrases: "Phrases for this task",
    structure: "How to structure your 1½ minutes",
    followUp: "Questions a partner may ask",
    aspects: "Aspects to think about",
    aspectsNote: "Your own preparation – the exam sheet shows only the task.",
    vocabulary: "Vocabulary",
  },

  /** Placeholder while speech recognition is running. */
  listening: "Listening…",

  conversation: {
    partnerFailed: "The partner could not answer.",
    yourPartner: "Your partner",
    partnerFallback: "Partner",
    thinking: "is thinking…",
    speaking: "is speaking…",
    listening: "is listening to you",
    aiPartner: (_gender: "f" | "m") => "AI exam partner",
    mute: "Mute partner voice",
    unmute: "Unmute partner voice",
    partnerStarts: "Your partner is about to start…",
    youStart: "You start: press the microphone and speak – or type your first turn.",
    privacy:
      "Speech is transcribed by your browser's speech service; the text of the conversation is sent to the AI to generate replies and feedback.",
    typePlaceholder: "Type your answer in German…",
    typePlaceholderNoMic: "Speech recognition isn't supported here – type your answer in German…",
    doneSpeaking: "Done speaking",
    waitPartner: "Wait for your partner…",
    pressSpeak: "Press and speak",
    useMic: "Use microphone",
    typeInstead: "Type instead",
  },

  monologue: {
    stopRecording: "Stop recording",
    startRecording: "Start recording",
    target: (clock: string) => `target ≈ ${clock}`,
    speakFreely: "Speak freely – press stop when you are done.",
    pressMic: "Press the microphone and start speaking German.",
    privacy:
      "Transcription is done by your browser's speech service (in Chrome, audio is processed by Google). Your recording stays on this device.",
    noRecognition: "Speech recognition isn't available in this browser – speak aloud, then type roughly what you said.",
    /** "You spoke for **1:20**" – the time is bold. */
    spokeFor: { before: "You spoke for ", after: "" },
    tooShort: " – a bit short; in the exam, aim for the target length.",
    fixErrors: " Fix any recognition errors before getting feedback:",
    useAnswer: "Use this answer",
    recordAgain: "Record again",
  },

  modelDialogue: {
    listen: "Listen to the model dialogue",
    clickLine: "Click any line to start from there.",
  },

  rolePlay: {
    unsupported:
      "Role-play needs speech recognition, which this browser doesn't offer. Use Chrome, Edge or Safari – or listen to the model dialogue and shadow it aloud.",
    yourRole: "Your role:",
    readLines: "Read my lines",
    ownWords: "Say it in my own words",
    again: "Again",
    start: "Start role-play",
    /** "**80% of the model wording** recognised across 6 turns." */
    matchLead: (percent: string) => `${percent} of the model wording`,
    matchRest: (turns: number) => ` recognised across ${turns} ${turns === 1 ? "turn" : "turns"}.`,
    readingTip: "Aim for 80%+ when reading – it trains pronunciation and rhythm.",
    ownWordsTip: "In your own words a lower match is normal – what matters is that you kept the conversation going.",
    you: "You",
    yourTurn: "Your turn – respond in your own words…",
    nothing: "(nothing recognised)",
    match: (percent: string) => `${percent} match`,
    noLines: "This dialogue has no lines for the selected role.",
  },

  feedback: {
    of: (max: number) => `of ${max}`,
    estimate: "AI examiner estimate",
    pronunciation: (max: number) =>
      `Pronunciation (up to ${max} more points) can't be judged from a transcript – listen to your recording and compare with the model.`,
    corrections: "Corrections",
    betterPhrases: "Sound more natural",
    insteadOf: (phrase: string) => `Instead of „${phrase}“`,
    tryThis: (phrase: string) => `try „${phrase}“`,
    whatWorked: "What worked",
    nextTime: "Next time",
  },

  taskSheet: {
    partnerHidden: "Your partner has a different opinion on this topic – you'll hear it in the conversation.",
    chooseTopic: "Choose the topic you want to talk about – in the exam you prepare it at home.",
  },

  /** Speech recognition errors (src/lib/audio/recognition.ts). */
  recognition: {
    errors: {
      "not-allowed": "Microphone access was blocked. Allow it in your browser's address bar and try again.",
      "service-not-allowed": "Speech recognition is not allowed in this browser.",
      "audio-capture": "No microphone was found.",
      network: "Speech recognition needs an internet connection in this browser.",
    },
    other: (code: string) => `Speech recognition error: ${code}`,
    startFailed: "Could not start the microphone.",
  },
};
