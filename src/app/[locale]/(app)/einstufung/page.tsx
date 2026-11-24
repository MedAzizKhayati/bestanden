import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { PlacementRunner } from "@/components/placement/placement-runner";
import { getLocale, getT } from "@/i18n/server";
import { getGrammarTopics, getPlacementTest } from "@/lib/content/load";
import type { PlacementTest } from "@/lib/content/schemas";
import { EXAMS } from "@/lib/exams";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.placement.metaTitle, description: t.placement.metaDescription };
}

export default async function PlacementPage() {
  const locale = await getLocale();
  // Every exam's level check is rendered; the learner's current exam picks one in the browser.
  const tests: Record<string, PlacementTest> = {};
  for (const exam of EXAMS) {
    const test = getPlacementTest(exam.id, locale);
    if (test) tests[exam.slug] = test;
  }
  if (!Object.keys(tests).length) notFound();
  const grammarTitles = Object.fromEntries(getGrammarTopics(locale).map((topic) => [topic.id, topic.title]));
  return (
    <PageContainer>
      <PlacementRunner tests={tests} grammarTitles={grammarTitles} />
    </PageContainer>
  );
}
