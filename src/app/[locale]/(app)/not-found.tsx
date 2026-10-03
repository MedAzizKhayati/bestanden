"use client";

import { Compass } from "lucide-react";
import { PageContainer } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { DEFAULT_EXAM } from "@/lib/exams";

export default function NotFound() {
  const t = useT();
  return (
    <PageContainer className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t.nav.notFoundTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.nav.notFoundText}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">{t.nav.dashboard}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${DEFAULT_EXAM.slug}`}>{t.nav.examOverview}</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
