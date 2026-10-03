import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { OfficialTestRunner } from "@/components/official/official-test-runner";
import { getLocale, getT } from "@/i18n/server";
import { getOfficialTest } from "@/lib/official/tests";
import { requireExam } from "@/lib/exams/resolve";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/offiziell/[test]">): Promise<Metadata> {
  const t = await getT();
  const test = getOfficialTest((await props.params).test);
  return { title: test?.title ?? t.official.metaTitle, robots: { index: false } };
}

export default async function OfficialTestPage(props: PageProps<"/[locale]/[exam]/offiziell/[test]">) {
  const locale = await getLocale();
  const params = await props.params;
  const exam = requireExam(params.exam, locale);
  const test = getOfficialTest(params.test);
  if (!test || test.examId !== exam.id) notFound();
  const { id, title, source, pages, key, audioUrl, bookletUrl } = test;
  return (
    <PageContainer wide>
      <OfficialTestRunner test={{ id, title, source, pages, key, audioUrl, bookletUrl }} examSlug={exam.slug} />
    </PageContainer>
  );
}
