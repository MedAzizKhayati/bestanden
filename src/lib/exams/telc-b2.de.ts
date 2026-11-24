import type { ExamTranslation } from "./localize";

/** German texts for the German UI. Official names and instructions in telc-b2.ts are already German. */
export const telcB2De: ExamTranslation = {
  description:
    "Das allgemeine Zertifikat für die obere Mittelstufe: Es zeigt, dass du auf Deutsch arbeiten, eine Ausbildung machen, studieren und mitdiskutieren kannst – verlangt von vielen Arbeitgebern, Ausbildungsbetrieben und Hochschulen.",
  sections: {
    lesen: {
      description: "Drei Leseaufgaben mit längeren, dichteren Texten: Globalverstehen, Detailverstehen und gezieltes Suchen in zwölf Info-Texten.",
      timeNote: "Leseverstehen und Sprachbausteine teilen sich einen Block von 90 Minuten.",
    },
    sprachbausteine: {
      description: "Grammatik und Wortschatz im Kontext: ein Brief mit zehn Lücken und ein Zeitschriftenartikel mit Wortkasten.",
      timeNote: "Teilt sich den 90-Minuten-Block mit dem Leseverstehen.",
    },
    hoeren: {
      description: "Eine Nachrichtensendung im Radio, ein Rundfunkinterview und fünf Ansagen – du hörst jeden Text nur einmal.",
      timeNote: "In der echten Prüfung läuft die Aufnahme ohne Unterbrechung, und du hörst jeden Text nur einmal.",
    },
    schreiben: {
      description: "Eine halbformelle E-Mail als Antwort auf eine Anzeige – du wählst zwischen zwei Aufgaben (Aufgabe A oder B).",
      timeNote: "Die 30 Minuten schließen die Wahl zwischen Aufgabe A und B ein – entscheide dich schnell.",
    },
    sprechen: {
      description: "Eine Paarprüfung mit drei bewerteten Teilen: über eine Erfahrung sprechen, diskutieren und gemeinsam planen.",
      timeNote: "Dazu kommen 20 Minuten Vorbereitung für Teil 2 und 3 – Teil 1 bereitest du zu Hause vor.",
    },
  },
  parts: {
    "lesen-1":
      "Fünf Pressetexte mit 150–200 Wörtern aus zwei Themenbereichen und zehn Überschriften. Weil die Texte ein Thema teilen, wirken mehrere Überschriften passend – nur eine fasst den ganzen Text zusammen.",
    "lesen-2":
      "Ein anspruchsvoller Artikel mit 500–600 Wörtern im Nominalstil – ein Trend, eine Studie, eine Debatte. Fünf Aufgaben in der Reihenfolge des Textes; die Antworten geben den Text mit anderen Worten wieder.",
    "lesen-3":
      "Zehn kurze Situationen und zwölf Info-Texte mit etwa 80–100 Wörtern (Kurse, Angebote, Dienstleistungen, Broschüren). Suche die eine Bedingung, die entscheidet – rund 1000 Wörter in 20 Minuten.",
    "sprachbausteine-1":
      "Ein persönlicher oder halbformeller Brief mit etwa 250 Wörtern und zehn Lücken. Vor allem Grammatik – Konnektoren, Relativ- und Präpositionalformen, Verbformen, Pronomen – und etwas Wortwahl.",
    "sprachbausteine-2":
      "Ein Zeitungs- oder Zeitschriftenartikel mit etwa 300 Wörtern, zehn Lücken und fünfzehn Wörtern. Feste Präpositionen, Kollokationen und Konnektoren entscheiden.",
    "hoeren-1":
      "Eine Nachrichtensendung im Radio mit sechs Meldungen – Politik, Wirtschaft, Gesellschaft, Kultur, Sport, Wetter. Nur zu fünf gibt es eine Aussage: Finde zuerst heraus, zu welcher Meldung eine Aussage gehört.",
    "hoeren-2":
      "Ein Rundfunkinterview von sechs bis sieben Minuten mit spontaner, manchmal regional gefärbter Sprache. Die zehn Aussagen geben das Gesagte mit anderen Worten wieder, in der Reihenfolge der Aufnahme – du hörst alles nur einmal.",
    "hoeren-3":
      "Mailbox- und Servicenachrichten, Tipps im Radio, Verkehr und Wetter, Durchsagen. Jeder Text beginnt mit einer kurzen Einführung; die Aussage prüft ein Detail – du hörst ihn nur einmal.",
    schreiben:
      "Eine Bitte um Informationen, eine Beschwerde, eine Anfrage oder eine Bewerbung an eine Firma oder ein Amt. Bewertet werden die Aufgabenbewältigung (drei Punkte, jeder in mehr als einem Satz), die kommunikative Gestaltung und die formale Richtigkeit.",
    "sprechen-1":
      "Wähle eines von sieben Themen (zu Hause vorbereitet), sprich etwa 1½ Minuten darüber und beantworte dann die Fragen deines Gegenübers – und stell selbst Fragen zu seinem Beitrag.",
    "sprechen-2":
      "Ihr lest beide denselben Artikel zu einem kontroversen Thema. Fasse ihn kurz zusammen (höchstens eine Minute), dann argumentiert ihr, widersprecht, räumt ein und wägt ab – eine echte Diskussion, keine zwei Monologe.",
    "sprechen-3":
      "Organisiert nach einer kurzen Aufgabenbeschreibung eine Veranstaltung, eine Reise, ein Fest oder ein Projekt – ohne Checkliste auf dem Blatt. Bring eigene Ideen ein, reagiere, verhandle und einigt euch auf ein Konzept.",
  },
  writingRubric: {
    criteria: {
      I: {
        assesses: [
          "Werden drei Leitpunkte (oder zwei und ein eigener Aspekt zur Situation) angemessen auf B2-Niveau behandelt?",
          "Wird die eigene Position differenziert und passend zur Leserin oder zum Leser dargestellt?",
        ],
        bands: {
          A: "Die Aufgabe ist voll erfüllt: Drei Leitpunkte (oder zwei und ein eigener Aspekt) sind angemessen auf B2-Niveau behandelt.",
          B: "Die Aufgabe ist weitgehend erfüllt: Zwei Leitpunkte (oder einer und ein eigener Aspekt) sind angemessen behandelt.",
          C: "Die Aufgabe ist nur teilweise erfüllt: Ein Leitpunkt oder ein eigener Aspekt ist angemessen behandelt.",
          D: "Die Aufgabe ist nicht erfüllt: Kein Leitpunkt ist angemessen behandelt.",
        },
      },
      II: {
        assesses: [
          "Register passend zu einer halbformellen E-Mail, durchgehend eingehalten",
          "Spektrum an Wortschatz und Strukturen, abwechslungsreiche Formulierungen",
          "Textlogik und verschiedene Verknüpfungsmittel",
          "Merkmale der Textsorte: Betreff, Anrede, Grußformel",
        ],
        bands: {
          A: "Oberes B2: überzeugend und klar im formellen Stil; breites Spektrum, abwechslungsreiche Formulierungen; verschiedene Konnektoren machen die Logik deutlich.",
          B: "B2: klar und angemessen; ausreichend breites Spektrum mit einigen Lücken; eine begrenzte Zahl von Konnektoren ergibt einen klaren, zusammenhängenden Text.",
          C: "B1: kann über vertraute Themen schreiben; genug sprachliche Mittel, um zurechtzukommen; einfache Elemente linear aneinandergereiht.",
          D: "A2 oder darunter: elementare Sprachfunktionen und Wendungen, nur die häufigsten Konnektoren.",
        },
      },
      III: {
        assesses: ["Grammatik (Satzbau, Formen)", "Rechtschreibung und Zeichensetzung"],
        bands: {
          A: "Gute Beherrschung der Grammatik; keine systematischen Fehler, nur gelegentliche Ausrutscher; Rechtschreibung und Zeichensetzung weitgehend korrekt.",
          B: "Recht gute Beherrschung; wenige systematische Fehler, die das Verständnis nicht gefährden; Rechtschreibung hinreichend korrekt.",
          C: "Ausreichende Beherrschung trotz deutlicher Einflüsse der Erstsprache; mehrere systematische Fehler, die Bedeutung bleibt aber überwiegend klar.",
          D: "Einige einfache Strukturen sind richtig, aber viele elementare Fehler (Zeitformen, Subjekt-Verb-Kongruenz); oft phonetische Schreibung.",
        },
      },
    },
    notes: [
      "Ein Leitpunkt oder ein eigener Aspekt zählt nur, wenn er in mehr als einem Satz ausgeführt wird – ein einziges Satzgefüge reicht nicht.",
      "Wer Inhalt oder Sprache vereinfacht, wird abgewertet: B2 erwartet eine differenzierte Position, die zur Leserin oder zum Leser passt.",
      "Ein Text zum falschen Thema bekommt in allen Kriterien ein D. Bei einer falschen Situation (z. B. eine Bewerbung statt einer Bitte um Informationen) bekommt nur Kriterium I ein D.",
      "Kein A in Kriterium II, wenn Betreff, Anrede oder Grußformel fehlen; kein B, wenn das Register falsch ist oder schwankt, der Wortschatz unter B2 liegt oder die Punkte unverbunden aufgezählt werden.",
      "Absender, Empfänger und Datum brauchst du nicht – es ist eine E-Mail.",
    ],
  },
  speakingRubric: {
    criteria: {
      ausdruck: {
        assesses: ["Ausdruck passend zu Inhalt und Rolle", "Sprachliche Vielfalt", "Umsetzung der Sprechabsicht"],
        descriptors: { A: "voll angemessen", B: "im Großen und Ganzen angemessen", C: "kaum noch akzeptabel", D: "durchgehend nicht ausreichend" },
      },
      aufgabe: {
        assesses: ["Beteiligung am Gespräch", "Diskurs- und Kompensationsstrategien", "Flüssigkeit"],
        descriptors: { A: "voll angemessen", B: "im Großen und Ganzen angemessen", C: "kaum noch akzeptabel", D: "durchgehend nicht ausreichend" },
      },
      richtigkeit: {
        assesses: ["Satzbau und Formen"],
        descriptors: {
          A: "keine oder nur sehr vereinzelte Fehler",
          B: "wenige Fehler, die die Sprechabsicht nicht beeinträchtigen",
          C: "viele Fehler, die die Sprechabsicht erheblich beeinträchtigen",
          D: "so viele Fehler, dass das Verständnis nicht mehr möglich ist",
        },
      },
      aussprache: {
        assesses: ["Abweichungen von der gesprochenen Standardsprache"],
        descriptors: {
          A: "keine wesentlichen Abweichungen",
          B: "Abweichungen, die die Verständlichkeit nicht beeinträchtigen",
          C: "stärkere Abweichungen, die das Verstehen erschweren",
          D: "starke Abweichungen, die das Verstehen erheblich erschweren und stellenweise unmöglich machen",
        },
      },
    },
  },
};
