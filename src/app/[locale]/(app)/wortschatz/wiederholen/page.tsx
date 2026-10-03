import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ReviewSession } from "@/components/vocab/review-session";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getVocabThemes } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.vocab.review.metaTitle };
}

export default async function ReviewPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const words = getVocabThemes(locale).flatMap((theme) => theme.words.map((w) => ({ ...w, themeId: theme.id })));
  return (
    <PageContainer>
      <PageHeader
        crumbs={[{ label: t.vocab.index.title, href: "/wortschatz" }, { label: t.vocab.review.crumb }]}
        title={t.vocab.review.title}
        description={t.vocab.review.description}
      />
      <div className="mt-8">
        <ReviewSession words={words} />
      </div>
    </PageContainer>
  );
}
