"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "@/i18n/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import { GRAMMAR_CATEGORIES, type GrammarCategoryKey as GrammarCategory } from "@/lib/content/constants";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";

export interface TopicCard {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  level: string;
  category: GrammarCategory;
  exercises: number;
  sections: string[];
}

const SECTION_LABEL: Record<string, string> = {
  lesen: "Lesen",
  sprachbausteine: "Sprachbausteine",
  hoeren: "Hören",
  schreiben: "Schreiben",
  sprechen: "Sprechen",
};

export function TopicIndex({ topics }: { topics: TopicCard[] }) {
  const t = useT();
  const locale = useLocale();
  const hydrated = useHydrated();
  const grammar = useProgress((s) => s.grammar);
  const [level, setLevel] = useState<"all" | "A2" | "B1">("all");

  const mastery = useMemo(() => {
    const m: Record<string, number> = {};
    for (const topic of topics) {
      const r = grammar[topic.id]?.results;
      m[topic.id] = r ? Object.values(r).filter(Boolean).length / topic.exercises : 0;
    }
    return m;
  }, [grammar, topics]);

  const visible = topics.filter((topic) => level === "all" || topic.level === level);
  const mastered = hydrated ? topics.filter((topic) => mastery[topic.id] >= 0.8).length : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{mastered}</span> {t.grammar.index.masteredOf(topics.length)}
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={level} onValueChange={(v) => v && setLevel(v as typeof level)}>
          <ToggleGroupItem value="all">{t.common.all}</ToggleGroupItem>
          <ToggleGroupItem value="A2">{t.grammar.index.levelA2}</ToggleGroupItem>
          <ToggleGroupItem value="B1">{t.grammar.index.levelB1}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(Object.keys(GRAMMAR_CATEGORIES) as GrammarCategory[]).map((cat) => {
        const list = visible.filter((topic) => topic.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">{GRAMMAR_CATEGORIES[cat]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((topic) => {
                const pct = hydrated ? Math.round(mastery[topic.id] * 100) : 0;
                return (
                  <Link
                    key={topic.id}
                    href={`/grammatik/${topic.id}`}
                    className="group flex flex-col gap-2 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="leading-snug font-semibold">{topic.title}</div>
                        {locale === "en" && <div className="text-sm text-muted-foreground">{topic.titleEn}</div>}
                      </div>
                      <Badge variant={topic.level === "B1" ? "default" : "secondary"} className="shrink-0">
                        {topic.level}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground/75">{topic.summary}</p>
                    <div className="mt-auto flex flex-wrap gap-1 pt-1">
                      {topic.sections.map((s) => (
                        <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {SECTION_LABEL[s] ?? s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", pct >= 80 ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
                      </div>
                      {pct >= 80 ? (
                        <CircleCheck className="size-4 text-success" />
                      ) : (
                        <span className="text-muted-foreground tabular">{formatNumber(pct / 100, locale, { style: "percent" })}</span>
                      )}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
