import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { PartCards } from "@/components/exam/part-cards";
import { getLocale, getT } from "@/i18n/server";
import { countSets } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { EXAMS, getSection } from "@/lib/exams";
import { AUTO_SECTIONS, requireExam } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) => exam.sections.filter((s) => AUTO_SECTIONS.includes(s.id)).map((s) => ({ exam: exam.slug, section: s.id })));
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/[section]">): Promise<Metadata> {
  const { exam: slug, section: sectionId } = await props.params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const section = getSection(requireExam(slug, locale), sectionId);
  if (!section) return { title: t.exam.section.fallbackTitle };
  // The English gloss ("Reading") is only part of the English title.
  return { title: locale === "en" ? `${section.name} (${section.nameEn})` : section.name };
}

export default async function SectionPage(props: PageProps<"/[locale]/[exam]/[section]">) {
  const { exam: slug, section: sectionId } = await props.params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const m = t.exam.section;
  const exam = requireExam(slug, locale);
  const section = getSection(exam, sectionId);
  if (!section || !AUTO_SECTIONS.includes(section.id)) notFound();
  const ui = SECTION_UI[section.id];
  const setCounts = Object.fromEntries(section.parts.map((p) => [p.id, countSets(exam, p)]));
  const share = Math.round((section.maxPoints / exam.totalPoints) * 100);
  const passPercent = Math.round((exam.written.passPoints / exam.written.maxPoints) * 100);

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: section.short }]}
        icon={
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", ui.bgSoft, ui.text)}>
            <ui.icon className="size-6" />
          </span>
        }
        eyebrow={locale === "en" ? section.nameEn : undefined}
        title={section.name}
        description={section.description}
      />
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border bg-card px-3 py-1">
          <strong>{section.maxPoints}</strong> {m.pointsShare(t.exam.percent(share))}
        </span>
        <span className="rounded-full border bg-card px-3 py-1">
          <strong>{t.common.minutes(section.minutes)}</strong> {section.timeNote ? `· ${section.timeNote}` : ""}
        </span>
        <span className="rounded-full border bg-card px-3 py-1">
          {m.passMark} <strong>{t.exam.percent(passPercent)}</strong> {m.passMarkRest}
        </span>
      </div>
      <div className="mt-8">
        <PartCards examSlug={exam.slug} section={section} setCounts={setCounts} />
      </div>
    </PageContainer>
  );
}
