/** Counts written as words in running text ("Three criteria"). */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n: number) => WORDS[n] ?? String(n);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

/** Exam pages (overview, section, part, strategies) and the overview widgets they use. */
export const exam = {
  percent: (n: number | string) => `${n}%`,

  /** Exam overview page: structure, scoring, pass marks. */
  overview: {
    metaTitle: (name: string) => `${name} – structure, scoring & pass marks`,
    takeMock: "Take a mock exam",
    practiseByPart: "Practise by part",
    facts: {
      total: (n: number) => `${n} points`,
      totalSplit: (written: number, oral: number) => `${written} written + ${oral} oral`,
      writtenPass: (percent: string) => `needed in the written exam (${percent})`,
      oralPass: (percent: string) => `needed in the oral exam (${percent})`,
      time: (written: number, oral: number) => `${written} + ${oral} min`,
      timeSplit: (prep: number) => `written + oral (plus ${prep} min preparation)`,
    },
    structure: {
      title: "Exam structure",
      text: "Every part, exactly as in the real exam. Click a part to practise it.",
      written: (minutes: number) => `Written exam · ${minutes} minutes`,
      oral: (minutes: number) => `Oral exam · about ${minutes} minutes in pairs`,
      sectionPoints: (n: number) => `${n} points`,
      sharedTime: (minutes: number) => `${minutes} min (shared)`,
      /** German UI only: label of the card of a single-part section (Schreiben). English shows the German part name there. */
      task: "Task",
      items: (n: number) => `${n} items`,
      plays: (n: number) => `${n}× hören`,
      about: (minutes: number) => `~${minutes} min`,
    },
    grades: {
      title: "Grades",
      text: "You must pass both parts separately. Then both scores are added up.",
    },
    writing: {
      title: "How Schreiben is marked",
      /** "Three criteria, A = 5 · B = 3 · C = 1 · D = 0, the sum × 3 = max. 45 points." */
      scale: (criteria: number, bands: string, multiplier: number, max: number) =>
        `${capitalize(word(criteria))} ${criteria === 1 ? "criterion" : "criteria"}, ${bands}, the sum × ${multiplier} = max. ${max} points.`,
      link: "Practise writing with AI feedback →",
    },
    speaking: {
      title: "How Sprechen is marked",
      scale: (criteria: number) => `Each part is rated on ${word(criteria)} ${criteria === 1 ? "criterion" : "criteria"}.`,
      /** `teile` is a ready-made list ("2 and 3"); `each` = several parts share the maximum. */
      partMax: (teile: string, max: number, each: boolean) => `Teil ${teile}: max. ${max} points${each ? " each" : ""}`,
      link: "Practise speaking with an AI partner →",
    },
  },

  /** Section page (Lesen, Sprachbausteine, Hören). */
  section: {
    fallbackTitle: "Section",
    /** Follows the bold number of points. */
    pointsShare: (percent: string) => `points · ${percent} of the total`,
    passMark: "Pass mark:",
    passMarkRest: "of the written exam overall",
  },

  /** Part page with its practice sets. */
  part: {
    practiceSets: "Practice sets",
    instruction: "Exam instruction",
  },

  /** Strategies page. */
  strategies: {
    metaTitle: "Exam strategies for every part",
    metaDescription: (exam: string) => `How to approach each part of ${exam}, how to manage your time, and the traps to avoid.`,
    title: "Strategien",
    description:
      "Points are won with technique as much as with German. Read the guide for a part before practising it, then apply one step at a time.",
    practisePart: "Practise this part →",
    whatIsTested: "What is tested:",
    traps: "Traps",
  },

  /** Part cards on a section page. */
  partCards: {
    items: (n: number) => `${n} items`,
    points: (n: number) => `${n} points`,
    heard: (n: number) => `heard ${times(n)}`,
    continue: "Continue practising",
    start: "Start practising",
  },

  /** Grid of practice sets. */
  setGrid: {
    empty: "New practice sets for this part are being prepared.",
    /** Follows the bold number of sets done. */
    practised: (total: number) => `of ${total} sets practised`,
  },

  /** Facts row on a part page. */
  partFacts: {
    itemsValue: (n: number, first: number, last: number) => `${n} (Nr. ${first}–${last})`,
    pointsValue: (max: number, perItem: string) => `${max} (${perItem} per item)`,
    recording: "Recording",
    played: (n: number) => `played ${times(n)}`,
    time: "Recommended time",
    share: "Share of total",
  },

  /** Strategy card next to a part's practice sets. */
  strategyCard: {
    title: "How to approach it",
    traps: "Typical traps",
    checklist: "Checklist",
    all: "All strategies →",
  },

  /** Predicted written score widget (overview, dashboard, progress). */
  predicted: {
    emptyTitle: "Your predicted score",
    emptyText: "Complete a few practice sets and we'll estimate your written score from your recent results in every part.",
    title: "Predicted written score",
    onTrack: "On track to pass",
    below: "Below pass mark",
    outOf: (max: number) => `/ ${max} points`,
    basedOn: (percent: string) => `Based on ${percent} of the written exam`,
    pass: (points: number) => `pass: ${points}`,
    /** Followed by the bold grade („gut“) and a full stop. */
    gradeLead: "If your speaking matches, that would be about",
    gradeRest: "Take a full mock exam for a reliable result.",
    takeMock: "Take a mock exam",
  },

  pageHeader: {
    breadcrumb: "Breadcrumb",
  },
};
