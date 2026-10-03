import type { Messages } from "../en";

/** Zahlwörter im Fließtext („Drei Kriterien“). */
const WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
const word = (n: number) => WORDS[n] ?? String(n);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const times = (n: number) => (n === 1 ? "einmal" : n === 2 ? "zweimal" : `${n}-mal`);
const tasks = (n: number) => (n === 1 ? "1 Aufgabe" : `${n} Aufgaben`);

export const exam: Messages["exam"] = {
  percent: (n) => `${n} %`,

  overview: {
    metaTitle: (name) => `${name} – Aufbau, Bewertung und Bestehensgrenzen`,
    takeMock: "Modelltest machen",
    practiseByPart: "Teile einzeln üben",
    facts: {
      total: (n) => `${n} Punkte`,
      totalSplit: (written, oral) => `${written} schriftlich + ${oral} mündlich`,
      writtenPass: (percent) => `zum Bestehen der schriftlichen Prüfung (${percent})`,
      oralPass: (percent) => `zum Bestehen der mündlichen Prüfung (${percent})`,
      time: (written, oral) => `${written} + ${oral} Min.`,
      timeSplit: (prep) => `schriftlich + mündlich (dazu ${prep} Min. Vorbereitung)`,
    },
    structure: {
      title: "Aufbau der Prüfung",
      text: "Alle Teile – genau wie in der echten Prüfung. Klick auf einen Teil, um ihn zu üben.",
      written: (minutes) => `Schriftliche Prüfung · ${minutes} Minuten`,
      oral: (minutes) => `Mündliche Prüfung · ca. ${minutes} Minuten zu zweit`,
      sectionPoints: (n) => `${n} Punkte`,
      sharedTime: (minutes) => `${minutes} Min. (gemeinsamer Block)`,
      task: "Aufgabe",
      items: tasks,
      plays: (n) => `${n}× hören`,
      about: (minutes) => `ca. ${minutes} Min.`,
    },
    grades: {
      title: "Noten",
      text: "Du musst beide Teile einzeln bestehen. Dann werden die Punkte aus beiden Teilen zusammengezählt.",
    },
    writing: {
      title: "So wird Schreiben bewertet",
      scale: (criteria, bands, multiplier, max) =>
        `${criteria === 1 ? "Ein Kriterium" : `${capitalize(word(criteria))} Kriterien`}: ${bands}. Die Summe × ${multiplier} ergibt max. ${max} Punkte.`,
      link: "Schreiben üben – mit KI-Feedback →",
    },
    speaking: {
      title: "So wird Sprechen bewertet",
      scale: (criteria) => `Jeder Teil wird nach ${criteria === 1 ? "einem Kriterium" : `${word(criteria)} Kriterien`} bewertet.`,
      partMax: (teile, max, each) => `Teil ${teile}: ${each ? "je " : ""}max. ${max} Punkte`,
      link: "Sprechen üben – mit KI als Gesprächspartner →",
    },
  },

  section: {
    fallbackTitle: "Prüfungsteil",
    pointsShare: (percent) => `Punkte · ${percent} der Gesamtpunkte`,
    passMark: "Bestehensgrenze:",
    passMarkRest: "der gesamten schriftlichen Prüfung",
  },

  part: {
    practiceSets: "Übungssätze",
    instruction: "Aufgabenstellung",
  },

  strategies: {
    metaTitle: "Prüfungsstrategien für jeden Teil",
    metaDescription: (exam) => `Wie du jeden Teil von ${exam} angehst, deine Zeit gut einteilst und typische Fallen vermeidest.`,
    title: "Strategien",
    description:
      "Punkte holst du mit der richtigen Technik genauso wie mit gutem Deutsch. Lies die Anleitung zu einem Teil, bevor du ihn übst. Dann setz einen Schritt nach dem anderen um.",
    practisePart: "Diesen Teil üben →",
    whatIsTested: "Was geprüft wird:",
    traps: "Fallen",
  },

  partCards: {
    items: tasks,
    points: (n) => `${n} Punkte`,
    heard: (n) => `${times(n)} hören`,
    continue: "Weiter üben",
    start: "Jetzt üben",
  },

  setGrid: {
    empty: "Neue Übungssätze für diesen Teil sind in Vorbereitung.",
    practised: (total) => `von ${total} ${total === 1 ? "Übungssatz" : "Übungssätzen"} geübt`,
  },

  partFacts: {
    itemsValue: (n, first, last) => `${n} (Nr. ${first}–${last})`,
    pointsValue: (max, perItem) => `${max} (${perItem} pro Aufgabe)`,
    recording: "Aufnahme",
    played: (n) => `läuft ${times(n)}`,
    time: "Empfohlene Zeit",
    share: "Gewichtung",
  },

  strategyCard: {
    title: "So gehst du vor",
    traps: "Typische Fallen",
    checklist: "Checkliste",
    all: "Alle Strategien →",
  },

  predicted: {
    emptyTitle: "Deine Punkteprognose",
    emptyText:
      "Mach ein paar Übungssätze. Dann schätzen wir aus deinen letzten Ergebnissen in jedem Teil, wie viele Punkte du in der schriftlichen Prüfung bekommst.",
    title: "Prognose: schriftliche Prüfung",
    onTrack: "Auf Kurs zum Bestehen",
    below: "Unter der Bestehensgrenze",
    outOf: (max) => `/ ${max} Punkte`,
    basedOn: (percent) => `Basiert auf ${percent} der schriftlichen Prüfung`,
    pass: (points) => `bestanden ab ${points}`,
    gradeLead: "Wenn dein Sprechen genauso gut ist, wäre das etwa",
    gradeRest: "Für ein sicheres Ergebnis mach einen ganzen Modelltest.",
    takeMock: "Modelltest machen",
  },

  pageHeader: {
    breadcrumb: "Navigationspfad",
  },
};
