import { AlertTriangle, CheckCircle2, Clock, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/i18n/link";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { getLocale, getT } from "@/i18n/server";
import { getStrategies } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { allParts, getSection, partHref } from "@/lib/exams";
import { examParams, requireExam } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = examParams;

export async function generateMetadata(props: PageProps<"/[locale]/[exam]/strategien">): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const exam = requireExam((await props.params).exam, locale);
  return { title: t.exam.strategies.metaTitle, description: t.exam.strategies.metaDescription(exam.name) };
}

export default async function StrategiesPage(props: PageProps<"/[locale]/[exam]/strategien">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const m = t.exam.strategies;
  const exam = requireExam((await props.params).exam, locale);
  const guides = getStrategies(exam.id, locale);
  const parts = allParts(exam);

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: t.nav.strategies }]}
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Lightbulb className="size-6" />
          </span>
        }
        title={m.title}
        description={m.description}
      />

      <nav className="mt-6 flex flex-wrap gap-2">
        {guides.map((g) => (
          <a key={g.partId} href={`#${g.partId}`} className="rounded-full border bg-card px-3 py-1 text-sm hover:bg-muted">
            {g.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-6">
        {guides.map((g) => {
          const part = parts.find((p) => p.id === g.partId);
          const section = part ? getSection(exam, part.sectionId) : undefined;
          const ui = section ? SECTION_UI[section.id] : null;
          return (
            <section key={g.partId} id={g.partId} className="scroll-mt-20 overflow-hidden rounded-2xl border bg-card">
              <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b p-5", ui && "bg-linear-to-r", ui?.gradient)}>
                <div className="flex items-start gap-3">
                  {ui && (
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", ui.bgSoft, ui.text)}>
                      <ui.icon className="size-5" />
                    </span>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">{g.title}</h2>
                    <p className="max-w-3xl text-sm text-muted-foreground">{g.summary}</p>
                  </div>
                </div>
                {part && (
                  <Link href={partHref(exam, part)} className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
                    {m.practisePart}
                  </Link>
                )}
              </div>
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="space-y-4">
                  <p className="text-sm">
                    <span className="font-semibold">{m.whatIsTested} </span>
                    <span className="text-foreground/85">{g.whatIsTested}</span>
                  </p>
                  <ol className="space-y-3">
                    {g.steps.map((s, i) => (
                      <li key={s.title} className="flex gap-3 text-sm">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        <span>
                          <span className="font-semibold">{s.title}.</span> <span className="text-foreground/85">{s.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-destructive/6 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <AlertTriangle className="size-4" /> {m.traps}
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {g.traps.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 rounded-xl bg-muted/60 p-4 text-sm">
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {g.timeAdvice}
                  </div>
                  <ul className="space-y-1.5">
                    {g.checklist.map((c) => (
                      <li key={c} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </PageContainer>
  );
}
