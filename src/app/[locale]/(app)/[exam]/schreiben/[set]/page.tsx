import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-header";
import type { PhraseGroup } from "@/components/writing/editor-tools";
import { WritingRunner } from "@/components/writing/writing-runner";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getPhraseBanks, getSet, getSetNeighbours, getSets, getStrategy } from "@/lib/content/load";
import { EXAMS, getSection, partHref, setHref } from "@/lib/exams";
import { requireExam } from "@/lib/exams/resolve";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) => getSets(exam.id, "schreiben").map(({ number }) => ({ exam: exam.slug, set: number })));
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/schreiben/[set]">): Promise<Metadata> {
  const { exam: slug, set: number } = await props.params;
  const locale = await getLocale();
  const set = getSet(requireExam(slug, locale).id, "schreiben", number, locale);
  return { title: getMessages(locale).writing.meta.setTitle(number, set?.title ?? "") };
}

export default async function WritingTaskPage(props: PageProps<"/[locale]/[exam]/schreiben/[set]">) {
  const { exam: slug, set: number } = await props.params;
  const locale = await getLocale();
  const exam = requireExam(slug, locale);
  const part = getSection(exam, "schreiben")!.parts[0];
  const set = getSet(exam.id, part.id, number, locale);
  if (!set || set.type !== "writing-email") notFound();

  const bankId = set.register === "informal" ? "schreiben-informell" : "schreiben-halbformell";
  const bank = getPhraseBanks(locale).find((b) => b.id === bankId);
  const phraseGroups: PhraseGroup[] = [
    { title: "Für diese Aufgabe", titleEn: "For this task", phrases: set.phrases.map((p) => ({ de: p.de, en: p.en })) },
    ...(bank?.groups ?? []).map((g) => ({ title: g.title, titleEn: g.titleEn, phrases: g.phrases })),
  ];
  const nb = getSetNeighbours(exam.id, part.id, number);

  return (
    <PageContainer wide className="pt-0 sm:pt-0">
      <div className="pt-4 sm:pt-6">
        <WritingRunner
          key={set.id}
          examId={exam.id}
          set={set}
          setNumber={number}
          part={part}
          rubric={exam.writingRubric}
          phraseGroups={phraseGroups}
          links={{ part: partHref(exam, part), next: nb.next ? setHref(exam, part, nb.next) : undefined }}
          tips={getStrategy(exam.id, part.id, locale)?.steps.slice(0, 3).map((s) => s.title) ?? []}
        />
      </div>
    </PageContainer>
  );
}
