import { ChartNoAxesColumn } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ProgressView } from "@/components/progress/progress-view";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.progress.page.metaTitle };
}

export default async function ProgressPage() {
  const t = await getT();
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ChartNoAxesColumn className="size-6" />
          </span>
        }
        title={t.progress.page.title}
        description={t.progress.page.description}
      />
      <div className="mt-8">
        <ProgressView />
      </div>
    </PageContainer>
  );
}
