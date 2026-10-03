import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.settings.page.metaTitle };
}

export default async function SettingsPage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader
        icon={
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted">
            <Settings className="size-6" />
          </span>
        }
        title={t.settings.page.title}
        description={t.settings.page.description}
      />
      <div className="mt-8">
        <SettingsView />
      </div>
    </PageContainer>
  );
}
