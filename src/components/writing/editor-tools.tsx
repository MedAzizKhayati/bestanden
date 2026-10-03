"use client";

import { CheckCircle2, CircleAlert, CircleDashed, MessageSquareQuote, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocale, useT } from "@/i18n/client";
import { useSettings } from "@/lib/store/settings";
import type { LiveCheck } from "@/lib/writing/checks";
import { cn } from "@/lib/utils";

const CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü", "„", "“", "–", "€"];

export function UmlautBar({ onInsert, disabled }: { onInsert: (s: string) => void; disabled?: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1" aria-label={t.writing.tools.insertChars}>
      {CHARS.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          // Keep focus (and the cursor position) in the textarea.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(c)}
          className="grid h-7 min-w-7 place-items-center rounded-md border bg-background px-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export interface PhraseGroup {
  title: string;
  titleEn: string;
  phrases: { de: string; en: string; note?: string }[];
}

/** English translation of German learning material (phrases, vocabulary). Follows the "show English" setting. */
export function Translation({ children, className }: { children: ReactNode; className?: string }) {
  const show = useSettings((s) => s.showEnglish);
  return show ? <span className={className}>{children}</span> : null;
}

export function PhraseSheet({ groups, onInsert, disabled }: { groups: PhraseGroup[]; onInsert: (s: string) => void; disabled?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const showEnglish = useSettings((s) => s.showEnglish);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <MessageSquareQuote /> Redemittel
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Redemittel</SheetTitle>
          <SheetDescription>{t.writing.tools.phrasesHint}</SheetDescription>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.writing.tools.phrasesSearch}
            className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {groups.map((g) => {
            const items = g.phrases.filter((p) => !q || p.de.toLowerCase().includes(q) || p.en.toLowerCase().includes(q) || g.titleEn.toLowerCase().includes(q));
            if (!items.length) return null;
            return (
              <div key={g.title}>
                <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {g.title}
                  {locale === "en" && <span className="font-normal normal-case"> · {g.titleEn}</span>}
                </div>
                <ul className="space-y-1">
                  {items.map((p) => {
                    const sub = [showEnglish ? p.en : "", p.note ?? ""].filter(Boolean).join(" · ");
                    return (
                      <li key={p.de}>
                        <button
                          type="button"
                          onClick={() => {
                            onInsert(p.de);
                            setOpen(false);
                          }}
                          className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-accent"
                        >
                          <Plus className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{p.de}</span>
                            {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LiveChecksList({ checks }: { checks: LiveCheck[] }) {
  return (
    <ul className="space-y-2">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2.5 text-sm">
          {c.status === "ok" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : c.status === "warn" ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          ) : (
            <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0">
            <span className={cn("font-medium", c.status === "warn" && "text-warning-foreground dark:text-warning")}>{c.label}</span>
            <span className="block text-xs text-muted-foreground">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
