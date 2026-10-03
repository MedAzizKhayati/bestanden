"use client";

import { ArrowLeft, ArrowRight, Check, CircleCheck, ClipboardCheck, Gauge, Sparkles, Timer } from "lucide-react";
import { useState } from "react";
import { useSwitchLocale } from "@/components/app/locale-switcher";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import Link from "@/i18n/link";
import { latestPlacement, usePlacement } from "@/lib/store/placement";
import { useProgress } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";

const POINT_ICONS = [Timer, ClipboardCheck, Sparkles];
const DAILY = [15, 30, 45, 60];

/** First visit: what this is, the exam date and daily time, then the level check. */
export function Welcome() {
  const locale = useLocale();
  const t = useT();
  const to = t.onboarding;
  const switchLocale = useSwitchLocale();
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const done = () => settings.update({ onboarded: true });

  return (
    <section className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border bg-linear-to-br from-primary/15 via-card to-card p-6 sm:p-10">
      <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative">
        {step > 0 && <div className="mb-4 text-xs font-semibold tracking-wider text-primary uppercase">{to.goal.step(step, 2)}</div>}

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold tracking-wider text-primary uppercase">{to.welcome.eyebrow}</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{to.welcome.title}</h1>
              <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{to.welcome.lead}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {to.welcome.points.map((p, i) => {
                const Icon = POINT_ICONS[i] ?? CircleCheck;
                return (
                  <li key={p.title} className="rounded-2xl border bg-background/70 p-4">
                    <Icon className="size-5 text-primary" />
                    <div className="mt-2 font-semibold">{p.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2">
              <div className="text-sm font-medium">{to.welcome.language}</div>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    lang={l}
                    aria-pressed={l === locale}
                    onClick={() => l !== locale && switchLocale(l)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors",
                      l === locale ? "border-primary bg-primary/10 font-semibold" : "bg-background/70 hover:bg-muted",
                    )}
                  >
                    {LOCALE_LABELS[l].native}
                    {l === locale && <Check className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{to.welcome.languageHint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => setStep(1)}>
                {to.welcome.start} <ArrowRight />
              </Button>
              <Button variant="ghost" onClick={done}>
                {to.welcome.skip}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{to.goal.title}</h2>
              <p className="mt-1 text-muted-foreground">{to.goal.lead}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={settings.examDate ?? ""}
                onChange={(e) => settings.update({ examDate: e.target.value || undefined })}
                className="h-10 rounded-xl border bg-background px-3 text-sm"
              />
              <Button variant={settings.examDate ? "ghost" : "secondary"} onClick={() => settings.update({ examDate: undefined })}>
                {to.goal.noDate}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{to.goal.daily}</div>
              <div className="flex flex-wrap gap-2">
                {DAILY.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={settings.dailyGoalMinutes === m}
                    onClick={() => settings.update({ dailyGoalMinutes: m })}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm transition-colors",
                      settings.dailyGoalMinutes === m ? "border-primary bg-primary/10 font-semibold" : "bg-background/70 hover:bg-muted",
                    )}
                  >
                    {t.common.minutes(m)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft /> {to.goal.back}
              </Button>
              <Button onClick={() => setStep(2)}>
                {to.goal.next} <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Gauge className="size-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{to.level.title}</h2>
              <p className="mt-1 max-w-2xl text-muted-foreground">{to.level.lead}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {to.level.facts.map((f) => (
                <span key={f} className="rounded-full bg-background/80 px-3 py-1 ring-1 ring-border">
                  {f}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild onClick={done}>
                <Link href="/einstufung">
                  {to.level.start} <ArrowRight />
                </Link>
              </Button>
              <Button variant="ghost" onClick={done}>
                {to.level.later}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft /> {to.goal.back}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Dashboard checklist for the first days. Disappears when everything is done or it is hidden. */
export function FirstSteps({ examSlug, firstPartHref }: { examSlug: string; firstPartHref: string }) {
  const t = useT();
  const fs = t.onboarding.firstSteps;
  const placement = usePlacement(latestPlacement);
  const attempts = useProgress((s) => s.attempts.length);
  const writing = useProgress((s) => s.writing.length);
  const cards = useVocab((s) => Object.keys(s.cards).length);
  const examDate = useSettings((s) => s.examDate);
  const dismissed = useSettings((s) => s.firstStepsDismissed);
  const update = useSettings((s) => s.update);

  const items = [
    { key: "placement", done: !!placement, href: "/einstufung" },
    { key: "exam", done: attempts > 0, href: firstPartHref },
    { key: "date", done: !!examDate, href: "/lernplan" },
    { key: "words", done: cards >= 10, href: "/wortschatz" },
    { key: "writing", done: writing > 0, href: `/${examSlug}/schreiben` },
  ] as const;
  const doneCount = items.filter((i) => i.done).length;
  if (dismissed || doneCount === items.length) return null;

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{fs.title}</h2>
          <p className="text-sm text-muted-foreground">{fs.lead}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular">{fs.progress(doneCount, items.length)}</span>
          <Button variant="ghost" size="sm" onClick={() => update({ firstStepsDismissed: true })}>
            {fs.dismiss}
          </Button>
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => {
          const copy = fs.items[item.key];
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full gap-3 rounded-xl border p-3 text-sm transition-colors hover:bg-muted",
                  item.done && "border-success/30 bg-success/5",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    item.done ? "bg-success text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span>
                  <span className={cn("block font-medium", item.done && "text-muted-foreground line-through")}>{copy.title}</span>
                  <span className="block text-xs text-muted-foreground">{copy.text}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
