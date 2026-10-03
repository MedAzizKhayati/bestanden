import { Dashboard, type DashboardData } from "@/components/dashboard/dashboard";
import { PageContainer } from "@/components/common/page-header";
import { getLocale } from "@/i18n/server";
import { getGrammarTopics, getPhraseBanks, getSetSummaries, getVocabThemes } from "@/lib/content/load";
import { DEFAULT_EXAM, setHref } from "@/lib/exams";

export default async function HomePage() {
  const locale = await getLocale();
  const exam = DEFAULT_EXAM;
  const sets: DashboardData["sets"] = {};
  let total = 0;
  for (const section of exam.sections)
    for (const part of section.parts) {
      const list = getSetSummaries(exam.id, part.id);
      total += list.length;
      sets[part.id] = list.map((s) => ({ id: s.id, title: s.title, href: setHref(exam, part, s.number) }));
    }
  const data: DashboardData = {
    examSlug: exam.slug,
    sets,
    counts: {
      sets: total,
      grammar: getGrammarTopics(locale).length,
      words: getVocabThemes(locale).reduce((n, t) => n + t.words.length, 0),
      phrases: getPhraseBanks(locale).reduce((n, b) => n + b.groups.reduce((m, g) => m + g.phrases.length, 0), 0),
    },
  };
  return (
    <PageContainer wide>
      <Dashboard data={data} />
    </PageContainer>
  );
}
