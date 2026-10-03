"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import Link from "@/i18n/link";
import { SECTION_UI } from "@/lib/exam/ui";
import { partHref, type SectionDefinition } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { usePartStats } from "@/lib/hooks/use-stats";
import { cn } from "@/lib/utils";

export function PartCards({ examSlug, section, setCounts }: { examSlug: string; section: SectionDefinition; setCounts: Record<string, number> }) {
  const exam = useExam(examSlug);
  const t = useT();
  const locale = useLocale();
  const pc = t.exam.partCards;
  const { byPart, hydrated } = usePartStats(exam);
  const ui = SECTION_UI[section.id];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {section.parts.map((part) => {
        const st = hydrated ? byPart.get(part.id) : undefined;
        const pct = st?.recentPercent ?? null;
        return (
          <Link
            key={part.id}
            href={partHref(exam, part)}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b opacity-70", ui.gradient)} />
            <div className="relative flex items-center justify-between">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ui.bgSoft, ui.text)}>{t.common.teil(part.teil)}</span>
              <span className="text-xs text-muted-foreground">{t.common.setsCount(setCounts[part.id] ?? 0)}</span>
            </div>
            <div className="relative">
              <h3 className="text-lg font-semibold">{part.name}</h3>
              {locale === "en" && <p className="text-sm text-muted-foreground">{part.nameEn}</p>}
            </div>
            <p className="relative text-sm text-foreground/80">{part.description}</p>
            <div className="relative mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {pc.items(part.items)} · {pc.points(part.maxPoints)} · {part.audio ? pc.heard(part.audio.plays) : t.common.minutes(part.minutes)}
                </span>
                <span className="font-medium text-foreground">{pct !== null ? t.exam.percent(pct) : "–"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", ui.bg)} style={{ width: `${pct ?? 0}%` }} />
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-medium", ui.text)}>
                {st?.attempts ? pc.continue : pc.start} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
