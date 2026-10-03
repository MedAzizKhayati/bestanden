import type { Messages } from "../en";

export const dashboard: Messages["dashboard"] = {
  examDay: "Prüfungstag – viel Erfolg!",
  daysUntilExam: (n) => (n === 1 ? "Noch 1 Tag bis zur Prüfung" : `Noch ${n} Tage bis zur Prüfung`),
  setExamDate: "Prüfungsdatum festlegen",
  hero: {
    titleNew: "telc B1 bestehen – mit Plan.",
    titleStreak: (day) => `Tag ${day} – weiter so!`,
    titleBack: "Willkommen zurück!",
    introNew: (sets) =>
      `${sets} eigens erstellte Übungssätze mit echter Prüfungszeit, Hörübungen mit Audio, KI-Feedback zu deinem Schreiben und Sprechen und alle B1-Grammatikthemen.`,
    introBack: "Das bringt dich jetzt am meisten weiter.",
  },
  next: {
    resume: "Nicht beendet – deine Zeit läuft noch",
    startHere: "Hier anfangen",
    weakest: "Empfohlen: dein schwächster Teil",
  },
  mockExam: "Modelltest",
  today: {
    title: "Heute",
    goalReached: "Tagesziel erreicht – super!",
    autoCount: "Deine Übungszeit wird automatisch gezählt.",
    mistakesDue: () => "Fehler zum Wiederholen",
    wordsDue: (n) => (n === 1 ? "fälliges Wort" : "fällige Wörter"),
  },
  practice: {
    title: "Prüfungstraining",
    structure: "Aufbau & Bewertung →",
  },
  learn: {
    title: "Lernen & wiederholen",
    grammar: (topics) => `${topics} Themen mit Übungen – alles, was in den Sprachbausteinen vorkommt.`,
    vocab: (words, inCards) => `${words} B1-Wörter · ${inCards} in deinen Karteikarten.`,
    phrasesTitle: "Redemittel",
    phrases: (n) => `${n} Wendungen für Schreiben und Sprechen.`,
    strategies: "So gehst du jeden Teil an – und so vermeidest du die typischen Fallen.",
  },
  level: "Dein Niveau",
};
