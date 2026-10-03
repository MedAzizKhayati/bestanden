import { AlertTriangle, CheckCircle2, Clock, Lightbulb } from "lucide-react";
import { formatNumber } from "@/i18n/format";
import Link from "@/i18n/link";
import { getLocale, getT } from "@/i18n/server";
import type { StrategyGuide } from "@/lib/content/schemas";
import type { ExamDefinition, PartDefinition } from "@/lib/exams";

/* Server Components: they read the UI language of the request themselves. */

export async function PartFacts({ exam, part }: { exam: ExamDefinition; part: PartDefinition }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const f = t.exam.partFacts;
  const share = Math.round((part.maxPoints / exam.totalPoints) * 1000) / 10;
  const facts = [
    part.items ? { label: t.common.items, value: f.itemsValue(part.items, part.firstItem, part.firstItem + part.items - 1) } : null,
    { label: t.common.points, value: part.items ? f.pointsValue(part.maxPoints, formatNumber(part.pointsPerItem, locale)) : String(part.maxPoints) },
    part.audio ? { label: f.recording, value: f.played(part.audio.plays) } : { label: f.time, value: t.common.minutes(part.minutes) },
    { label: f.share, value: t.exam.percent(formatNumber(share, locale)) },
  ].filter(Boolean) as { label: string; value: string }[];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {facts.map((f) => (
        <div key={f.label} className="rounded-xl border bg-card px-3 py-2.5">
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{f.label}</dt>
          <dd className="mt-0.5 text-sm font-semibold">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function StrategyCard({ guide, href }: { guide?: StrategyGuide; href?: string }) {
  if (!guide) return null;
  const s = (await getT()).exam.strategyCard;
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-gold/15 text-gold">
          <Lightbulb className="size-4" />
        </span>
        <h3 className="font-semibold">{s.title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{guide.summary}</p>
      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3 text-sm">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
            <span>
              <span className="font-medium">{step.title}.</span> <span className="text-muted-foreground">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="rounded-xl bg-destructive/6 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4" /> {s.traps}
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
          {guide.traps.map((trap) => (
            <li key={trap}>{trap}</li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 rounded-xl bg-muted/60 p-3 text-sm">
        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{guide.timeAdvice}</span>
      </div>
      <div>
        <div className="mb-1.5 text-sm font-medium">{s.checklist}</div>
        <ul className="space-y-1.5">
          {guide.checklist.map((c) => (
            <li key={c} className="flex gap-2 text-sm text-foreground/85">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {c}
            </li>
          ))}
        </ul>
      </div>
      {href && (
        <Link href={href} className="inline-block text-sm font-medium text-primary hover:underline">
          {s.all}
        </Link>
      )}
    </div>
  );
}
