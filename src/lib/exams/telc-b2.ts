import type { ExamDefinition } from "./types";

/**
 * telc Deutsch B2, format of the revised 2019 edition.
 * Sources: telc Deutsch B2 Übungstest 1 (überarbeitete Auflage 2019) and Handbuch telc Deutsch B2 (2019) –
 * item counts, points, timing, play counts and rubrics. Differences to B1 worth knowing:
 * every Hören text is heard only once, Hören Teil 1 is a news bulletin with six reports for five statements,
 * Schreiben offers two tasks (cover three of four points, at least 150 words) and every Sprechen part is worth 25 points.
 */
export const telcB2: ExamDefinition = {
  id: "telc-b2",
  slug: "telc-b2",
  name: "telc Deutsch B2",
  level: "B2",
  studyLevels: ["B2", "B1"],
  description:
    "The general upper-intermediate certificate: proof that you can work, train and study in German and hold your own in discussions – asked for by many employers, training programmes and universities.",
  written: { maxPoints: 225, passPoints: 135, minutes: 140 },
  oral: { maxPoints: 75, passPoints: 45, minutes: 15, prepMinutes: 20 },
  totalPoints: 300,
  grades: [
    { min: 270, label: "sehr gut", labelEn: "very good" },
    { min: 240, label: "gut", labelEn: "good" },
    { min: 210, label: "befriedigend", labelEn: "satisfactory" },
    { min: 180, label: "ausreichend", labelEn: "sufficient" },
    { min: 0, label: "nicht bestanden", labelEn: "not passed" },
  ],
  sections: [
    {
      id: "lesen",
      name: "Leseverstehen",
      short: "Lesen",
      nameEn: "Reading",
      description: "Three reading tasks on longer, denser texts: gist, detail and scanning twelve info texts.",
      maxPoints: 75,
      minutes: 90,
      timeNote: "Lesen and Sprachbausteine share one 90-minute block.",
      parts: [
        {
          id: "lesen-1",
          sectionId: "lesen",
          slug: "teil-1",
          teil: 1,
          name: "Globalverstehen",
          nameEn: "Reading for gist",
          setType: "headline-matching",
          items: 5,
          firstItem: 1,
          pointsPerItem: 5,
          maxPoints: 25,
          minutes: 15,
          instruction:
            "Lesen Sie zuerst die zehn Überschriften. Lesen Sie dann die fünf Texte und entscheiden Sie, welche Überschrift (a–j) am besten zu welchem Text (1–5) passt.",
          instructionEn:
            "First read the ten headlines. Then read the five texts and decide which headline (a–j) fits each text (1–5) best.",
          description:
            "Five press texts of 150–200 words from two topic areas and ten headlines. Because the texts share a topic, several headlines look right – only one sums up the whole text.",
        },
        {
          id: "lesen-2",
          sectionId: "lesen",
          slug: "teil-2",
          teil: 2,
          name: "Detailverstehen",
          nameEn: "Reading for detail",
          setType: "text-mc",
          items: 5,
          firstItem: 6,
          pointsPerItem: 5,
          maxPoints: 25,
          minutes: 20,
          instruction:
            "Lesen Sie zuerst den Text und lösen Sie dann die Aufgaben 6–10. Entscheiden Sie, welche Lösung (a, b oder c) richtig ist.",
          instructionEn: "First read the text, then solve tasks 6–10. Decide which answer (a, b or c) is correct.",
          description:
            "A demanding article of 500–600 words in Nominalstil – a trend, a study, a debate. Five questions in text order; the options paraphrase the text instead of quoting it.",
        },
        {
          id: "lesen-3",
          sectionId: "lesen",
          slug: "teil-3",
          teil: 3,
          name: "Selektives Verstehen",
          nameEn: "Scanning",
          setType: "ad-matching",
          items: 10,
          firstItem: 11,
          pointsPerItem: 2.5,
          maxPoints: 25,
          minutes: 20,
          instruction:
            "Lesen Sie zuerst die zehn Situationen (11–20) und dann die zwölf Info-Texte (a–l). Welcher Info-Text passt zu welcher Situation? Sie können jeden Info-Text nur einmal verwenden. Manchmal gibt es keine Lösung. Markieren Sie dann x.",
          instructionEn:
            "First read the ten situations (11–20), then the twelve info texts (a–l). Which info text fits which situation? Each info text can be used only once. Sometimes there is no solution – then mark x.",
          description:
            "Ten one-line situations and twelve info texts of about 80–100 words (courses, offers, services, brochures). Scan for the one condition that decides – about 1,000 words in 20 minutes.",
        },
      ],
    },
    {
      id: "sprachbausteine",
      name: "Sprachbausteine",
      short: "Sprachbausteine",
      nameEn: "Language elements",
      description: "Grammar and vocabulary in context: a letter with ten gaps and a magazine article with a word box.",
      maxPoints: 30,
      minutes: 90,
      timeNote: "Shares the 90-minute block with Leseverstehen.",
      parts: [
        {
          id: "sprachbausteine-1",
          sectionId: "sprachbausteine",
          slug: "teil-1",
          teil: 1,
          name: "Grammatik",
          nameEn: "Grammar",
          setType: "gap-mc",
          items: 10,
          firstItem: 21,
          pointsPerItem: 1.5,
          maxPoints: 15,
          minutes: 15,
          instruction:
            "Lesen Sie den folgenden Text und entscheiden Sie, welches Wort (a, b oder c) in die jeweilige Lücke passt.",
          instructionEn: "Read the text and decide which word (a, b or c) fits each gap.",
          description:
            "A personal or semi-formal letter of about 250 words with ten gaps. Mostly grammar – connectors, relative and prepositional forms, verb forms, pronouns – plus some word choice.",
        },
        {
          id: "sprachbausteine-2",
          sectionId: "sprachbausteine",
          slug: "teil-2",
          teil: 2,
          name: "Lexik",
          nameEn: "Vocabulary",
          setType: "gap-wordbank",
          items: 10,
          firstItem: 31,
          pointsPerItem: 1.5,
          maxPoints: 15,
          minutes: 20,
          instruction:
            "Lesen Sie den folgenden Text und entscheiden Sie, welches Wort aus dem Kasten (a–o) in die Lücken 31–40 passt. Sie können jedes Wort im Kasten nur einmal verwenden. Nicht alle Wörter passen in den Text.",
          instructionEn:
            "Read the text and decide which word from the box (a–o) fits gaps 31–40. Each word can be used only once. Not all words fit the text.",
          description:
            "A newspaper or magazine article of about 300 words with ten gaps and fifteen words. Fixed prepositions, collocations and connectors decide.",
        },
      ],
    },
    {
      id: "hoeren",
      name: "Hörverstehen",
      short: "Hören",
      nameEn: "Listening",
      description: "A radio news bulletin, a radio interview and five announcements – every text is heard only once.",
      maxPoints: 75,
      minutes: 20,
      timeNote: "The recording runs without interruption in the real exam, and you hear every text only once.",
      parts: [
        {
          id: "hoeren-1",
          sectionId: "hoeren",
          slug: "teil-1",
          teil: 1,
          name: "Globalverstehen",
          nameEn: "Listening for gist",
          setType: "audio-short",
          items: 5,
          firstItem: 41,
          pointsPerItem: 5,
          maxPoints: 25,
          minutes: 6,
          instruction:
            "Sie hören nun eine Nachrichtensendung. Dazu sollen Sie fünf Aufgaben lösen. Sie hören die Nachrichtensendung nur einmal. Entscheiden Sie beim Hören, ob die Aussagen 41–45 richtig oder falsch sind. Lesen Sie jetzt die Aufgaben 41–45. Sie haben dazu 30 Sekunden Zeit.",
          instructionEn:
            "You will hear a news bulletin and solve five tasks. You hear it ONLY ONCE. Decide while listening whether statements 41–45 are true or false. You have 30 seconds to read them first.",
          description:
            "A radio news bulletin with six reports – politics, economy, society, culture, sport, weather. Only five have a statement, so first work out which report a statement belongs to.",
          audio: {
            plays: 1,
            readingSeconds: 30,
            repeatPauseSeconds: 0,
            itemPauseSeconds: 5,
            answerSeconds: 15,
            perItem: false,
          },
        },
        {
          id: "hoeren-2",
          sectionId: "hoeren",
          slug: "teil-2",
          teil: 2,
          name: "Detailverstehen",
          nameEn: "Listening for detail",
          setType: "audio-long",
          items: 10,
          firstItem: 46,
          pointsPerItem: 2.5,
          maxPoints: 25,
          minutes: 8,
          instruction:
            "Sie hören nun ein Rundfunkinterview. Dazu sollen Sie zehn Aufgaben lösen. Sie hören dieses Interview nur einmal. Entscheiden Sie beim Hören, ob die Aussagen 46–55 richtig oder falsch sind. Lesen Sie jetzt die Aufgaben 46–55. Sie haben dazu 60 Sekunden Zeit.",
          instructionEn:
            "You will hear a radio interview and solve ten tasks. You hear it ONLY ONCE. Decide while listening whether statements 46–55 are true or false. You have 60 seconds to read them first.",
          description:
            "A radio interview of six to seven minutes with spontaneous, sometimes regional speech. Ten statements paraphrase what is said, in the order of the recording – heard only once.",
          audio: {
            plays: 1,
            readingSeconds: 60,
            repeatPauseSeconds: 0,
            itemPauseSeconds: 0,
            answerSeconds: 30,
            perItem: false,
          },
        },
        {
          id: "hoeren-3",
          sectionId: "hoeren",
          slug: "teil-3",
          teil: 3,
          name: "Selektives Verstehen",
          nameEn: "Listening for specific information",
          setType: "audio-short",
          items: 5,
          firstItem: 56,
          pointsPerItem: 5,
          maxPoints: 25,
          minutes: 6,
          instruction:
            "Sie hören jetzt fünf kurze Texte. Dazu sollen Sie fünf Aufgaben lösen. Sie hören diese Ansagen nur einmal. Entscheiden Sie beim Hören, ob die Aussagen 56–60 richtig oder falsch sind.",
          instructionEn:
            "You will hear five short texts and solve five tasks. You hear these announcements ONLY ONCE. Decide while listening whether statements 56–60 are true or false.",
          description:
            "Voicemail and service messages, radio tips, traffic and weather, announcements. Each starts with a short context; the statement tests one detail – heard only once.",
          audio: {
            plays: 1,
            readingSeconds: 10,
            repeatPauseSeconds: 0,
            itemPauseSeconds: 10,
            answerSeconds: 10,
            perItem: true,
          },
        },
      ],
    },
    {
      id: "schreiben",
      name: "Schriftlicher Ausdruck",
      short: "Schreiben",
      nameEn: "Writing",
      description: "A semi-formal e-mail in reply to an ad – you choose between two tasks (Aufgabe A or B).",
      maxPoints: 45,
      minutes: 30,
      timeNote: "The 30 minutes include choosing between Aufgabe A and B – decide quickly.",
      parts: [
        {
          id: "schreiben",
          sectionId: "schreiben",
          slug: "aufgabe",
          teil: 1,
          name: "Halbformelle E-Mail",
          nameEn: "Semi-formal e-mail",
          setType: "writing-email",
          items: 0,
          firstItem: 0,
          pointsPerItem: 0,
          maxPoints: 45,
          minutes: 30,
          instruction:
            "Behandeln Sie darin entweder a) drei der folgenden Punkte oder b) zwei der folgenden Punkte und einen weiteren Aspekt Ihrer Wahl. Überlegen Sie sich vor dem Schreiben eine passende Reihenfolge der Punkte, einen passenden Betreff, eine passende Anrede, Einleitung und einen passenden Schluss. Schreiben Sie mindestens 150 Wörter.",
          instructionEn:
            "Deal with either a) three of the following points or b) two of them plus one aspect of your own choice. Before writing, think about a sensible order, a subject line, a salutation, an introduction and a closing. Write at least 150 words.",
          description:
            "A request for information, a complaint, an enquiry or an application to a company or office. Rated on task completion (three points, each developed in more than one sentence), communicative design and accuracy.",
          writing: { minWords: 150, cover: "three", choice: true },
        },
      ],
    },
    {
      id: "sprechen",
      name: "Mündlicher Ausdruck",
      short: "Sprechen",
      nameEn: "Speaking",
      description: "A paired exam in three scored parts: talking about an experience, a discussion and planning together.",
      maxPoints: 75,
      minutes: 15,
      timeNote: "Plus 20 minutes of preparation for Teil 2 and 3 – Teil 1 you prepare at home.",
      parts: [
        {
          id: "sprechen-1",
          sectionId: "sprechen",
          slug: "teil-1",
          teil: 1,
          name: "Über Erfahrungen sprechen",
          nameEn: "Talking about experiences",
          setType: "speaking-experience",
          items: 0,
          firstItem: 0,
          pointsPerItem: 0,
          maxPoints: 25,
          minutes: 5,
          instruction:
            "Sie sollen Ihrer Partnerin bzw. Ihrem Partner über Ihre Erfahrungen zu einem der folgenden Themen berichten. Die Stichpunkte in den Klammern können als Anregung dienen. Sie haben dazu ca. 1 ½ Minuten Zeit. Im Anschluss sollen Sie die Fragen Ihrer Partnerin bzw. Ihres Partners beantworten.",
          instructionEn:
            "Tell your partner about your experiences with one of the following topics. The cues in brackets can help you. You have about 1½ minutes. Afterwards, answer your partner's questions.",
          description:
            "Choose one of seven topics (prepared at home), talk for about 1½ minutes, then answer your partner's questions – and ask questions about your partner's talk.",
          speaking: { minutes: 5, monologueSeconds: 90, prepSeconds: 180 },
        },
        {
          id: "sprechen-2",
          sectionId: "sprechen",
          slug: "teil-2",
          teil: 2,
          name: "Diskussion",
          nameEn: "Discussion",
          setType: "speaking-discussion",
          items: 0,
          firstItem: 0,
          pointsPerItem: 0,
          maxPoints: 25,
          minutes: 5,
          instruction:
            "Sie haben in der Vorbereitungszeit einen Zeitungsartikel gelesen. Äußern Sie sich zunächst kurz zum Text und geben Sie die Argumente oder Aspekte wieder, die Sie interessant finden. Diskutieren Sie dann miteinander: Bringen Sie eigene Argumente, Meinungen und Erfahrungen ein, gehen Sie auf die Argumente Ihrer Partnerin bzw. Ihres Partners ein und machen Sie Vorschläge.",
          instructionEn:
            "You read a newspaper article during the preparation time. First comment briefly on the text and report the arguments or aspects you find interesting. Then discuss: bring in your own arguments, opinions and experiences, respond to your partner's arguments and make suggestions.",
          description:
            "Both candidates read the same article on a controversial topic. Summarise it briefly (at most a minute), then argue, counter, concede and weigh up – a real discussion, not two monologues.",
          speaking: { minutes: 5, monologueSeconds: 60, prepSeconds: 600 },
        },
        {
          id: "sprechen-3",
          sectionId: "sprechen",
          slug: "teil-3",
          teil: 3,
          name: "Gemeinsam etwas planen",
          nameEn: "Planning something together",
          setType: "speaking-planning",
          items: 0,
          firstItem: 0,
          pointsPerItem: 0,
          maxPoints: 25,
          minutes: 5,
          instruction:
            "Überlegen Sie, wie Sie die Aufgabe lösen können, und machen Sie Ihrer Partnerin bzw. Ihrem Partner Vorschläge. Gehen Sie auf die Vorschläge ein und entwickeln Sie dann gemeinsam einen Plan.",
          instructionEn:
            "Think about how to solve the task and make suggestions to your partner. Respond to their suggestions and then develop a plan together.",
          description:
            "Organise an event, a trip, a party or a project from a short task description – no checklist on the sheet. Bring in your own ideas, react, negotiate and agree on a concept.",
          speaking: { minutes: 5, prepSeconds: 600 },
        },
      ],
    },
  ],
  writingRubric: {
    multiplier: 3,
    maxPoints: 45,
    criteria: [
      {
        id: "I",
        name: "Aufgabenbewältigung",
        nameEn: "Task completion",
        assesses: [
          "Are three guiding points (or two plus an own aspect related to the situation) dealt with appropriately at B2 level?",
          "Is your position presented in a differentiated way and suited to the reader?",
        ],
        bands: [
          { grade: "A", points: 5, descriptor: "The task is fully covered: three guiding points (or two plus an own aspect) are dealt with appropriately at B2 level." },
          { grade: "B", points: 3, descriptor: "The task is largely covered: two guiding points (or one plus an own aspect) are dealt with appropriately." },
          { grade: "C", points: 1, descriptor: "The task is only partly covered: one guiding point or own aspect is dealt with appropriately." },
          { grade: "D", points: 0, descriptor: "The task is not covered: no guiding point is dealt with appropriately." },
        ],
      },
      {
        id: "II",
        name: "Kommunikative Gestaltung",
        nameEn: "Communicative design",
        assesses: [
          "Register appropriate to a semi-formal e-mail, held consistently",
          "Range of vocabulary and structures, varied wording",
          "Text logic and a variety of linking devices",
          "Text-type features: subject line, salutation, closing formula",
        ],
        bands: [
          { grade: "A", points: 5, descriptor: "Upper B2: convincing and clear in a formal style; broad range, varied wording; a variety of connectors makes the logic clear." },
          { grade: "B", points: 3, descriptor: "B2: clear and appropriate; sufficiently broad range with some gaps; a limited number of connectors makes a clear, connected text." },
          { grade: "C", points: 1, descriptor: "B1: can write about familiar topics; enough language to get by; a linear sequence of simple elements." },
          { grade: "D", points: 0, descriptor: "A2 or below: elementary functions and phrases, only the most frequent connectors." },
        ],
      },
      {
        id: "III",
        name: "Formale Richtigkeit",
        nameEn: "Accuracy",
        assesses: ["Grammar (syntax, morphology)", "Spelling and punctuation"],
        bands: [
          { grade: "A", points: 5, descriptor: "Good grammatical control; no systematic errors, only occasional slips; spelling and punctuation largely correct." },
          { grade: "B", points: 3, descriptor: "Fairly good control; a few systematic errors that do not endanger understanding; spelling sufficiently correct." },
          { grade: "C", points: 1, descriptor: "Adequate control despite clear L1 influence; several systematic errors, but the meaning stays mostly clear." },
          { grade: "D", points: 0, descriptor: "Some simple structures correct, but many elementary errors (tenses, subject–verb agreement); often phonetic spelling." },
        ],
      },
    ],
    notes: [
      "A guiding point or an own aspect only counts if it is developed in more than one sentence – one complex sentence is not enough.",
      "Reducing the content or the language to a simpler level is marked down: B2 expects a differentiated position, suited to the reader.",
      "Off-topic texts receive D in every criterion. A wrong situation (e.g. an application instead of a request for information) only sets criterion I to D.",
      "No A in criterion II if subject line, salutation or closing formula are missing; no B if the register is wrong or switches, the vocabulary is below B2 or the points are listed without links.",
      "Sender, recipient and date are not needed – it is an e-mail.",
    ],
  },
  speakingRubric: {
    maxPoints: 75,
    criteria: [
      {
        id: "ausdruck",
        name: "Ausdrucksfähigkeit",
        nameEn: "Range of expression",
        assesses: ["Expression appropriate to content and role", "Range and variety of language", "Realising your communicative intention"],
        descriptors: {
          A: "fully appropriate",
          B: "appropriate on the whole",
          C: "barely acceptable",
          D: "consistently insufficient",
        },
      },
      {
        id: "aufgabe",
        name: "Aufgabenbewältigung",
        nameEn: "Task management",
        assesses: ["Taking part in the conversation", "Discourse and compensation strategies", "Fluency"],
        descriptors: {
          A: "fully appropriate",
          B: "appropriate on the whole",
          C: "barely acceptable",
          D: "consistently insufficient",
        },
      },
      {
        id: "richtigkeit",
        name: "Formale Richtigkeit",
        nameEn: "Accuracy",
        assesses: ["Syntax and morphology"],
        descriptors: {
          A: "no or only very isolated errors",
          B: "few errors that do not affect what you want to say",
          C: "many errors that considerably affect what you want to say",
          D: "so many errors that understanding is no longer possible",
        },
      },
      {
        id: "aussprache",
        name: "Aussprache und Intonation",
        nameEn: "Pronunciation & intonation",
        assesses: ["Deviations from spoken standard German"],
        descriptors: {
          A: "no significant deviations",
          B: "deviations that do not affect comprehensibility",
          C: "stronger deviations that make understanding harder",
          D: "strong deviations that make understanding very hard, at times impossible",
        },
      },
    ],
    points: {
      "sprechen-1": {
        ausdruck: { A: 7, B: 5, C: 3, D: 0 },
        aufgabe: { A: 7, B: 5, C: 3, D: 0 },
        richtigkeit: { A: 7, B: 5, C: 3, D: 0 },
        aussprache: { A: 4, B: 2, C: 1, D: 0 },
      },
      "sprechen-2": {
        ausdruck: { A: 7, B: 5, C: 3, D: 0 },
        aufgabe: { A: 7, B: 5, C: 3, D: 0 },
        richtigkeit: { A: 7, B: 5, C: 3, D: 0 },
        aussprache: { A: 4, B: 2, C: 1, D: 0 },
      },
      "sprechen-3": {
        ausdruck: { A: 7, B: 5, C: 3, D: 0 },
        aufgabe: { A: 7, B: 5, C: 3, D: 0 },
        richtigkeit: { A: 7, B: 5, C: 3, D: 0 },
        aussprache: { A: 4, B: 2, C: 1, D: 0 },
      },
    },
  },
};
