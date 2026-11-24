"use client";

import { ClipboardList, Quote, UserRound } from "lucide-react";
import { useT } from "@/i18n/client";
import type { OpinionCard, SpeakingDiscussionSet, SpeakingExperienceSet } from "@/lib/content/schemas";
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

export interface TaskSheetProps {
  set: SpeakingSet;
  revealPartner?: boolean;
  /** telc B2 Teil 1: the chosen topic and, while preparing, a way to choose it. */
  choice?: number;
  onChoose?: (index: number) => void;
}

export function TaskSheet({ set, revealPartner, choice, onChoose }: TaskSheetProps) {
  const t = useT();
  if (set.type === "speaking-experience") return <ExperienceSheet set={set} choice={choice} onChoose={onChoose} />;
  if (set.type === "speaking-discussion") return <DiscussionSheet set={set} />;
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
  if (set.examId === "telc-b2")
    return (
      <div className="rounded-2xl border bg-paper p-5 text-paper-foreground sm:p-6">
        <div className="mb-1 text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">Teilnehmer/in A und B · Teil 3</div>
        <h3 className="font-reading text-xl font-bold">Gemeinsam etwas planen</h3>
        <p className="reading mt-2 text-[15.5px]">{set.situation}</p>
        <p className="reading mt-3 text-[15px]">
          Überlegen Sie, wie Sie die Aufgabe lösen können, und machen Sie Ihrer Partnerin bzw. Ihrem Partner Vorschläge. Gehen Sie auf die Vorschläge ein
          und entwickeln Sie dann gemeinsam einen Plan.
        </p>
      </div>
    );
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

/** telc B2 Teil 1 – the sheet with seven topics; the learner picks one (prepared at home in the real exam). */
function ExperienceSheet({ set, choice, onChoose }: { set: SpeakingExperienceSet; choice?: number; onChoose?: (index: number) => void }) {
  const t = useT();
  return (
    <div className="rounded-2xl border bg-paper p-5 text-paper-foreground sm:p-6">
      <div className="mb-1 text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">Teilnehmer/in A/B · Teil 1</div>
      <h3 className="font-reading text-xl font-bold">Über Erfahrungen sprechen</h3>
      <p className="reading mt-2 text-[15px]">
        Sie sollen Ihrer Partnerin bzw. Ihrem Partner über Ihre Erfahrungen zu einem der folgenden Themen berichten. Die Stichpunkte in den Klammern können als
        Anregung dienen. Sie haben dazu ca. 1 ½ Minuten Zeit. Im Anschluss sollen Sie die Fragen Ihrer Partnerin bzw. Ihres Partners beantworten.
      </p>
      <p className="reading mt-2 text-[15px]">
        Danach spricht Ihre Partnerin bzw. Ihr Partner über ihr bzw. sein Thema. Hören Sie aufmerksam zu und stellen Sie danach einige Fragen zum Thema.
      </p>
      <div className="mt-3 text-xs font-semibold tracking-wide text-paper-foreground/60 uppercase">Themen zur Auswahl</div>
      {onChoose && <p className="mt-1 text-sm text-paper-foreground/70">{t.speaking.taskSheet.chooseTopic}</p>}
      <ul className="mt-2 space-y-1.5" role={onChoose ? "radiogroup" : undefined}>
        {set.topics.map((topic, i) => {
          const chosen = choice === i;
          const body = (
            <>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", chosen ? "bg-sprechen" : "bg-paper-foreground/30")} />
              <span>
                <span className="font-semibold">{topic.title}</span> <span className="text-paper-foreground/70">({topic.cues})</span>
              </span>
            </>
          );
          return (
            <li key={topic.title}>
              {onChoose ? (
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => onChoose(i)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-paper-foreground/6",
                    chosen && "bg-sprechen/12 ring-1 ring-sprechen/40",
                  )}
                >
                  {body}
                </button>
              ) : (
                <div className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2 text-[15px]", chosen ? "bg-sprechen/12 ring-1 ring-sprechen/40" : "opacity-60")}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** telc B2 Teil 2 – the newspaper article both candidates read. */
function DiscussionSheet({ set }: { set: SpeakingDiscussionSet }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 text-[15px]">
        Sie haben in der Vorbereitungszeit den folgenden Zeitungsartikel gelesen. Äußern Sie sich zunächst kurz zum Text und geben Sie die Argumente oder Aspekte
        wieder, die Sie interessant finden. Diskutieren Sie dann miteinander: Bringen Sie eigene Argumente, Meinungen und Erfahrungen ein, gehen Sie auf die
        Argumente Ihrer Partnerin bzw. Ihres Partners ein und machen Sie Vorschläge.
      </div>
      <article className="rounded-2xl border bg-paper p-5 text-paper-foreground shadow-xs sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-sprechen/12 px-2.5 py-0.5 font-reading text-sm font-semibold text-sprechen">{set.theme}</span>
          {set.article.source && <span className="text-xs text-paper-foreground/60">{set.article.source}</span>}
        </div>
        <h3 className="font-reading text-xl leading-tight font-bold text-balance">{set.article.headline}</h3>
        {set.article.lead && <p className="reading mt-2 font-semibold">{set.article.lead}</p>}
        <div className="reading mt-3 space-y-3 text-[15.5px]">
          {set.article.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
