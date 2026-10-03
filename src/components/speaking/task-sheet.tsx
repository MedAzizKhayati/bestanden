"use client";

import { ClipboardList, Quote, UserRound } from "lucide-react";
import { useT } from "@/i18n/client";
import type { OpinionCard } from "@/lib/content/schemas";
import type { SpeakingSet } from "@/lib/ai/speaking-types";
import { cn } from "@/lib/utils";

export function OpinionCardView({ card, theme, label, muted }: { card: OpinionCard; theme: string; label: string; muted?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-paper p-5 text-paper-foreground shadow-xs", muted && "opacity-90")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">{label}</span>
        <span className="rounded-full bg-sprechen/12 px-2.5 py-0.5 font-reading text-sm font-semibold text-sprechen">{theme}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sprechen/15 text-sprechen">
          <UserRound className="size-5" />
        </span>
        <div>
          <div className="font-semibold">{card.name}</div>
          <div className="text-sm text-paper-foreground/70">
            {card.age} Jahre, {card.job}
          </div>
        </div>
      </div>
      <blockquote className="reading relative mt-4 rounded-xl bg-paper-foreground/4 px-4 py-3 text-[15.5px] italic">
        <Quote className="absolute -top-2 -left-1 size-5 rotate-180 text-sprechen/50" />„{card.quote}“
      </blockquote>
    </div>
  );
}

export function TaskSheet({ set, revealPartner }: { set: SpeakingSet; revealPartner?: boolean }) {
  const t = useT();
  if (set.type === "speaking-intro") {
    return (
      <div className="rounded-2xl border bg-paper p-5 text-paper-foreground sm:p-6">
        <div className="mb-1 text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">Teilnehmer/in A und B · Teil 1</div>
        <h3 className="font-reading text-xl font-bold">Einander kennenlernen</h3>
        <p className="mt-2 text-[15px]">Unterhalten Sie sich mit Ihrer Partnerin bzw. Ihrem Partner über folgende Themen:</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {set.points.map((p) => (
            <li key={p} className="flex items-center gap-2 rounded-lg bg-paper-foreground/4 px-3 py-2 text-[15px]">
              <span className="size-1.5 rounded-full bg-sprechen" /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-paper-foreground/70">Die Prüfenden können außerdem weitere Fragen stellen, z. B. {set.extraTopics.join(", ")}.</p>
      </div>
    );
  }
  if (set.type === "speaking-topic") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-4 text-[15px]">
          Sie haben {set.medium} etwas zum Thema „{set.theme}“ gelesen. Berichten Sie Ihrer Gesprächspartnerin/Ihrem Gesprächspartner darüber. Ihre
          Gesprächspartnerin/Ihr Gesprächspartner hat eine andere Meinung dazu gelesen und berichtet Ihnen auch darüber. Unterhalten Sie sich dann über das
          Thema. Sagen Sie Ihre Meinung und erzählen Sie von eigenen Erfahrungen.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <OpinionCardView card={set.cardA} theme={set.theme} label="Ihr Blatt · Teilnehmer/in A" />
          {revealPartner ? (
            <OpinionCardView card={set.cardB} theme={set.theme} label="Blatt Ihres Partners · B" muted />
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t.speaking.taskSheet.partnerHidden}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border bg-paper p-5 text-paper-foreground sm:p-6">
      <div className="mb-1 text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">Teilnehmer/in A und B · Teil 3</div>
      <h3 className="font-reading text-xl font-bold">Gemeinsam etwas planen</h3>
      <p className="reading mt-2 text-[15.5px]">{set.situation}</p>
      <div className="mt-4 rounded-xl border-2 border-dashed border-paper-foreground/25 p-4">
        <div className="mb-2 flex items-center gap-2 font-reading font-semibold">
          <ClipboardList className="size-4" /> {set.title}
        </div>
        <ul className="space-y-1.5 text-[15px]">
          {set.checklist.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sprechen" /> {c}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-sm text-paper-foreground/70">
        Machen Sie Vorschläge und reagieren Sie auf die Vorschläge Ihres Partners. Einigen Sie sich, was zu tun ist und wer welche Aufgabe übernimmt.
      </p>
    </div>
  );
}
