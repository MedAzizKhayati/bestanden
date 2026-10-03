import type { Metadata } from "next";
import { BookMarked } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { TopicIndex } from "@/components/grammar/topic-index";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getGrammarTopics } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.grammar.index.metaTitle, description: t.grammar.index.metaDescription };
}

export default async function GrammarIndexPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const all = getGrammarTopics(locale);
  const topics = all.map((topic) => ({
    id: topic.id,
    title: topic.title,
    titleEn: topic.titleEn,
    summary: topic.summary,
    level: topic.level,
    category: topic.category,
    exercises: topic.exercises.length,
    sections: topic.examRelevance,
  }));
  const drills = all.reduce((n, topic) => n + topic.exercises.length, 0);
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookMarked className="size-6" />
          </span>
        }
        eyebrow={`${t.grammar.topics(topics.length)} · ${t.grammar.drills(drills)}`}
        title={t.grammar.index.title}
        description={t.grammar.index.description}
      />
      <div className="mt-8">
        <TopicIndex topics={topics} />
      </div>
    </PageContainer>
  );
}
