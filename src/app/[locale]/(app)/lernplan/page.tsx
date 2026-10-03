import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { StudyPlan } from "@/components/plan/study-plan";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getGrammarTopics, getSet, getSetSummaries, getVocabThemes } from "@/lib/content/load";
import { MOCK_PARTS } from "@/lib/exam/mock";
import { listMocks } from "@/lib/exam/mock-server";
import { DEFAULT_EXAM, setHref } from "@/lib/exams";
import type { PlanInventory } from "@/lib/plan/build-plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.plan.page.metaTitle };
}

export default async function StudyPlanPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const exam = DEFAULT_EXAM;
  const grammarTopics = getGrammarTopics(locale);
  const vocabThemes = getVocabThemes(locale);
  const inventory: PlanInventory = {
    parts: exam.sections.flatMap((section) =>
      section.parts.map((part) => ({
        partId: part.id,
        label: `${section.short}${section.parts.length > 1 ? ` ${part.teil}` : ""}`,
        sectionId: section.id,
        minutes: part.audio ? part.minutes + 2 : part.sectionId === "sprechen" ? 15 : part.minutes,
        sets: getSetSummaries(exam.id, part.id).map((s) => ({ id: s.id, title: s.title, href: setHref(exam, part, s.number) })),
      })),
    ),
    grammar: grammarTopics
      .slice()
      .sort((a, b) => (a.level === b.level ? 0 : a.level === "A2" ? 1 : -1))
      .map((topic) => ({ id: topic.id, title: topic.title, href: `/grammatik/${topic.id}` })),
    vocab: vocabThemes.map((theme) => ({ id: theme.id, title: theme.title, href: `/wortschatz/${theme.id}` })),
    mocks: listMocks(exam).map((m) => ({
      id: `${exam.id}-${m.id}`,
      href: `/${exam.slug}/modelltest/${m.id}`,
      title: t.mock.title(m.k),
      setIds: MOCK_PARTS.map((p) => getSet(exam.id, p, m.numbers[p])?.id).filter(Boolean) as string[],
    })),
  };
  const grammarCounts = Object.fromEntries(grammarTopics.map((topic) => [topic.id, topic.exercises.length]));
  const vocabWords = Object.fromEntries(vocabThemes.map((theme) => [theme.id, theme.words.map((w) => w.id)]));

  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarCheck className="size-6" />
          </span>
        }
        title={t.plan.page.title}
        description={t.plan.page.description}
      />
      <div className="mt-8">
        <StudyPlan inventory={inventory} grammarCounts={grammarCounts} vocabWords={vocabWords} />
      </div>
    </PageContainer>
  );
}
