import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { MistakeTrainer } from "@/components/mistakes/mistake-trainer";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.mistakes.page.metaTitle };
}

export default async function MistakesPage() {
  const t = await getT();
  return (
    <PageContainer wide>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <RotateCcw className="size-6" />
          </span>
        }
        title={t.mistakes.page.title}
        description={t.mistakes.page.description}
      />
      <div className="mt-8">
        <MistakeTrainer />
      </div>
    </PageContainer>
  );
}
