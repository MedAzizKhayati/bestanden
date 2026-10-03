import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { buildSearchIndex } from "@/lib/content/search";

export default async function AppLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const t = getMessages(locale);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader searchIndex={buildSearchIndex(locale)} />
        <div className="flex-1">{children}</div>
        <footer className="border-t px-4 py-6 text-xs text-muted-foreground sm:px-8">
          <p className="mx-auto max-w-6xl">{t.nav.disclaimer}</p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
