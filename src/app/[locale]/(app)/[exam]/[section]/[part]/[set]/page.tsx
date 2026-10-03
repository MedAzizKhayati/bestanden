import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import { ExerciseRunner } from "@/components/exam/exercise-runner";
import { getLocale, getT } from "@/i18n/server";
import { getSet, getSetNeighbours, getSets, getStrategy } from "@/lib/content/load";
import { isScoredSet } from "@/lib/exam/scoring";
import { EXAMS, partHref, setHref } from "@/lib/exams";
import { AUTO_SECTIONS, requireExam, requirePart } from "@/lib/exams/resolve";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) =>
    exam.sections
      .filter((s) => AUTO_SECTIONS.includes(s.id))
      .flatMap((section) =>
        section.parts.flatMap((part) =>
          getSets(exam.id, part.id).map(({ number }) => ({ exam: exam.slug, section: section.id, part: part.slug, set: number })),
        ),
      ),
  );
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/[section]/[part]/[set]">): Promise<Metadata> {
  const { exam: slug, section: sectionId, part: partSlug, set: number } = await props.params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const exam = requireExam(slug, locale);
  const { section, part } = requirePart(exam, sectionId, partSlug);
  const set = getSet(exam.id, part.id, number, locale);
  return { title: `${section.short} ${t.common.teil(part.teil)} · ${set?.title ?? number}` };
}

export default async function ExercisePage(props: PageProps<"/[locale]/[exam]/[section]/[part]/[set]">) {
  const { exam: slug, section: sectionId, part: partSlug, set: number } = await props.params;
  const locale = await getLocale();
  const exam = requireExam(slug, locale);
  const { section, part } = requirePart(exam, sectionId, partSlug);
  if (!AUTO_SECTIONS.includes(section.id)) notFound();
  const set = getSet(exam.id, part.id, number, locale);
  if (!set || !isScoredSet(set)) notFound();

  const nb = getSetNeighbours(exam.id, part.id, number);
  const strategy = getStrategy(exam.id, part.id, locale);

  return (
    <PageContainer wide className="pt-0 sm:pt-0">
      <div className="pt-4 sm:pt-6">
        <ExerciseRunner
          key={set.id}
          examId={exam.id}
          sectionId={section.id}
          sectionName={section.short}
          part={part}
          set={set}
          setNumber={number}
          position={{ index: nb.index, count: nb.count }}
          links={{
            part: partHref(exam, part),
            next: nb.next ? setHref(exam, part, nb.next) : undefined,
            prev: nb.prev ? setHref(exam, part, nb.prev) : undefined,
          }}
          tips={strategy?.steps.slice(0, 3).map((s) => s.title) ?? []}
        />
      </div>
    </PageContainer>
  );
}
