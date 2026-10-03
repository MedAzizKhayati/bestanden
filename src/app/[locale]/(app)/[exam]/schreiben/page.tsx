import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { PartFacts, StrategyCard } from "@/components/exam/part-info";
import { SetGrid } from "@/components/exam/set-grid";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getSets, getStrategy } from "@/lib/content/load";
import { SECTION_UI } from "@/lib/exam/ui";
import { getSection, setHref } from "@/lib/exams";
import { examParams, requireExam } from "@/lib/exams/resolve";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = examParams;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.writing.meta.title, description: t.writing.meta.description };
}

const STRUCTURE = [
  { part: "Betreff", informal: "Deine Einladung zum Sommerfest", formal: "Ihre Anfrage zum Ausflug am 12. Juni" },
  { part: "Anrede", informal: "Liebe Sara, / Lieber Jonas, / Hallo Max,", formal: "Sehr geehrte Frau Weber, / Sehr geehrter Herr Kaya," },
  { part: "Einleitung", informal: "vielen Dank für deine E-Mail! Ich habe mich sehr gefreut, von dir zu hören.", formal: "vielen Dank für Ihre E-Mail. Gern antworte ich Ihnen auf Ihre Fragen." },
  { part: "Leitpunkte 1–4", informal: "Leider kann ich am Samstag nicht kommen, weil … Deshalb schlage ich vor, dass … Außerdem …", formal: "Leider ist es mir am Montag nicht möglich, … Wäre es vielleicht möglich, … ? Außerdem möchte ich Sie fragen, ob …" },
  { part: "Schluss", informal: "Ich freue mich schon auf unser Treffen! Schreib mir bald.", formal: "Ich freue mich auf Ihre Antwort. Für Rückfragen stehe ich gern zur Verfügung." },
  { part: "Gruß", informal: "Viele Grüße / Liebe Grüße\nDein(e) Amir", formal: "Mit freundlichen Grüßen\nAmir Haddad" },
];

export default async function SchreibenPage(props: PageProps<"/[locale]/[exam]/schreiben">) {
  const locale = await getLocale();
  const t = getMessages(locale).writing.page;
  const exam = requireExam((await props.params).exam, locale);
  const section = getSection(exam, "schreiben")!;
  const part = section.parts[0];
  const ui = SECTION_UI.schreiben;
  const sets = getSets(exam.id, part.id, locale).flatMap(({ number, set }) =>
    set.type === "writing-email"
      ? [
          {
            id: set.id,
            number,
            title: set.title,
            topic: set.topic,
            difficulty: set.difficulty,
            href: setHref(exam, part, number),
            badge: set.register === "informal" ? "du" : "Sie",
          },
        ]
      : [],
  );

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: section.short }]}
        icon={
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", ui.bgSoft, ui.text)}>
            <ui.icon className="size-6" />
          </span>
        }
        eyebrow={[locale === "en" ? section.nameEn : null, t.minutes(part.minutes), t.points(part.maxPoints)].filter(Boolean).join(" · ")}
        title={section.name}
        description={`${section.description} ${part.description}`}
      >
        <PartFacts exam={exam} part={part} />
      </PageHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t.tasks}</h2>
            <SetGrid examId={exam.id} sets={sets} maxPoints={part.maxPoints} accent={cn(ui.bgSoft, ui.text)} />
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">{t.structure.title}</h2>
              <p className="text-sm text-muted-foreground">{t.structure.text}</p>
            </div>
            <div className="divide-y">
              <div className="hidden grid-cols-[140px_1fr_1fr] gap-4 bg-muted/40 px-5 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase md:grid">
                <span>{t.structure.part}</span>
                <span>{t.structure.informal}</span>
                <span>{t.structure.semiformal}</span>
              </div>
              {STRUCTURE.map((row) => (
                <div key={row.part} className="grid gap-2 px-5 py-3 md:grid-cols-[140px_1fr_1fr] md:gap-4">
                  <span className="text-sm font-semibold text-schreiben">{row.part}</span>
                  <span className="reading text-[14.5px] whitespace-pre-line">{row.informal}</span>
                  <span className="reading text-[14.5px] whitespace-pre-line text-foreground/85">{row.formal}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">{t.marking.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.marking.text}</p>
            <ul className="mt-3 space-y-3">
              {exam.writingRubric.criteria.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="font-medium">
                    {c.id}. {c.name}
                  </div>
                  <div className="text-muted-foreground">{c.bands[0].descriptor}</div>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2 border-t pt-3 text-xs text-muted-foreground">
              {exam.writingRubric.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </div>
          <StrategyCard guide={getStrategy(exam.id, part.id, locale)} href={`/${exam.slug}/strategien#schreiben`} />
        </aside>
      </div>
    </PageContainer>
  );
}
