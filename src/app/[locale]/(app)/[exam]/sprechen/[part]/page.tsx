import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { PartFacts, StrategyCard } from "@/components/exam/part-info";
import { SetGrid } from "@/components/exam/set-grid";
import { Translation } from "@/components/writing/editor-tools";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getPhraseBanks, getSetSummaries, getStrategy } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { EXAMS, setHref } from "@/lib/exams";
import { requireExam, requirePart } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.flatMap((exam) => exam.sections.find((s) => s.id === "sprechen")!.parts.map((p) => ({ exam: exam.slug, part: p.slug })));
}

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/sprechen/[part]">): Promise<Metadata> {
  const { exam: slug, part: partSlug } = await props.params;
  const locale = await getLocale();
  const { part } = requirePart(requireExam(slug, locale), "sprechen", partSlug);
  return { title: getMessages(locale).speaking.meta.partTitle(part.teil, part.name), description: part.description };
}

export default async function SpeakingPartPage(props: PageProps<"/[locale]/[exam]/sprechen/[part]">) {
  const { exam: slug, part: partSlug } = await props.params;
  const locale = await getLocale();
  const t = getMessages(locale);
  const exam = requireExam(slug, locale);
  const { section, part } = requirePart(exam, "sprechen", partSlug);
  const ui = SECTION_UI.sprechen;
  const sets = getSetSummaries(exam.id, part.id).map((s) => ({ ...s, href: setHref(exam, part, s.number) }));
  const bank = getPhraseBanks(locale).find((b) => b.context === part.id);

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[
          { label: exam.name, href: `/${exam.slug}` },
          { label: section.short, href: `/${exam.slug}/sprechen` },
          { label: t.common.teil(part.teil) },
        ]}
        icon={
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", ui.bgSoft, ui.text)}>
            <ui.icon className="size-6" />
          </span>
        }
        eyebrow={`${section.name} · ${t.common.teil(part.teil)}`}
        title={part.name}
        description={part.description}
      >
        <PartFacts exam={exam} part={part} />
      </PageHeader>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t.speaking.part.tasks}</h2>
            <SetGrid examId={exam.id} sets={sets} maxPoints={0} accent={cn(ui.bgSoft, ui.text)} />
          </section>
          {bank && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">Redemittel · {bank.title}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{bank.description}</p>
              <div className="grid gap-5 md:grid-cols-2">
                {bank.groups.map((g) => (
                  <div key={g.title}>
                    <div className="mb-1.5 text-xs font-semibold tracking-wide text-sprechen uppercase">
                      {g.title}
                      {locale === "en" && <span className="font-normal text-muted-foreground normal-case"> · {g.titleEn}</span>}
                    </div>
                    <ul className="space-y-1">
                      {g.phrases.map((p) => (
                        <li key={p.de} className="text-sm">
                          <span className="font-medium">{p.de}</span>
                          <Translation className="block text-xs text-muted-foreground">{p.en}</Translation>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t.speaking.part.instruction}</div>
            <p className="text-sm leading-relaxed font-medium">{part.instruction}</p>
            {locale === "en" && <p className="mt-2 text-sm text-muted-foreground">{part.instructionEn}</p>}
          </div>
          <StrategyCard guide={getStrategy(exam.id, part.id, locale)} href={`/${exam.slug}/strategien#${part.id}`} />
        </aside>
      </div>
    </PageContainer>
  );
}
