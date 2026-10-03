import { ArrowRight, Dumbbell } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/i18n/link";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { GrammarBlocks, MistakesList } from "@/components/grammar/blocks";
import { GrammarPractice } from "@/components/grammar/grammar-practice";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getGrammarTopic, getGrammarTopics } from "@/lib/content/load";
import { GRAMMAR_CATEGORIES } from "@/lib/content/schemas";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGrammarTopics().map((t) => ({ topic: t.id }));
}

export async function generateMetadata(props: PageProps<"/[locale]/grammatik/[topic]">): Promise<Metadata> {
  const locale = await getLocale();
  const topic = getGrammarTopic((await props.params).topic, locale);
  if (!topic) return { title: getMessages(locale).grammar.topic.metaFallback };
  return { title: locale === "en" ? `${topic.title} – ${topic.titleEn}` : topic.title, description: topic.summary };
}

const SECTION_LABEL: Record<string, string> = {
  lesen: "Lesen",
  sprachbausteine: "Sprachbausteine",
  hoeren: "Hören",
  schreiben: "Schreiben",
  sprechen: "Sprechen",
};

export default async function GrammarTopicPage(props: PageProps<"/[locale]/grammatik/[topic]">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  const topic = getGrammarTopic((await props.params).topic, locale);
  if (!topic) notFound();
  const all = getGrammarTopics(locale);
  const related = topic.related.map((id) => all.find((x) => x.id === id)).filter(Boolean) as typeof all;
  const idx = all.findIndex((x) => x.id === topic.id);
  const next = all[idx + 1];

  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: t.grammar.index.title, href: "/grammatik" }, { label: GRAMMAR_CATEGORIES[topic.category] }]}
        eyebrow={
          <span className="flex flex-wrap items-center gap-2 normal-case">
            <Badge>{topic.level}</Badge>
            {topic.examRelevance.map((s) => (
              <Badge key={s} variant="secondary">
                {SECTION_LABEL[s]}
              </Badge>
            ))}
          </span>
        }
        title={topic.title}
        description={
          locale === "en" ? (
            <>
              <span className="font-medium text-foreground">{topic.titleEn}.</span> {topic.summary}
            </>
          ) : (
            topic.summary
          )
        }
        actions={
          <a href="#ueben" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Dumbbell className="size-4" /> {t.grammar.drills(topic.exercises.length)}
          </a>
        }
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 space-y-10">
          <GrammarBlocks blocks={topic.blocks} />

          <section>
            <h2 className="mb-3 text-xl font-semibold tracking-tight">{t.grammar.topic.mistakesTitle}</h2>
            <MistakesList mistakes={topic.mistakes} />
          </section>

          <section id="ueben" className="scroll-mt-20">
            <h2 className="mb-1 text-xl font-semibold tracking-tight">{t.grammar.topic.practiceTitle}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t.grammar.topic.practiceIntro}</p>
            <GrammarPractice topicId={topic.id} exercises={topic.exercises} />
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {related.length > 0 && (
            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-2 text-sm font-semibold">{t.grammar.topic.related}</div>
              <ul className="space-y-1">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/grammatik/${r.id}`} className="block rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                      <span className="font-medium">{r.title}</span>
                      {locale === "en" && <span className="block text-xs text-muted-foreground">{r.titleEn}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {next && (
            <Link href={`/grammatik/${next.id}`} className="group flex items-center justify-between gap-2 rounded-2xl border bg-card p-4 text-sm hover:bg-muted/40">
              <span>
                <span className="block text-xs text-muted-foreground">{t.grammar.topic.nextTopic}</span>
                <span className="font-medium">{next.title}</span>
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
