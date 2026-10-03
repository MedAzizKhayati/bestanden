import type { Messages } from "../en";

export const speaking: Messages["speaking"] = {
  meta: {
    title: "Sprechen – die mündliche Prüfung mit KI üben",
    description: "Alle drei Teile der mündlichen Prüfung (telc B1) – mit Mustergesprächen, Redemitteln und einer KI, mit der du sprechen kannst.",
    partTitle: (teil, name) => `Sprechen Teil ${teil} – ${name}`,
    setTitle: (teil, title) => `Sprechen Teil ${teil} · ${title}`,
  },

  page: {
    eyebrowPoints: (max, pass) => `${max} Punkte · bestanden ab ${pass}`,
    description: (prepMinutes) =>
      `Die mündliche Prüfung machst du zu zweit mit einer anderen Person, nach ${prepMinutes} Minuten Vorbereitung. Übe jeden Teil mit Mustergesprächen – und mit einer KI, die auf das reagiert, was du sagst.`,
    facts: {
      prepTitle: (n) => `${n} Min. Vorbereitung`,
      prepText: "Notizen sind erlaubt – aber lies sie nicht vor.",
      pairTitle: "Prüfung zu zweit",
      pairText: "Zwei Teilnehmende, zwei Prüfende. Sprich mit deinem Gegenüber, nicht mit den Prüfenden.",
      aiTitle: "KI als Gegenüber",
      aiText: "Sprich oder tippe – die KI antwortet laut auf Deutsch.",
    },
    partMeta: (minutes, points, tasks) => `~${minutes} Min. · ${points} P. · ${tasks === 1 ? "1 Aufgabe" : `${tasks} Aufgaben`}`,
    practise: "Üben",
    scoringTitle: "So bewerten dich die Prüfenden",
    scoringText: "Jeder Teil wird in vier Kriterien mit A bis D bewertet. Teil 1 zählt halb so viel wie Teil 2 und Teil 3.",
    criterion: "Kriterium",
    assessed: "Was bewertet wird",
  },

  part: {
    tasks: "Aufgaben",
    instruction: "Aufgabenstellung",
  },

  runner: {
    aiReady: "KI bereit",
    tabs: { practice: "Üben", model: "Mustergespräch", roleplay: "Rollenspiel", phrases: "Redemittel & Ideen" },
    prepOver: "Die Vorbereitungszeit ist vorbei – fang an zu sprechen.",
    timeUp: "Die Zeit ist um – dieser Teil ist zu Ende.",
    notesHint: "Nur Stichwörter – in der Prüfung darfst du deine Notizen nicht vorlesen.",
    preparation: "Vorbereitung",
    prepText: (minutes) => `In der Prüfung hast du 20 Minuten für alle drei Teile. Hier: ${minutes} Min. für diesen Teil – Notizen sind erlaubt.`,
    startPrep: "Vorbereitung starten",
    readyStart: "Ich bin bereit – jetzt sprechen",
    startSpeaking: "Sprechen starten",
    modeTitle: "Wie möchtest du üben?",
    modePartner: "Gespräch mit der KI",
    modePartnerText: "Ein echtes Prüfungsgespräch auf Deutsch – du sprichst oder tippst.",
    modePartnerMissing: "Dafür muss auf dem Server ANTHROPIC_API_KEY gesetzt sein.",
    modeMonologue: "Deinen Teil aufnehmen",
    modeMonologueText: "Sprich deinen Teil, lies das Transkript und hör dich selbst an.",
    strictTiming: (minutes) => `Strenge Zeitvorgabe (${minutes} Min.)`,
    strategy: "Strategie",
    yourNotes: "Deine Notizen",
    endFeedback: "Beenden & auswerten",
    finished: "Beendet",
    finishedStats: (clock, turns) => ` · ${clock} gesprochen · ${turns === 1 ? "1 Beitrag" : `${turns} Beiträge`}`,
    practiseAgain: "Nochmal üben",
    modelDialogue: "Mustergespräch",
    loadingTitle: "Die KI wertet dein Gespräch aus …",
    loadingText: "Sie bewertet Ausdrucksfähigkeit, Aufgabenbewältigung und formale Richtigkeit nach den offiziellen Kriterien.",
    aiFailed: "Das KI-Feedback hat nicht geklappt:",
    aiFailedFallback: "Bitte versuche es noch einmal.",
    selfCheckTitle: "Selbstcheck",
    selfCheckText: "Darauf achten die Prüfenden in diesem Teil – hake ab, was du gemacht hast.",
    transcript: "Transkript deines Gesprächs",
  },

  selfCheck: {
    "sprechen-1": [
      "Ich habe gesagt, wie ich heiße und woher ich komme",
      "Ich habe über meine Familie und meinen Wohnort gesprochen",
      "Ich habe erklärt, wo und wie lange ich Deutsch gelernt habe",
      "Ich habe über meinen Beruf, mein Studium oder meine Ausbildung gesprochen",
      "Ich habe meinem Gegenüber mindestens drei Fragen gestellt",
      "Ich habe auf die Antworten reagiert („Ach, interessant! Seit wann …?“)",
    ],
    "sprechen-2": [
      "Ich habe gesagt, von wem die Meinung ist (Name, Alter, Beruf)",
      "Ich habe die Meinung mit eigenen Worten zusammengefasst („Er/Sie meint, dass …“)",
      "Ich habe meine eigene Meinung gesagt und begründet",
      "Ich habe von einer eigenen Erfahrung erzählt oder mit meinem Heimatland verglichen",
      "Ich habe mein Gegenüber nach seiner Meinung gefragt",
      "Ich habe höflich zugestimmt oder widersprochen und das begründet",
    ],
    "sprechen-3": [
      "Ich habe mindestens drei konkrete Vorschläge gemacht",
      "Ich habe jeden Vorschlag begründet",
      "Ich habe auf die Ideen meines Gegenübers reagiert (zugestimmt oder höflich widersprochen und etwas anderes vorgeschlagen)",
      "Wir haben über jeden Punkt auf der Liste gesprochen",
      "Wir haben entschieden, wer welche Aufgabe übernimmt",
      "Wir haben den Plan am Ende zusammengefasst",
    ],
  },

  monologuePrompt: {
    intro:
      "Stell dich so vor, wie du dich deinem Gegenüber vorstellen würdest: Name, Herkunft, Wohnort, Familie, Deutsch, Beruf, Sprachen. Stell dann zwei Fragen, die du deinem Gegenüber stellen würdest.",
    topic: (name, theme) =>
      `Berichte deinem Gegenüber mit eigenen Worten, was ${name} meint. Sag dann, was du über „${theme}“ denkst und warum – mit einem Beispiel aus deinem Leben.`,
    planning: "Beginne die Planung: Mach zwei oder drei konkrete Vorschläge zu den Punkten auf der Liste und begründe jeden Vorschlag.",
  },

  ideas: {
    title: "Ideen für das Gespräch",
    pro: "Pro",
    contra: "Contra",
    examinerQuestions: "Mögliche Fragen der Prüfenden",
    partnerQuestions: "Fragen an dein Gegenüber",
    taskPhrases: "Redemittel für diese Aufgabe",
    vocabulary: "Wortschatz",
  },

  listening: "Jetzt sprechen …",

  conversation: {
    partnerFailed: "Dein Gegenüber konnte nicht antworten.",
    yourPartner: "Dein Gegenüber",
    partnerFallback: "Gegenüber",
    thinking: "denkt nach …",
    speaking: "spricht …",
    listening: "hört dir zu",
    aiPartner: (gender) => (gender === "f" ? "KI-Gesprächspartnerin" : "KI-Gesprächspartner"),
    mute: "Stimme stummschalten",
    unmute: "Stimme einschalten",
    partnerStarts: "Dein Gegenüber fängt gleich an …",
    youStart: "Du fängst an: Drück auf das Mikrofon und sprich – oder tippe deinen ersten Beitrag.",
    privacy:
      "Deine Sprache wird vom Sprachdienst deines Browsers in Text umgewandelt. Der Text des Gesprächs geht an die KI, damit sie antworten und Feedback geben kann.",
    typePlaceholder: "Tippe deine Antwort auf Deutsch …",
    typePlaceholderNoMic: "Spracherkennung geht hier nicht – tippe deine Antwort auf Deutsch …",
    doneSpeaking: "Fertig gesprochen",
    waitPartner: "Warte auf die Antwort …",
    pressSpeak: "Drücken und sprechen",
    useMic: "Mikrofon benutzen",
    typeInstead: "Lieber tippen",
  },

  monologue: {
    stopRecording: "Aufnahme stoppen",
    startRecording: "Aufnahme starten",
    target: (clock) => `Ziel ≈ ${clock}`,
    speakFreely: "Sprich frei – drück auf Stopp, wenn du fertig bist.",
    pressMic: "Drück auf das Mikrofon und fang an, Deutsch zu sprechen.",
    privacy:
      "Die Spracherkennung übernimmt der Sprachdienst deines Browsers (in Chrome verarbeitet Google die Audiodaten). Deine Aufnahme bleibt auf diesem Gerät.",
    noRecognition: "In diesem Browser gibt es keine Spracherkennung – sprich laut und tippe dann ungefähr, was du gesagt hast.",
    spokeFor: { before: "Du hast ", after: " gesprochen" },
    tooShort: " – etwas kurz; in der Prüfung solltest du die Ziellänge erreichen.",
    fixErrors: " Korrigiere Erkennungsfehler, bevor du Feedback holst:",
    useAnswer: "Diese Antwort verwenden",
    recordAgain: "Nochmal aufnehmen",
  },

  modelDialogue: {
    listen: "Mustergespräch anhören",
    clickLine: "Klicke auf eine Zeile, um ab dort zu hören.",
  },

  rolePlay: {
    unsupported:
      "Für das Rollenspiel brauchst du Spracherkennung, aber dieser Browser hat keine. Nimm Chrome, Edge oder Safari – oder hör dir das Mustergespräch an und sprich laut mit.",
    yourRole: "Deine Rolle:",
    readLines: "Meinen Text ablesen",
    ownWords: "Mit eigenen Worten sagen",
    again: "Nochmal",
    start: "Rollenspiel starten",
    matchLead: (percent) => `${percent} des Mustertextes`,
    matchRest: (turns) => ` in ${turns === 1 ? "1 Beitrag" : `${turns} Beiträgen`} erkannt.`,
    readingTip: "Ziel beim Ablesen: 80 % oder mehr – das trainiert Aussprache und Rhythmus.",
    ownWordsTip: "Mit eigenen Worten ist die Übereinstimmung meistens niedriger, das ist normal. Wichtig ist, dass du das Gespräch am Laufen gehalten hast.",
    you: "Du",
    yourTurn: "Du bist dran – antworte mit eigenen Worten …",
    nothing: "(nichts erkannt)",
    match: (percent) => `${percent} Übereinstimmung`,
    noLines: "In diesem Gespräch hat die gewählte Rolle keinen Text.",
  },

  feedback: {
    of: (max) => `von ${max}`,
    estimate: "KI-Einschätzung",
    pronunciation: (max) =>
      `Die Aussprache (bis zu ${max} weitere Punkte) lässt sich nicht mit einem Transkript bewerten – hör dir deine Aufnahme an und vergleiche sie mit dem Mustergespräch.`,
    corrections: "Korrekturen",
    betterPhrases: "So klingt es natürlicher",
    insteadOf: (phrase) => `Statt „${phrase}“`,
    tryThis: (phrase) => `besser: „${phrase}“`,
    whatWorked: "Das war gut",
    nextTime: "Beim nächsten Mal",
  },

  taskSheet: {
    partnerHidden: "Dein Gegenüber hat eine andere Meinung zu diesem Thema – du hörst sie im Gespräch.",
  },

  recognition: {
    errors: {
      "not-allowed": "Der Zugriff auf das Mikrofon ist blockiert. Erlaube ihn in der Adressleiste deines Browsers und versuche es noch einmal.",
      "service-not-allowed": "Spracherkennung ist in diesem Browser nicht erlaubt.",
      "audio-capture": "Es wurde kein Mikrofon gefunden.",
      network: "Die Spracherkennung braucht in diesem Browser eine Internetverbindung.",
    },
    other: (code) => `Fehler bei der Spracherkennung: ${code}`,
    startFailed: "Das Mikrofon konnte nicht gestartet werden.",
  },
};
