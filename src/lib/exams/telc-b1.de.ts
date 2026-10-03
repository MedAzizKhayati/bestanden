import type { ExamTranslation } from "./localize";

/** German texts for the German UI. Official names and instructions in telc-b1.ts are already German. */
export const telcB1De: ExamTranslation = {
  description:
    "Das meistgewählte B1-Zertifikat in Deutschland – anerkannt für Einbürgerung, Niederlassungserlaubnis, Beruf und Studienvorbereitung.",
  sections: {
    lesen: {
      description: "Drei Leseaufgaben: Globalverstehen, Detailverstehen und gezieltes Suchen nach Informationen.",
      timeNote: "Leseverstehen und Sprachbausteine teilen sich einen Block von 90 Minuten.",
    },
    sprachbausteine: {
      description: "Grammatik und Wortschatz im Kontext: zwei Lückentexte.",
      timeNote: "Teilt sich den 90-Minuten-Block mit dem Leseverstehen.",
    },
    hoeren: {
      description: "Umfragen im Radio, ein Interview und Durchsagen aus dem Alltag – richtig oder falsch?",
      timeNote: "In der echten Prüfung läuft die Aufnahme ohne Unterbrechung.",
    },
    schreiben: { description: "Eine informelle oder halbformelle E-Mail zu vier Leitpunkten." },
    sprechen: {
      description: "Ein Gespräch zu zweit in drei Teilen, nach 20 Minuten Vorbereitung.",
      timeNote: "Dazu kommen 20 Minuten Vorbereitungszeit, in der du Notizen machen darfst.",
    },
  },
  parts: {
    "lesen-1":
      "Fünf kurze Pressetexte und zehn Überschriften. Du musst die Hauptaussage jedes Textes verstehen – fünf Überschriften sind Fallen mit denselben Wörtern.",
    "lesen-2": "Ein längerer Zeitungs- oder Zeitschriftenartikel mit fünf Multiple-Choice-Aufgaben. Sie folgen der Reihenfolge des Textes.",
    "lesen-3":
      "Zehn Alltagssituationen und zwölf Kleinanzeigen. Suche das entscheidende Detail – und erkenne die Situationen, zu denen keine Anzeige passt.",
    "sprachbausteine-1":
      "Ein Brief oder eine E-Mail mit zehn Lücken. Jede Lücke prüft einen Grammatikpunkt: Endungen, Präpositionen, Konnektoren, Verbformen, Pronomen.",
    "sprachbausteine-2":
      "Ein Text mit zehn Lücken und fünfzehn Wörtern. Fünf Wörter bleiben übrig – feste Verbindungen und Präpositionen entscheiden.",
    "hoeren-1":
      "Fünf Personen sagen ihre Meinung zu einem Thema (wie bei einer Straßenumfrage im Radio). Du hörst alles nur einmal – es geht um die Gesamtmeinung der Person.",
    "hoeren-2": "Ein Radiointerview oder Gespräch von etwa vier Minuten. Die zehn Aussagen folgen der Reihenfolge der Aufnahme.",
    "hoeren-3":
      "Durchsagen, Nachrichten auf dem Anrufbeantworter, Tipps im Radio und Wetterberichte. Achte auf ein genaues Detail: eine Uhrzeit, einen Ort, einen Preis, eine Anweisung.",
    schreiben:
      "Bewertet werden die Aufgabenbewältigung (die vier Leitpunkte), die kommunikative Gestaltung (Aufbau, Konnektoren, Register) und die formale Richtigkeit.",
    "sprechen-1": "Stell dich vor und stell deinem Gegenüber Fragen – ein natürliches Gespräch, in dem beide fragen und antworten.",
    "sprechen-2":
      "Jede Person hat ein anderes Meinungsblatt zum selben Thema. Du stellst die Meinung vor, dann diskutiert ihr, vergleicht und erzählt von eigenen Erfahrungen.",
    "sprechen-3":
      "Ihr plant zu zweit mit einer Checkliste eine Veranstaltung oder einen Ausflug. Bewertet wird, wie du Vorschläge machst, zustimmst, höflich widersprichst und wie ihr euch einigt.",
  },
  writingRubric: {
    criteria: {
      I: {
        assesses: ["Werden alle vier Leitpunkte angemessen behandelt?"],
        bands: {
          A: "Alle vier Leitpunkte sind angemessen behandelt.",
          B: "Drei Leitpunkte sind angemessen behandelt.",
          C: "Zwei Leitpunkte sind angemessen behandelt.",
          D: "Nur ein oder kein Leitpunkt ist behandelt.",
        },
      },
      II: {
        assesses: [
          "Sinnvolle Reihenfolge der Leitpunkte",
          "Verknüpfung der Sätze (Konnektoren, Verweise)",
          "Register und Ausdruck passend zur Leserin oder zum Leser",
          "Merkmale der Textsorte: Anrede, Einleitung, Schluss, Grußformel",
        ],
        bands: {
          A: "Oberes B1: viele gängige Wendungen, klar verknüpft, einheitliches Register.",
          B: "B1: ausreichend viele Wendungen; kurze Teile sind zu einem zusammenhängenden Text verbunden.",
          C: "A2: einfache Wendungen, nur einfache Konnektoren (und, aber, weil).",
          D: "A1 oder darunter: einzelne Wörter und feste Formeln.",
        },
      },
      III: {
        assesses: [
          "Grammatik (Satzbau, Formen)",
          "Rechtschreibung und Zeichensetzung",
          "Fehler zählen danach, wie stark sie das Verstehen stören",
        ],
        bands: {
          A: "Gute Beherrschung; gelegentlich systematische Fehler, die Bedeutung ist immer klar.",
          B: "Ausreichende Beherrschung; systematische Fehler, die Bedeutung ist meistens klar.",
          C: "Einfache Strukturen sind richtig, aber es gibt elementare Fehler (Zeiten, Kongruenz).",
          D: "Sehr geringe Beherrschung; der Text ist nur teilweise verständlich.",
        },
      },
    },
    notes: [
      "Ein Leitpunkt zählt, wenn er sinnvoll behandelt wird – auch in einem kurzen Satz oder zusammen mit einem anderen Punkt in einem Satz.",
      "Ein Text zum falschen Thema bekommt in allen Kriterien ein D. Bei einer falschen Situation (z. B. eine Einladung schreiben statt eine Einladung annehmen) bekommt nur Kriterium I ein D.",
      "Kein A in Kriterium II, wenn Anrede oder Schluss fehlen, das Register falsch oder gemischt ist (du/Sie), die Punkte unverbunden nebeneinanderstehen oder die meisten Sätze mit „Ich“ oder „Wir“ beginnen.",
      "Verständlichkeit zuerst: Fehler bei Endungen und beim Genus wiegen weniger als Fehler bei der Verbform oder der Wortstellung.",
    ],
  },
  speakingRubric: {
    criteria: {
      ausdruck: {
        assesses: ["Ausdruck passend zu Inhalt und Rolle", "Wortschatz", "Umsetzung der Sprechabsicht"],
        descriptors: { A: "voll angemessen", B: "im Großen und Ganzen angemessen", C: "gerade noch akzeptabel", D: "durchgehend nicht ausreichend" },
      },
      aufgabe: {
        assesses: ["Beteiligung am Gespräch", "Gesprächs- und Ausweichstrategien", "Flüssigkeit"],
        descriptors: { A: "voll angemessen", B: "im Großen und Ganzen angemessen", C: "gerade noch akzeptabel", D: "durchgehend nicht ausreichend" },
      },
      richtigkeit: {
        assesses: ["Satzbau und Formen"],
        descriptors: {
          A: "keine oder nur vereinzelte Fehler",
          B: "Fehler, die das Verstehen nicht beeinträchtigen",
          C: "Fehler an wichtigen Stellen, die das Verstehen stark beeinträchtigen",
          D: "so viele Fehler, dass die Kommunikation zusammenbricht",
        },
      },
      aussprache: {
        assesses: ["Abweichungen in Aussprache und Intonation"],
        descriptors: {
          A: "beeinträchtigen das Verstehen nicht",
          B: "erschweren das Verstehen manchmal",
          C: "erschweren das Verstehen erheblich",
          D: "machen das Verstehen (fast) unmöglich",
        },
      },
    },
  },
};
