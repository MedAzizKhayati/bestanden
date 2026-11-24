import { Dashboard, type DashboardData } from "@/components/dashboard/dashboard";
import { PageContainer } from "@/components/common/page-header";
import { getLocale } from "@/i18n/server";
import { getGrammarTopics, getPhraseBanks, getSetSummaries, getVocabThemes } from "@/lib/content/load";
import { EXAMS, setHref } from "@/lib/exams";

export default async function HomePage() {
  const locale = await getLocale();
  const grammar = getGrammarTopics(locale);
  const themes = getVocabThemes(locale);
  const banks = getPhraseBanks(locale);
  const exams: DashboardData["exams"] = {};
  // Every exam's data is rendered: the page is static, the learner's exam is only known in the browser.
  for (const exam of EXAMS) {
    const sets: DashboardData["exams"][string]["sets"] = {};
    let total = 0;
    for (const section of exam.sections)
      for (const part of section.parts) {
        const list = getSetSummaries(exam.id, part.id);
        total += list.length;
        sets[part.id] = list.map((s) => ({ id: s.id, title: s.title, href: setHref(exam, part, s.number) }));
      }
    const levels: string[] = exam.studyLevels;
    exams[exam.slug] = {
      sets,
      counts: {
        sets: total,
        grammar: grammar.filter((topic) => levels.includes(topic.level)).length,
        words: themes.filter((theme) => theme.level === exam.level).reduce((n, theme) => n + theme.words.length, 0),
        phrases: banks
          .filter((b) => b.level === exam.level)
          .reduce((n, b) => n + b.groups.reduce((m, g) => m + g.phrases.length, 0), 0),
      },
    };
  }
  return (
    <PageContainer wide>
      <Dashboard data={{ exams }} />
    </PageContainer>
  );
}
