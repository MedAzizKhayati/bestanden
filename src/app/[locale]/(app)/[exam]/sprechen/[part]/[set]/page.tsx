import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { SpeakingRunner } from "@/components/speaking/speaking-runner";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import type { SpeakingSet } from "@/lib/ai/speaking-types";
import { getPhraseBanks, getSet, getSetNeighbours, getSets, getStrategy } from "@/lib/content/load";
import { EXAMS, partHref, setHref } from "@/lib/exams";
import { requireExam, requirePart } from "@/lib/exams/resolve";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) =>
    exam.sections
      .find((s) => s.id === "sprechen")!
      .parts.flatMap((p) => getSets(exam.id, p.id).map(({ number }) => ({ exam: exam.slug, part: p.slug, set: number }))),
  );
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/sprechen/[part]/[set]">): Promise<Metadata> {
  const { exam: slug, part: partSlug, set: number } = await props.params;
  const locale = await getLocale();
  const exam = requireExam(slug, locale);
  const { part } = requirePart(exam, "sprechen", partSlug);
  return { title: getMessages(locale).speaking.meta.setTitle(part.teil, getSet(exam.id, part.id, number, locale)?.title ?? number) };
}

export default async function SpeakingTaskPage(props: PageProps<"/[locale]/[exam]/sprechen/[part]/[set]">) {
  const { exam: slug, part: partSlug, set: number } = await props.params;
  const locale = await getLocale();
  const exam = requireExam(slug, locale);
  const { part } = requirePart(exam, "sprechen", partSlug);
  const set = getSet(exam.id, part.id, number, locale);
  if (!set || !set.type.startsWith("speaking")) notFound();

  const banks = getPhraseBanks(locale).filter((b) => b.context === part.id || b.id === "gespraechsstrategien");
  const phraseGroups = banks.flatMap((b) => b.groups.map((g) => ({ title: g.title, titleEn: g.titleEn, phrases: g.phrases })));
  const nb = getSetNeighbours(exam.id, part.id, number);

  return (
    <PageContainer wide>
      <SpeakingRunner
        key={set.id}
        examId={exam.id}
        part={part}
        set={set as SpeakingSet}
        setNumber={number}
        rubric={exam.speakingRubric}
        phraseGroups={phraseGroups}
        links={{ part: partHref(exam, part), next: nb.next ? setHref(exam, part, nb.next) : undefined }}
        tips={getStrategy(exam.id, part.id, locale)?.steps.slice(0, 3).map((s) => s.title) ?? []}
      />
    </PageContainer>
  );
}
