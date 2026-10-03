"use client";

import {
  ArrowRight,
  Bike,
  BookOpen,
  Briefcase,
  CalendarClock,
  Cpu,
  FileText,
  Globe,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Leaf,
  Mail,
  Palette,
  PartyPopper,
  Repeat,
  Shirt,
  ShoppingCart,
  Smartphone,
  Smile,
  TrainFront,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "@/i18n/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import { useNow } from "@/lib/hooks/use-now";
import { useHydrated } from "@/lib/store/hydration";
import { useVocab } from "@/lib/store/vocab";

export interface ThemeCard {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  wordIds: string[];
}

const THEME_ICONS: Record<string, LucideIcon> = {
  Bike, BookOpen, Briefcase, CalendarClock, Cpu, FileText, Globe, GraduationCap, HeartPulse, House, Home: House, Landmark, Leaf,
  Mail, Palette, PartyPopper, Shirt, ShoppingCart, Smartphone, Smile, TrainFront, Users, UtensilsCrossed, Zap,
};

function ThemeIcon({ name }: { name: string }) {
  const Icon = THEME_ICONS[name] ?? BookOpen;
  return <Icon className="size-5" />;
}

export function VocabIndex({ themes }: { themes: ThemeCard[] }) {
  const t = useT();
  const locale = useLocale();
  const labels = t.vocab.index;
  const hydrated = useHydrated();
  const cards = useVocab((s) => s.cards);
  const now = useNow();
  const stats = useMemo(() => {
    const all = Object.values(cards);
    return {
      learned: all.length,
      due: all.filter((c) => c.due <= now).length,
      mature: all.filter((c) => c.interval >= 21).length,
    };
  }, [cards, now]);
  const total = themes.reduce((n, theme) => n + theme.wordIds.length, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label={labels.statWords} value={total} />
        <Stat label={labels.statInDeck} value={hydrated ? stats.learned : 0} />
        <Stat label={labels.statMature} value={hydrated ? stats.mature : 0} />
        <div className="flex flex-col justify-between gap-2 rounded-2xl border bg-primary/[0.06] p-4">
          <div>
            <div className="text-2xl font-bold tabular">{hydrated ? stats.due : 0}</div>
            <div className="text-xs text-muted-foreground">{labels.statDue}</div>
          </div>
          <Button asChild size="sm" disabled={!stats.due}>
            <Link href="/wortschatz/wiederholen">
              <Repeat /> {labels.reviewNow}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const learned = hydrated ? theme.wordIds.filter((id) => cards[id]).length : 0;
          const pct = Math.round((learned / theme.wordIds.length) * 100);
          return (
            <Link key={theme.id} href={`/wortschatz/${theme.id}`} className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ThemeIcon name={theme.icon} />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold">{theme.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {locale === "en" && `${theme.titleEn} · `}
                    {t.common.words(theme.wordIds.length)}
                  </div>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-foreground/75">{theme.description}</p>
              <div className="mt-auto flex items-center gap-2 text-xs">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-muted-foreground tabular">
                  {learned}/{theme.wordIds.length}
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-2xl font-bold tabular">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
