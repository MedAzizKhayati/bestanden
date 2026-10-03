import "server-only";

import type { SearchEntry } from "@/components/app/app-header";
import { localizeHref, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { EXAMS, localizeExam, partHref, setHref } from "@/lib/exams";
import { getGrammarTopics, getReferenceLists, getSetSummaries, getVocabThemes } from "./load";

/** Site-wide search entries in the UI language. Keywords stay bilingual so either language finds a page. */
export function buildSearchIndex(locale: Locale): SearchEntry[] {
  const t = getMessages(locale);
  const n = t.nav;
  const g = n.searchGroups;
  const en = locale === "en";
  const entries: SearchEntry[] = [
    { group: g.pages, title: n.dashboard, href: "/", keywords: "Dashboard Übersicht Start" },
    { group: g.pages, title: t.placement.title, subtitle: t.placement.lead, href: "/einstufung", keywords: "Einstufungstest Einstufung level check placement test Niveau" },
    { group: g.pages, title: n.grammar, subtitle: n.search.grammar, href: "/grammatik", keywords: "Grammatik grammar" },
    { group: g.pages, title: n.vocabulary, subtitle: n.search.vocabulary, href: "/wortschatz", keywords: "Wortschatz Vokabeln vocabulary words" },
    { group: g.pages, title: n.phrases, subtitle: n.search.phrases, href: "/redemittel", keywords: "Redemittel phrases" },
    { group: g.pages, title: n.wordLists, subtitle: n.search.lists, href: "/listen", keywords: "Listen lists" },
    { group: g.pages, title: n.mistakes, href: "/fehlertrainer", keywords: "Fehlertrainer Fehler mistakes review" },
    { group: g.pages, title: n.progress, href: "/fortschritt", keywords: "Fortschritt Statistik progress statistics" },
    { group: g.pages, title: n.studyPlan, href: "/lernplan", keywords: "Lernplan study plan" },
    { group: g.pages, title: n.settings, href: "/einstellungen", keywords: "Einstellungen settings Stimme voice Timer Sprache language" },
  ];

  for (const raw of EXAMS) {
    const exam = localizeExam(raw, locale);
    entries.push(
      { group: g.exam, title: n.search.examOverview(exam.name), subtitle: n.search.examOverviewSub, href: `/${exam.slug}` },
      { group: g.exam, title: n.search.mocks, subtitle: n.search.mocksSub, href: `/${exam.slug}/modelltest`, keywords: "Modelltest mock exam" },
      { group: g.exam, title: n.strategies, subtitle: n.search.strategiesSub, href: `/${exam.slug}/strategien`, keywords: "Strategien strategies Tipps tips" },
    );
    for (const section of exam.sections) {
      entries.push({
        group: g.exam,
        title: section.name,
        subtitle: en ? section.nameEn : section.description,
        href: `/${exam.slug}/${section.id}`,
        keywords: `${section.short} ${section.nameEn}`,
      });
      for (const part of section.parts) {
        const partLabel = section.parts.length > 1 ? `${section.short} Teil ${part.teil}` : section.short;
        if (section.parts.length > 1)
          entries.push({
            group: g.exam,
            title: `${partLabel} – ${part.name}`,
            subtitle: en ? part.nameEn : undefined,
            href: partHref(exam, part),
            keywords: part.nameEn,
          });
        for (const s of getSetSummaries(exam.id, part.id))
          entries.push({ group: g.exercises, title: `${partLabel} · ${s.number} – ${s.title}`, href: setHref(exam, part, s.number) });
      }
    }
  }

  for (const topic of getGrammarTopics(locale))
    entries.push({
      group: g.grammar,
      title: topic.title,
      subtitle: en ? topic.titleEn : undefined,
      href: `/grammatik/${topic.id}`,
      keywords: `${topic.titleEn} ${topic.summary}`,
    });
  for (const theme of getVocabThemes(locale))
    entries.push({
      group: g.vocabulary,
      title: theme.title,
      subtitle: en ? `${theme.titleEn} · ${t.common.words(theme.words.length)}` : t.common.words(theme.words.length),
      href: `/wortschatz/${theme.id}`,
      keywords: theme.titleEn,
    });
  for (const list of getReferenceLists(locale))
    entries.push({ group: g.lists, title: list.title, subtitle: en ? list.titleEn : undefined, href: `/listen/${list.id}`, keywords: list.titleEn });

  return entries.map((e) => ({ ...e, href: localizeHref(locale, e.href) }));
}
