import type { Messages } from "../en";

export const progress: Messages["progress"] = {
  page: {
    metaTitle: "Dein Fortschritt",
    title: "Fortschritt",
    description: "Wo du in jedem Prüfungsteil stehst – und ob du in der vorgegebenen Zeit fertig wirst.",
  },
  tiles: {
    totalTime: "Übungszeit insgesamt",
    exercises: "abgeschlossene Übungen",
    streakDays: (n) => (n === 1 ? "1 Tag" : `${n} Tage`),
    streak: "aktuelle Serie",
    words: "Wörter in deinen Karteikarten",
  },
  chart: {
    title: "Die letzten 4 Wochen",
    today: "Heute",
  },
  byPart: {
    title: "Nach Prüfungsteil",
    hint: "Durchschnitt deiner letzten fünf Versuche. Die Linie zeigt die Bestehensgrenze von 60 %.",
    attempts: (n) => (n === 1 ? "1 Versuch" : `${n} Versuche`),
    onTime: (percent) => `${percent} in der Zeit`,
  },
  recent: {
    title: "Zuletzt geübt",
    empty: "Noch keine Übungen.",
  },
  productive: {
    title: "Schreiben & Sprechen",
    empty: "Noch keine Schreib- oder Sprechübungen.",
  },
};
