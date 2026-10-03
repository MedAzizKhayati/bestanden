import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { PartFacts, StrategyCard } from "@/components/exam/part-info";
import { SetGrid } from "@/components/exam/set-grid";
import { getLocale, getT } from "@/i18n/server";
import { getSetSummaries, getStrategy } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { EXAMS, setHref } from "@/lib/exams";
import { AUTO_SECTIONS, requireExam, requirePart } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) =>
    exam.sections
      .filter((s) => AUTO_SECTIONS.includes(s.id))
      .flatMap((section) => section.parts.map((part) => ({ exam: exam.slug, section: section.id, part: part.slug }))),
  );
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/[section]/[part]">): Promise<Metadata> {
  const { exam: slug, section: sectionId, part: partSlug } = await props.params;
  const exam = requireExam(slug, await getLocale());
  const { section, part } = requirePart(exam, sectionId, partSlug);
  return { title: `${section.short} Teil ${part.teil} – ${part.name}`, description: part.description };
}

export default async function PartPage(props: PageProps<"/[locale]/[exam]/[section]/[part]">) {
  const { exam: slug, section: sectionId, part: partSlug } = await props.params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const exam = requireExam(slug, locale);
  const { section, part } = requirePart(exam, sectionId, partSlug);
  if (!AUTO_SECTIONS.includes(section.id)) notFound();
  const ui = SECTION_UI[section.id];
  const sets = getSetSummaries(exam.id, part.id).map((s) => ({ ...s, href: setHref(exam, part, s.number) }));

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[
          { label: exam.name, href: `/${exam.slug}` },
          { label: section.short, href: `/${exam.slug}/${section.id}` },
          { label: t.common.teil(part.teil) },
        ]}
        icon={
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", ui.bgSoft, ui.text)}>
            <ui.icon className="size-6" />
          </span>
        }
        eyebrow={`${section.name} · ${t.common.teil(part.teil)}`}
        title={`${part.name}`}
        description={part.description}
      >
        <PartFacts exam={exam} part={part} />
      </PageHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t.exam.part.practiceSets}</h2>
          <SetGrid examId={exam.id} sets={sets} maxPoints={part.maxPoints} accent={cn(ui.bgSoft, ui.text)} />
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t.exam.part.instruction}</div>
            <p className="text-sm leading-relaxed font-medium">{part.instruction}</p>
            {locale === "en" && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{part.instructionEn}</p>}
          </div>
          <StrategyCard guide={getStrategy(exam.id, part.id, locale)} href={`/${exam.slug}/strategien#${part.id}`} />
        </aside>
      </div>
    </PageContainer>
  );
}
