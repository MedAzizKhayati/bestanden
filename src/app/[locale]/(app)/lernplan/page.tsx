import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { StudyPlan, type StudyPlanData } from "@/components/plan/study-plan";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getGrammarTopics, getSet, getSetSummaries, getVocabThemes } from "@/lib/content/load";
import { MOCK_PARTS, WRITING_ALT, WRITING_PART } from "@/lib/exam/mock";
import { listMocks } from "@/lib/exam/mock-server";
import { EXAMS, setHref } from "@/lib/exams";
import type { PlanInventory } from "@/lib/plan/build-plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.plan.page.metaTitle };
}

export default async function StudyPlanPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const grammarTopics = getGrammarTopics(locale);
  const vocabThemes = getVocabThemes(locale);
  // One plan per exam: the page is static, the learner's exam is only known in the browser.
  const plans: StudyPlanData = {};
  for (const exam of EXAMS) {
    const levels: string[] = exam.studyLevels;
    const topics = grammarTopics
      .filter((topic) => levels.includes(topic.level))
      .sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level));
    const themes = vocabThemes.filter((theme) => theme.level === exam.level);
    const inventory: PlanInventory = {
      examSlug: exam.slug,
      parts: exam.sections.flatMap((section) =>
        section.parts.map((part) => ({
          partId: part.id,
          label: `${section.short}${section.parts.length > 1 ? ` ${part.teil}` : ""}`,
          sectionId: section.id,
          minutes: part.audio ? part.minutes + 2 : part.sectionId === "sprechen" ? 15 : part.minutes,
          sets: getSetSummaries(exam.id, part.id).map((s) => ({ id: s.id, title: s.title, href: setHref(exam, part, s.number) })),
        })),
      ),
      grammar: topics.map((topic) => ({ id: topic.id, title: topic.title, href: `/grammatik/${topic.id}` })),
      vocab: themes.map((theme) => ({ id: theme.id, title: theme.title, href: `/wortschatz/${theme.id}` })),
      mocks: listMocks(exam).map((m) => ({
        id: `${exam.id}-${m.id}`,
        href: `/${exam.slug}/modelltest/${m.id}`,
        title: t.mock.title(m.k),
        setIds: [...MOCK_PARTS, WRITING_ALT]
          .map((p) => (m.numbers[p] ? getSet(exam.id, p === WRITING_ALT ? WRITING_PART : p, m.numbers[p])?.id : undefined))
          .filter(Boolean) as string[],
      })),
    };
    plans[exam.slug] = {
      inventory,
      grammarCounts: Object.fromEntries(topics.map((topic) => [topic.id, topic.exercises.length])),
      vocabWords: Object.fromEntries(themes.map((theme) => [theme.id, theme.words.map((w) => w.id)])),
    };
  }

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
        <StudyPlan plans={plans} />
      </div>
    </PageContainer>
  );
}
