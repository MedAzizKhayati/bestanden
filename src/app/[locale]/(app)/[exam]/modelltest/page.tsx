import { Headphones, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { MockList } from "@/components/mock/mock-list";
import { getMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getSet } from "@/lib/content/load";
import { listMocks } from "@/lib/exam/mock-server";
import { examParams, requireExam } from "@/lib/exams/resolve";
import Link from "@/i18n/link";
import { listOfficialTests } from "@/lib/official/tests";

export const dynamicParams = false;
export const generateStaticParams = examParams;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.mock.page.metaTitle, description: t.mock.page.metaDescription };
}

export default async function MockListPage(props: PageProps<"/[locale]/[exam]/modelltest">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  const exam = requireExam((await props.params).exam, locale);
  const mocks = listMocks(exam).map((m) => ({
    id: `${exam.id}-${m.id}`,
    title: t.mock.title(m.k),
    href: `/${exam.slug}/modelltest/${m.id}`,
    topics: ["lesen-2", "hoeren-2", "schreiben", "lesen-3"].map((p) => getSet(exam.id, p, m.numbers[p], locale)?.title ?? ""),
  }));
  return (
    <PageContainer wide>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: t.mock.page.crumb }]}
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Trophy className="size-6" />
          </span>
        }
        title={t.mock.page.title}
        description={t.mock.page.description}
      />
      <div className="mt-8">
        <MockList mocks={mocks} />
      </div>
      {listOfficialTests(exam.id).length > 0 && (
        <Link
          href={`/${exam.slug}/offiziell`}
          className="mt-6 flex items-center gap-4 rounded-2xl border border-hoeren/30 bg-hoeren/5 p-5 transition-colors hover:bg-hoeren/10"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-hoeren text-white">
            <Headphones className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.official.title}</span>
            <span className="block text-sm text-muted-foreground">{t.official.badge}</span>
          </span>
          <span className="text-sm font-medium text-primary">{t.official.card.open} →</span>
        </Link>
      )}
      <p className="mt-6 text-sm text-muted-foreground">{t.mock.page.tip}</p>
    </PageContainer>
  );
}
