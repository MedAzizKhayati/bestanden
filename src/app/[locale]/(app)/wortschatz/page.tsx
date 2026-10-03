import { Languages } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { VocabIndex } from "@/components/vocab/vocab-index";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getVocabThemes } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.vocab.index.metaTitle, description: t.vocab.index.metaDescription };
}

export default async function VocabularyPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const themes = getVocabThemes(locale).map((theme) => ({
    id: theme.id,
    title: theme.title,
    titleEn: theme.titleEn,
    description: theme.description,
    icon: theme.icon,
    wordIds: theme.words.map((w) => w.id),
  }));
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Languages className="size-6" />
          </span>
        }
        eyebrow={t.vocab.index.themes(themes.length)}
        title={t.vocab.index.title}
        description={t.vocab.index.description}
      />
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border px-2.5 py-1">
          <span className="font-semibold text-der">der</span> {t.vocab.index.masculine}
        </span>
        <span className="rounded-full border px-2.5 py-1">
          <span className="font-semibold text-die">die</span> {t.vocab.index.feminine}
        </span>
        <span className="rounded-full border px-2.5 py-1">
          <span className="font-semibold text-das">das</span> {t.vocab.index.neuter}
        </span>
      </div>
      <div className="mt-6">
        <VocabIndex themes={themes} />
      </div>
    </PageContainer>
  );
}
