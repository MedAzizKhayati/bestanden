import type { Messages } from "../en";

export const mistakes: Messages["mistakes"] = {
  page: {
    metaTitle: "Fehlertrainer",
    title: "Fehlertrainer",
    description:
      "Deine eigenen Fehler sind das beste Übungsmaterial. Jede falsche Antwort wird als kurze Lernkarte gespeichert und kommt wieder, bis du sie dreimal richtig hast.",
  },
  tabs: {
    review: (due) => `Wiederholen (${due} fällig)`,
    all: (open) => `Offene Fehler (${open})`,
  },
  start: {
    due: (n) => (n === 1 ? "Fehler ist fällig." : "Fehler sind fällig."),
    schedule: "Jeder Fehler kommt nach 1, 3, 7 und 16 Tagen wieder – bis du ihn dreimal hintereinander richtig hast.",
    button: "Wiederholung starten",
    nothingDue: "Gerade ist nichts fällig",
    noMistakes: "Noch keine Fehler",
    scheduled: (open, mastered) =>
      `${open === 1 ? "1 offener Fehler ist" : `${open} offene Fehler sind`} für später geplant. ${mastered} hast du schon sicher gelernt.`,
    howItWorks: "Falsche Antworten aus allen Übungen zu Lesen, Sprachbausteinen und Hören landen automatisch hier.",
  },
  session: {
    progress: (current, total, correct) => `${current} / ${total} · ${correct} richtig`,
    right: "Richtig!",
    correctIs: (answer) => `Richtige Lösung: ${answer}`,
    done: "Wiederholung fertig. Was du richtig hattest, kommt erst später wieder.",
  },
  list: {
    correct: (answer) => `Lösung: ${answer}`,
    streak: (n) => `Serie ${n}/3`,
    dueNow: "jetzt fällig",
    dueOn: (date) => `fällig am ${date}`,
    empty: "Keine offenen Fehler.",
  },
};
