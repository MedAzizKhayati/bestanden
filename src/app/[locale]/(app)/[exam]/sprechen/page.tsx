import { ArrowRight, Bot, Hourglass, Mic, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/i18n/link";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { countSets } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { getSection, partHref } from "@/lib/exams";
import { examParams, requireExam } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = examParams;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.speaking.meta.title, description: t.speaking.meta.description };
}

export default async function SprechenPage(props: PageProps<"/[locale]/[exam]/sprechen">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  const pg = t.speaking.page;
  const exam = requireExam((await props.params).exam, locale);
  const section = getSection(exam, "sprechen")!;
  const ui = SECTION_UI.sprechen;
  const rubric = exam.speakingRubric;

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: section.short }]}
        icon={
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", ui.bgSoft, ui.text)}>
            <ui.icon className="size-6" />
          </span>
        }
        eyebrow={[locale === "en" ? section.nameEn : null, pg.eyebrowPoints(exam.oral.maxPoints, exam.oral.passPoints)].filter(Boolean).join(" · ")}
        title={section.name}
        description={pg.description(exam.oral.prepMinutes)}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Fact icon={<Hourglass className="size-5" />} title={pg.facts.prepTitle(exam.oral.prepMinutes)} text={pg.facts.prepText} />
        <Fact icon={<Users className="size-5" />} title={pg.facts.pairTitle} text={pg.facts.pairText} />
        <Fact icon={<Bot className="size-5" />} title={pg.facts.aiTitle} text={pg.facts.aiText} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {section.parts.map((p) => (
          <Link
            key={p.id}
            href={partHref(exam, p)}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b opacity-70", ui.gradient)} />
            <div className="relative flex items-center justify-between">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ui.bgSoft, ui.text)}>{t.common.teil(p.teil)}</span>
              <span className="text-xs text-muted-foreground">{pg.partMeta(p.minutes, p.maxPoints, countSets(exam, p))}</span>
            </div>
            <div className="relative">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              {locale === "en" && <p className="text-sm text-muted-foreground">{p.nameEn}</p>}
            </div>
            <p className="relative text-sm text-foreground/80">{p.description}</p>
            <span className={cn("relative mt-auto flex items-center gap-1 text-sm font-medium", ui.text)}>
              <Mic className="size-4" /> {pg.practise} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">{pg.scoringTitle}</h2>
          <p className="text-sm text-muted-foreground">{pg.scoringText}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">{pg.criterion}</th>
                <th className="px-3 py-2 text-left font-semibold">{pg.assessed}</th>
                <th className="px-3 py-2 text-right font-semibold">Teil 1 (A)</th>
                <th className="px-5 py-2 text-right font-semibold">Teil 2/3 (A)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rubric.criteria.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 align-top">
                    <div className="font-medium">{c.name}</div>
                    {locale === "en" && <div className="text-xs text-muted-foreground">{c.nameEn}</div>}
                  </td>
                  <td className="px-3 py-3 align-top text-muted-foreground">{c.assesses.join(" · ")}</td>
                  <td className="px-3 py-3 text-right align-top font-semibold tabular">{rubric.points["sprechen-1"][c.id].A}</td>
                  <td className="px-5 py-3 text-right align-top font-semibold tabular">{rubric.points["sprechen-2"][c.id].A}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}

function Fact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sprechen/12 text-sprechen">{icon}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
