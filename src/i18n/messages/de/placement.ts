import type { Messages } from "../en";

export const placement: Messages["placement"] = {
  metaTitle: "Einstufungstest",
  metaDescription: "Finde dein Deutschniveau in 20 Minuten heraus: Grammatik, Wortschatz, Lesen und Hören – mit einem Ergebnis für jede Fertigkeit.",
  title: "Einstufungstest",
  lead: (level) => `Vier kurze Teile zeigen, wo du auf dem Weg zu telc ${level} stehst – und was du zuerst üben solltest.`,
  skills: { grammatik: "Grammatik", wortschatz: "Wortschatz", lesen: "Lesen", hoeren: "Hören" },
  intro: {
    parts: (n) => `${n} Teile`,
    items: (n) => `${n} Aufgaben`,
    minutes: (n) => `${n} Minuten`,
    howTitle: "So funktioniert’s",
    how: [
      "Antworte in deinem Tempo – der Timer zeigt die empfohlenen 20 Minuten.",
      "Rate nicht wild: Ein ehrliches Ergebnis gibt dir den besten Plan.",
      "Die Hörtexte kannst du zweimal abspielen. Nimm am besten Kopfhörer.",
    ],
    start: "Einstufung starten",
    resume: "Einstufung fortsetzen",
    previous: (level) => `Letztes Ergebnis: ${level}`,
  },
  run: {
    part: (n, total) => `Teil ${n} von ${total}`,
    answered: (n, total) => `${n}/${total} beantwortet`,
    next: "Nächster Teil",
    back: "Vorheriger Teil",
    finish: "Abschließen und Niveau ansehen",
    finishEarly: "Jetzt abschließen",
    confirmTitle: "Einstufung abschließen?",
    confirmText: (open) => (open === 1 ? "1 Aufgabe ist noch offen – sie zählt als falsch." : `${open} Aufgaben sind noch offen – sie zählen als falsch.`),
    confirm: "Abschließen",
    cancel: "Weitermachen",
    play: "Abspielen",
    playAgain: "Noch einmal",
    playsLeft: (n) => (n === 1 ? "noch 1-mal" : `noch ${n}-mal`),
    noPlaysLeft: "Nicht mehr abspielbar",
    choose: "Wähle die richtige Antwort",
  },
  result: {
    title: "Dein Niveau",
    overall: "Gesamt",
    levels: {
      A1: "unter A2",
      A2: "A2",
      "B1-": "B1 (auf dem Weg)",
      B1: "B1",
      "B1+": "B1+",
      "B2-": "B2 (auf dem Weg)",
      B2: "B2",
      "B2+": "B2+",
      C1: "C1",
    },
    readiness: {
      ready: {
        title: "Bereit fürs Prüfungstraining",
        text: (level) => `Dein Niveau liegt bei etwa ${level}. Trainiere die Prüfungsteile mit echten Zeiten und mach bald einen Modelltest.`,
      },
      almost: {
        title: "Fast geschafft",
        text: (level) => `Du bist nah an ${level}. Mit etwa 6–10 Wochen gezieltem Üben erreichst du das Prüfungsniveau.`,
      },
      notYet: {
        title: "Erst die Grundlagen stärken",
        text: (level) =>
          level === "B2"
            ? "Festige zuerst deine B1-Grammatik und deinen B1-Wortschatz, dann die B2-Themen. Mit täglichem Üben plane etwa 3–6 Monate bis zur Prüfung ein."
            : "Festige zuerst deine A2/B1-Grundlagen. Mit täglichem Üben plane etwa 3–6 Monate bis zur Prüfung ein.",
      },
    },
    correct: (c, total) => `${c} von ${total} richtig`,
    nextSteps: "Deine nächsten Schritte",
    practise: (skill) => `${skill} üben`,
    grammarTopics: "Diese Grammatikthemen solltest du wiederholen",
    plan: "Meinen Lernplan erstellen",
    review: "Meine Antworten ansehen",
    hideReview: "Antworten ausblenden",
    retake: "Noch einmal machen",
    retakeHint: "Wiederhole die Einstufung nach ein paar Wochen, um deinen Fortschritt zu sehen.",
    yourAnswer: "Deine Antwort",
    noAnswer: "Keine Antwort",
    disclaimer: "Die Einstufung ist eine Schätzung auf Basis von 39 Aufgaben, kein offizielles telc-Ergebnis.",
  },
};
