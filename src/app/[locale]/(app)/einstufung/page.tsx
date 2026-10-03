import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { PlacementRunner } from "@/components/placement/placement-runner";
import { getLocale, getT } from "@/i18n/server";
import { getGrammarTopics, getPlacementTest } from "@/lib/content/load";
import { DEFAULT_EXAM } from "@/lib/exams";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.placement.metaTitle, description: t.placement.metaDescription };
}

export default async function PlacementPage() {
  const locale = await getLocale();
  const test = getPlacementTest(DEFAULT_EXAM.id, locale);
  if (!test) notFound();
  const grammarTitles = Object.fromEntries(getGrammarTopics(locale).map((topic) => [topic.id, topic.title]));
  return (
    <PageContainer>
      <PlacementRunner test={test} examSlug={DEFAULT_EXAM.slug} grammarTitles={grammarTitles} />
    </PageContainer>
  );
}
