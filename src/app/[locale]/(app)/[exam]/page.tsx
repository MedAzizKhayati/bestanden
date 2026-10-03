import { ArrowRight, Award, Clock, Mic, PenLine, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/i18n/link";
import { PageContainer } from "@/components/common/page-header";
import { PredictedScore } from "@/components/exam/predicted-score";
import { Button } from "@/components/ui/button";
import { LOCALE_TAGS, type Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { getLocale, getT } from "@/i18n/server";
import { countSets } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { partHref, type ExamDefinition } from "@/lib/exams";
import { examParams, requireExam } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = examParams;

export async function generateMetadata(props: PageProps<"/[locale]/[exam]">): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const exam = requireExam((await props.params).exam, locale);
  return { title: t.exam.overview.metaTitle(exam.name), description: exam.description };
}

/** "Teil 1: max. 15 points, Teil 2 and 3: max. 30 points each." – parts with the same maximum are grouped. */
function speakingMaxima(exam: ExamDefinition, locale: Locale, partMax: (teile: string, max: number, each: boolean) => string) {
  const parts = exam.sections.find((s) => s.id === "sprechen")?.parts ?? [];
  const groups: { teile: number[]; max: number }[] = [];
  for (const p of parts) {
    const last = groups.at(-1);
    if (last && last.max === p.maxPoints) last.teile.push(p.teil);
    else groups.push({ teile: [p.teil], max: p.maxPoints });
  }
  const list = new Intl.ListFormat(LOCALE_TAGS[locale], { type: "conjunction" });
  return groups.map((g) => partMax(list.format(g.teile.map(String)), g.max, g.teile.length > 1)).join(", ");
}

export default async function ExamOverviewPage(props: PageProps<"/[locale]/[exam]">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const m = t.exam.overview;
  const glosses = locale === "en";
  const exam = requireExam((await props.params).exam, locale);
  const written = exam.sections.filter((s) => s.id !== "sprechen");
  const oral = exam.sections.find((s) => s.id === "sprechen")!;
  const percentOf = (part: number, whole: number) => t.exam.percent(Math.round((part / whole) * 100));
  const writingBands = exam.writingRubric.criteria[0]?.bands.map((b) => `${b.grade} = ${b.points}`).join(" · ") ?? "";

  return (
    <PageContainer wide>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-primary/12 via-card to-card p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{exam.level}</span>
              {exam.alias}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{exam.name}</h1>
            <p className="max-w-xl text-pretty text-muted-foreground">{exam.description}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="lg">
                <Link href={`/${exam.slug}/modelltest`}>
                  <Trophy /> {m.takeMock}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/${exam.slug}/lesen`}>
                  {m.practiseByPart} <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          <PredictedScore examSlug={exam.slug} />
        </div>
      </section>

      {/* Key facts */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KeyFact
          icon={<Award className="size-5" />}
          title={m.facts.total(exam.totalPoints)}
          text={m.facts.totalSplit(exam.written.maxPoints, exam.oral.maxPoints)}
        />
        <KeyFact
          icon={<PenLine className="size-5" />}
          title={`${exam.written.passPoints} / ${exam.written.maxPoints}`}
          text={m.facts.writtenPass(percentOf(exam.written.passPoints, exam.written.maxPoints))}
        />
        <KeyFact
          icon={<Mic className="size-5" />}
          title={`${exam.oral.passPoints} / ${exam.oral.maxPoints}`}
          text={m.facts.oralPass(percentOf(exam.oral.passPoints, exam.oral.maxPoints))}
        />
        <KeyFact
          icon={<Clock className="size-5" />}
          title={m.facts.time(exam.written.minutes, exam.oral.minutes)}
          text={m.facts.timeSplit(exam.oral.prepMinutes)}
        />
      </section>

      {/* Structure */}
      <section className="mt-10">
        <h2 className="mb-1 text-xl font-semibold tracking-tight">{m.structure.title}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{m.structure.text}</p>
        <div className="space-y-4">
          {[
            { label: m.structure.written(exam.written.minutes), sections: written },
            { label: m.structure.oral(exam.oral.minutes), sections: [oral] },
          ].map((block) => (
            <div key={block.label} className="overflow-hidden rounded-2xl border bg-card">
              <div className="border-b bg-muted/40 px-5 py-3 text-sm font-semibold">{block.label}</div>
              <div className="divide-y">
                {block.sections.map((s) => {
                  const ui = SECTION_UI[s.id];
                  return (
                    <div key={s.id} className="grid gap-3 p-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", ui.bgSoft, ui.text)}>
                          <ui.icon className="size-5" />
                        </span>
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.structure.sectionPoints(s.maxPoints)} ·{" "}
                            {s.id === "sprachbausteine" || s.id === "lesen" ? m.structure.sharedTime(s.minutes) : t.common.minutes(s.minutes)}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {s.parts.map((p) => {
                          // Single-part sections (Schreiben) show the part name; English adds its gloss below it.
                          const single = s.parts.length === 1;
                          const label = single ? (glosses ? p.name : m.structure.task) : t.common.teil(p.teil);
                          const title = single && glosses ? p.nameEn : p.name;
                          return (
                            <Link
                              key={p.id}
                              href={partHref(exam, p)}
                              className="group rounded-xl border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                            >
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className={cn("font-semibold", ui.text)}>{label}</span>
                                <span>{t.common.setsCount(countSets(exam, p))}</span>
                              </div>
                              <div className="mt-1 text-sm font-medium">{title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {[
                                  p.items ? m.structure.items(p.items) : null,
                                  `${p.maxPoints} ${t.common.pointsShort}`,
                                  p.audio ? m.structure.plays(p.audio.plays) : p.items ? m.structure.about(p.minutes) : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grades & rubrics */}
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">{m.grades.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{m.grades.text}</p>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y">
              {exam.grades.map((g, i) => {
                const upper = i === 0 ? exam.totalPoints : exam.grades[i - 1].min - 0.5;
                return (
                  <tr key={g.label}>
                    <td className="py-2 font-medium">{g.label}</td>
                    {glosses && <td className="py-2 text-muted-foreground">{g.labelEn}</td>}
                    <td className="py-2 text-right tabular">
                      {g.min}–{formatNumber(upper, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">{m.writing.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.writing.scale(exam.writingRubric.criteria.length, writingBands, exam.writingRubric.multiplier, exam.writingRubric.maxPoints)}
          </p>
          <ul className="mt-4 space-y-3">
            {exam.writingRubric.criteria.map((c) => (
              <li key={c.id} className="text-sm">
                <div className="font-medium">
                  {c.id}. {c.name} {glosses && <span className="font-normal text-muted-foreground">– {c.nameEn}</span>}
                </div>
                <div className="text-muted-foreground">{c.assesses.join(" · ")}</div>
              </li>
            ))}
          </ul>
          <Link href={`/${exam.slug}/schreiben`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            {m.writing.link}
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">{m.speaking.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.speaking.scale(exam.speakingRubric.criteria.length)} {speakingMaxima(exam, locale, m.speaking.partMax)}.
          </p>
          <ul className="mt-4 space-y-3">
            {exam.speakingRubric.criteria.map((c) => (
              <li key={c.id} className="text-sm">
                <div className="font-medium">
                  {c.name} {glosses && <span className="font-normal text-muted-foreground">– {c.nameEn}</span>}
                </div>
                <div className="text-muted-foreground">{c.assesses.join(" · ")}</div>
              </li>
            ))}
          </ul>
          <Link href={`/${exam.slug}/sprechen`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            {m.speaking.link}
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

function KeyFact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div>
        <div className="font-semibold tabular">{title}</div>
        <div className="text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
