import type { Messages } from "../en";

export const settings: Messages["settings"] = {
  page: {
    metaTitle: "Einstellungen",
    title: "Einstellungen",
    description: "Sprache, Zeit, Stimmen, Ziele und deine Daten.",
  },
  language: {
    title: "Sprache / Language",
    hint: "Menüs, Buttons und Erklärungen erscheinen in dieser Sprache. Prüfungstexte und Aufgaben bleiben immer auf Deutsch.",
    showEnglish: "Englische Übersetzungen anzeigen",
    showEnglishHint: "Zeigt bei Wörtern und Beispielsätzen gleich die englische Übersetzung.",
  },
  timing: {
    title: "Zeit in der Prüfung",
    strict: "Strenges Zeitlimit",
    strictHint:
      "Bei 0:00 wird automatisch abgegeben, und Hören läuft ohne Unterbrechung wie in der echten Prüfung. Schalte es aus, wenn du nach Ablauf der Zeit weiterarbeiten willst (die zusätzliche Zeit wird gespeichert).",
  },
  goals: {
    title: "Ziele",
    examDate: "Prüfungsdatum",
    examDateHint: "Für den Countdown und deinen Lernplan.",
    daily: "Tagesziel",
    dailyHint: "Übungsminuten pro Tag.",
  },
  voices: {
    title: "Stimmen für die Höraufgaben",
    none: "Keine deutschen Stimmen gefunden. Installiere eine Stimme in deinem Betriebssystem (macOS: Systemeinstellungen → Bedienungshilfen → Gesprochene Inhalte → Systemstimme → Stimmen verwalten; Windows: Einstellungen → Zeit und Sprache → Spracherkennung) und lade die Seite neu. Chrome und Edge bieten auch gute Online-Stimmen.",
    female: "Weibliche Stimmen",
    male: "Männliche Stimmen",
    auto: "Automatisch (beste Stimme)",
    online: "online",
    test: "Stimme testen",
    rate: (rate) => `Sprechtempo · ${rate}×`,
    rateHint: "In der echten Prüfung wird in normalem Tempo gesprochen – übe vor der Prüfung mit 1,0×.",
  },
  data: {
    title: "Deine Daten",
    hint: "Dein Fortschritt wird nur in diesem Browser gespeichert. Exportiere ihn regelmäßig oder wenn du auf ein anderes Gerät wechselst.",
    export: "Fortschritt exportieren",
    import: "Importieren",
    reset: "Alles zurücksetzen",
    resetTitle: "Gesamten Fortschritt löschen?",
    resetText: "Versuche, Fehler, Texte, Karteikarten und Serien werden aus diesem Browser gelöscht. Exportiere vorher, wenn du eine Sicherung möchtest.",
    delete: "Löschen",
    imported: "Fortschritt importiert",
    deleted: "Gesamter Fortschritt gelöscht",
    notExport: "Das ist keine Exportdatei von Bestanden.",
    unreadable: "Die Datei konnte nicht gelesen werden.",
  },
};
