import type { Messages } from "../en";

/** Zahlwörter im Fließtext („fünf Wörter bleiben übrig“). */
const WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
const word = (n: number) => WORDS[n] ?? String(n);
const times = (n: number) => (n === 1 ? "einmal" : n === 2 ? "zweimal" : `${n}-mal`);

export const runner: Messages["runner"] = {
  intro: {
    setOf: (set, count) => `Satz ${set} von ${count}`,
    played: "Wiedergabe",
    times,
    examMode: "Prüfungssimulation",
    examModeText: (plays) =>
      `Erst hast du Lesezeit, dann laufen die Aufnahmen ${times(plays)} ohne Pause – genau wie in der echten Prüfung. Am Ende wird automatisch abgegeben.`,
    trainingMode: "Training",
    trainingModeText: (plays) =>
      `Du spielst jede Aufnahme selbst ab (trotzdem max. ${plays}×), stellst das Tempo ein und gibst ab, wenn du fertig bist.`,
    strict: "Strenge Prüfungszeit",
    strictOn: (minutes) =>
      `Nach ${minutes} Minuten werden deine Antworten automatisch abgegeben – ohne Extrazeit, auch wenn du die Seite neu lädst.`,
    strictOff: "Nach Ablauf der Zeit läuft die Uhr weiter, und deine Zeitüberschreitung wird gespeichert.",
    strategy: "Strategie",
    startListening: "Hören starten",
    startNow: "Jetzt starten",
    allSets: "Alle Übungssätze",
    best: "Bestwert:",
    attempts: (n) => (n === 1 ? "1 Versuch" : `${n} Versuche`),
  },

  bar: {
    backToSets: "Zurück zu allen Übungssätzen",
    answered: "beantwortet",
  },

  confirm: {
    title: (n) => (n === 1 ? "Mit 1 offenen Aufgabe abgeben?" : `Mit ${n} offenen Aufgaben abgeben?`),
    text: "In der echten Prüfung gibt es keinen Punktabzug für falsche Antworten – kreuz also immer etwas an. Offene Aufgaben bringen null Punkte.",
    keepWorking: "Weiterarbeiten",
    submitAnyway: "Trotzdem abgeben",
  },

  timer: {
    minutesLeft: (n) => (n === 1 ? "Noch 1 Minute" : `Noch ${n} Minuten`),
    autoSubmit: "Bei 0:00 werden die Antworten automatisch abgegeben.",
    strictTip: "Prüfungszeit: Wenn die Zeit um ist, werden deine Antworten automatisch abgegeben.",
    practiceTip: "Übungszeit: Du kannst nach Ablauf der Zeit weitermachen – die Zeitüberschreitung wird gespeichert.",
  },

  result: {
    passMark: (percent) => `Ziel: ${percent}`,
    points: (points, max) => `${points} / ${max} Punkte`,
    correctOf: (correct, total) => `${correct} von ${total} richtig`,
    newBest: "· neuer Bestwert!",
    timeOf: (duration, limit) => `${duration} von ${limit}`,
    overtime: (duration) => `${duration} über der Zeit`,
    autoSubmitted: "Bei Zeitende automatisch abgegeben",
    bestBefore: (points) => `Bisheriger Bestwert: ${points}`,
    attempt: (n) => `${n}. Versuch`,
    nextSet: "Nächster Übungssatz",
    allSets: "Alle Übungssätze",
    addedToTrainer: "Falsche Antworten sind jetzt in deinem Fehlertrainer.",
  },

  review: {
    clearAnswer: "Antwort löschen",
    explanations: "Erklärungen",
    grammar: "Grammatik",
    reviewGrammar: "Grammatik wiederholen",
  },

  headlines: {
    trap: "Falle:",
    choose: "Überschrift wählen",
    chooseNow: "Jetzt eine Überschrift wählen →",
    forText: (n) => `für Text ${n} · Tasten a–j`,
    drawerTitle: (n) => `Überschrift für Text ${n}`,
    drawerText: "Jede Überschrift kannst du nur einmal benutzen.",
  },

  ads: {
    noAdFits: "x (keine Anzeige passt)",
    noAdForSituation: (n) => `x – keine Anzeige passt zu Situation ${n}`,
    noAd: "x – keine Anzeige passt",
    drawerTitle: (n) => `Anzeige für Situation ${n}`,
  },

  textMc: {
    showInText: "Im Text zeigen",
  },

  gaps: {
    hint: (n) => `Lücke ${n} · Tasten 1–3`,
    forGap: (n) => `für Lücke ${n}`,
    wordsLeft: (n) => `Jedes Wort passt nur einmal – ${n === 1 ? "ein Wort bleibt" : `${word(n)} Wörter bleiben`} übrig.`,
    drawerTitle: (n) => `Wort für Lücke ${n}`,
    drawerText: "Jedes Wort passt nur einmal.",
  },

  glossary: {
    title: "Nützliche Wörter aus diesem Übungssatz",
  },

  audio: {
    voiceUnsupported: "Dein Browser kann keine Sprache abspielen.",
    voiceMissing: "Auf diesem Gerät gibt es keine deutsche Stimme.",
    voiceHelp:
      "Nutze Chrome, Edge oder Safari oder installiere eine deutsche Stimme (macOS: Systemeinstellungen → Bedienungshilfen → Gesprochene Inhalte; Windows: Einstellungen → Zeit und Sprache → Spracherkennung).",
    ready: "Bereit",
    finished: "Aufnahme beendet",
    playing: "Läuft gerade",
    wait: "Bitte warten",
    checkAndSubmit: "Prüf deine Antworten und gib ab",
    pressStart: "Auf Start drücken",
    trainingLead: "Trainingsmodus · Du kannst jeden Text",
    trainingRest: " abspielen – wie in der Prüfung",
    intro: "Einleitung",
    transcriptHint: "Transkript – klick auf eine Zeile, um sie zu hören",
    playText: "Text abspielen",
    introTranscript: "Transkript der Einleitung",
    playAgain: "Nochmal abspielen",
    playConversation: "Gespräch abspielen",
    playsLeft: (left, total) => `noch ${left} von ${total} Wiedergaben`,
    transcript: "Transkript",
    playAll: "Alles abspielen",
    soundCheck: "Tonprobe",
    voiceBrowser: (name) => `Stimme: ${name}`,
    voiceShipped: "Natürliche Stimmen (eingebaut)",
    voiceNeural: (engine) => `Natürliche Stimme: ${engine}`,
    voiceDefault: "die deutsche Standardstimme des Browsers",
    betterVoices: "Bessere Stimmen",
    issueFailed:
      "Eine Stimme ließ sich nicht abspielen, deshalb wurde eine andere verwendet. Wenn du weiterhin nichts hörst, prüfe den Ton oder wähle in den Einstellungen eine andere Stimme.",
    issueNoVoice:
      "Auf diesem Gerät gibt es keine deutsche Stimme, deshalb kann die Aufnahme nicht abgespielt werden. Wähle in den Einstellungen eine natürliche Stimme oder installiere eine deutsche Stimme.",
    transcriptTip: "Nochmal hören und dabei mitlesen – so wirst du am schnellsten besser.",
  },
};
