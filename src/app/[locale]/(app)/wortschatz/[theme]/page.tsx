import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ThemeView } from "@/components/vocab/theme-view";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getVocabTheme, getVocabThemes } from "@/lib/content/load";

export const dynamicParams = false;

export function generateStaticParams() {
  return getVocabThemes().map((t) => ({ theme: t.id }));
}

export async function generateMetadata(props: PageProps<"/[locale]/wortschatz/[theme]">): Promise<Metadata> {
  const locale = await getLocale();
  const t = getMessages(locale);
  const theme = getVocabTheme((await props.params).theme, locale);
  return { title: theme ? t.vocab.theme.metaTitle(theme.title) : t.vocab.theme.metaFallback, description: theme?.description };
}

export default async function ThemePage(props: PageProps<"/[locale]/wortschatz/[theme]">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  const theme = getVocabTheme((await props.params).theme, locale);
  if (!theme) notFound();
  const words = theme.words.map((w) => ({ ...w, themeId: theme.id }));
  const eyebrow = [locale === "en" ? theme.titleEn : null, t.common.words(theme.words.length), theme.level].filter(Boolean).join(" · ");
  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: t.vocab.index.title, href: "/wortschatz" }, { label: theme.title }]}
        eyebrow={eyebrow}
        title={theme.title}
        description={theme.description}
      />
      <div className="mt-6">
        <ThemeView words={words} />
      </div>
    </PageContainer>
  );
}
