import { Headphones, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { getLocale, getT } from "@/i18n/server";
import Link from "@/i18n/link";
import { listOfficialTests } from "@/lib/official/tests";
import { requireExam } from "@/lib/exams/resolve";

// Lists files on this computer (private/, gitignored) – never statically generated.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.official.metaTitle, description: t.official.metaDescription, robots: { index: false } };
}

export default async function OfficialTestsPage(props: PageProps<"/[locale]/[exam]/offiziell">) {
  const locale = await getLocale();
  const t = (await getT()).official;
  const exam = requireExam((await props.params).exam, locale);
  const tests = listOfficialTests(exam.id);
  return (
    <PageContainer>
      <PageHeader
        crumbs={[{ label: exam.name, href: `/${exam.slug}` }, { label: t.title }]}
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-hoeren/15 text-hoeren">
            <Headphones className="size-6" />
          </span>
        }
        title={t.title}
        description={t.lead}
      />
      <div className="mt-6 space-y-3">
        {tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6">
            <h2 className="font-semibold">{t.none.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.none.text}</p>
          </div>
        ) : (
          tests.map((test) => (
            <Link
              key={test.id}
              href={`/${exam.slug}/offiziell/${test.id}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/50"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-hoeren text-white">
                <Headphones className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{test.title}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {test.audioUrl && <Badge variant="secondary">MP3</Badge>}
                  {test.bookletUrl && <Badge variant="secondary">{t.card.booklet}</Badge>}
                  {!test.key && <Badge variant="outline">{t.card.noKey}</Badge>}
                </span>
              </span>
              <span className="text-sm font-medium text-primary">{t.card.open} →</span>
            </Link>
          ))
        )}
        <p className="flex gap-2 pt-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" /> {t.notice}
        </p>
      </div>
    </PageContainer>
  );
}
