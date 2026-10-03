import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ListView } from "@/components/lists/list-view";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getReferenceList, getReferenceLists } from "@/lib/content/load";

export const dynamicParams = false;

export function generateStaticParams() {
  return getReferenceLists().map((l) => ({ list: l.id }));
}

export async function generateMetadata(props: PageProps<"/[locale]/listen/[list]">): Promise<Metadata> {
  const locale = await getLocale();
  const l = getReferenceList((await props.params).list, locale);
  if (!l) return { title: getMessages(locale).lists.list.metaFallback };
  return { title: locale === "en" ? `${l.title} – ${l.titleEn}` : l.title, description: l.description };
}

export default async function ListPage(props: PageProps<"/[locale]/listen/[list]">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  const list = getReferenceList((await props.params).list, locale);
  if (!list) notFound();
  const eyebrow = [locale === "en" ? list.titleEn : null, t.lists.list.entries(list.items.length)].filter(Boolean).join(" · ");
  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: t.lists.index.title, href: "/listen" }, { label: list.title }]}
        eyebrow={eyebrow}
        title={list.title}
        description={list.description}
      />
      <div className="mt-6">
        <ListView list={list} />
      </div>
    </PageContainer>
  );
}
