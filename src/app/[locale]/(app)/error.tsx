"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { PageContainer } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <PageContainer className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t.nav.errorTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.nav.errorText}</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> {t.common.tryAgain}
        </Button>
      </div>
    </PageContainer>
  );
}
