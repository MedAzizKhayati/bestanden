"use client";

import { Copy, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeakButton } from "@/components/vocab/word-bits";
import { useLocale, useT } from "@/i18n/client";
import type { PhraseBank } from "@/lib/content/schemas";
import { spokenPhrase } from "@/lib/content/spoken";

export function PhraseBrowser({ banks }: { banks: PhraseBank[] }) {
  const t = useT();
  const locale = useLocale();
  const labels = t.phrases;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const match = (de: string, en: string) => !q || de.toLowerCase().includes(q) || en.toLowerCase().includes(q);

  return (
    <div className="space-y-5">
      <label className="relative block max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="h-10 w-full rounded-xl border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <Tabs defaultValue={banks[0]?.id}>
        <TabsList className="h-auto flex-wrap justify-start">
          {banks.map((b) => (
            <TabsTrigger key={b.id} value={b.id}>
              {b.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {banks.map((b) => (
          <TabsContent key={b.id} value={b.id} className="mt-5 space-y-4">
            <p className="max-w-3xl text-sm text-muted-foreground">
              {locale === "en" && (
                <>
                  <span className="font-medium text-foreground">{b.titleEn}.</span>{" "}
                </>
              )}
              {b.description}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {b.groups.map((g) => {
                const items = g.phrases.filter((p) => match(p.de, p.en));
                if (!items.length) return null;
                return (
                  <section key={g.title} className="rounded-2xl border bg-card p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{g.title}</h3>
                      {locale === "en" && <span className="text-sm text-muted-foreground">{g.titleEn}</span>}
                      {labels.register[g.register] && <Badge variant="secondary">{labels.register[g.register]}</Badge>}
                    </div>
                    <ul className="divide-y">
                      {items.map((p) => (
                        <li key={p.de} className="group flex items-start gap-2 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="reading text-[15px] font-medium">{p.de}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.en}
                              {p.note && <span className="ml-1 rounded bg-muted px-1 py-0.5">{p.note}</span>}
                            </div>
                          </div>
                          <SpeakButton text={spokenPhrase(p.de)} className="size-7" />
                          <button
                            type="button"
                            aria-label={labels.copyPhrase}
                            onClick={() => {
                              navigator.clipboard?.writeText(p.de);
                              toast.success(t.common.copied);
                            }}
                            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
