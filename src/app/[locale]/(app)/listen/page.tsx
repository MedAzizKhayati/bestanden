import { ArrowRight, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/i18n/link";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getReferenceLists } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.lists.index.metaTitle, description: t.lists.index.metaDescription };
}

export default async function ListsPage() {
  const locale = await getLocale();
  const t = getMessages(locale);
  const lists = getReferenceLists(locale);
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="size-6" />
          </span>
        }
        title={t.lists.index.title}
        description={t.lists.index.description}
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lists.map((l) => (
          <Link key={l.id} href={`/listen/${l.id}`} className="group flex flex-col gap-2 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{l.title}</div>
                {locale === "en" && <div className="text-sm text-muted-foreground">{l.titleEn}</div>}
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular">{l.items.length}</span>
            </div>
            <p className="text-sm text-foreground/75">{l.description}</p>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
              {t.common.open} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
