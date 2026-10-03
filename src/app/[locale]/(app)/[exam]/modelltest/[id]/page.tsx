import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { MockRunner, type MockPart } from "@/components/mock/mock-runner";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getSet } from "@/lib/content/load";
import { MOCK_PARTS } from "@/lib/exam/mock";
import { listMocks } from "@/lib/exam/mock-server";
import { isScoredSet } from "@/lib/exam/scoring";
import { EXAMS, getPart, getSection } from "@/lib/exams";
import { requireExam } from "@/lib/exams/resolve";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) => listMocks(exam).map((m) => ({ exam: exam.slug, id: m.id })));
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/modelltest/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getT();
  return { title: t.mock.title(Number(id)) };
}

export default async function MockPage(props: PageProps<"/[locale]/[exam]/modelltest/[id]">) {
  const { exam: slug, id } = await props.params;
  const locale = await getLocale();
  const t = getMessages(locale);
  const exam = requireExam(slug, locale);
  const mock = listMocks(exam).find((m) => m.id === id);
  if (!mock) notFound();

  const parts: MockPart[] = MOCK_PARTS.map((partId) => {
    const part = getPart(exam, partId)!;
    const set = getSet(exam.id, partId, mock.numbers[partId], locale);
    if (!set || (!isScoredSet(set) && set.type !== "writing-email")) notFound();
    return { part, sectionName: getSection(exam, part.sectionId)!.short, number: mock.numbers[partId], set };
  });

  return (
    <PageContainer wide className="pt-0 sm:pt-0">
      <div className="pt-4 sm:pt-6">
        <MockRunner
          examId={exam.id}
          mockId={`${exam.id}-${id}`}
          title={`${exam.name} · ${t.mock.title(mock.k)}`}
          parts={parts}
          rubric={exam.writingRubric}
          listHref={`/${exam.slug}/modelltest`}
        />
      </div>
    </PageContainer>
  );
}
