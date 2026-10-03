import { MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { PhraseBrowser } from "@/components/phrases/phrase-browser";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getPhraseBanks } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.phrases.metaTitle, description: t.phrases.metaDescription };
}

export default async function PhrasesPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const banks = getPhraseBanks(locale);
  const count = banks.reduce((n, b) => n + b.groups.reduce((m, g) => m + g.phrases.length, 0), 0);
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareQuote className="size-6" />
          </span>
        }
        eyebrow={t.phrases.count(count)}
        title={t.phrases.title}
        description={t.phrases.description}
      />
      <div className="mt-8">
        <PhraseBrowser banks={banks} />
      </div>
    </PageContainer>
  );
}
