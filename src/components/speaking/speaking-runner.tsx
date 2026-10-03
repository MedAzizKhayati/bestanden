"use client";

import { ArrowLeft, Bot, CheckCircle2, Hourglass, Lightbulb, Loader2, Mic, PlayCircle, RotateCcw, Sparkles, StopCircle, Timer } from "lucide-react";
import Link from "@/i18n/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/exam/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import type { SpeakingSet, Turn } from "@/lib/ai/speaking-types";
import type { GlossaryEntry } from "@/lib/content/schemas";
import type { PartDefinition, SpeakingRubric } from "@/lib/exams";
import { useSecondsLeft } from "@/lib/hooks/use-countdown";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useHydrated } from "@/lib/store/hydration";
import { uid, useProgress, type SpeakingFeedback } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";
import { Conversation } from "./conversation";
import { ModelDialogue } from "./model-dialogue";
import { RolePlay } from "./role-play";
import { Monologue } from "./monologue";
import { SpeakingFeedbackView } from "./speaking-feedback";
import { TaskSheet } from "./task-sheet";
import { aiFetch, useAiAvailability } from "@/lib/ai/request";

export interface SpeakingRunnerProps {
  examId: string;
  part: PartDefinition;
  set: SpeakingSet;
  setNumber: string;
  rubric: SpeakingRubric;
  phraseGroups: { title: string; titleEn: string; phrases: { de: string; en: string; note?: string }[] }[];
  links: { part: string; next?: string };
  tips: string[];
}

const PREP_SECONDS: Record<string, number> = { "sprechen-1": 60, "sprechen-2": 300, "sprechen-3": 300 };

function monologuePrompt(set: SpeakingSet, m: Messages["speaking"]["monologuePrompt"]): string {
  if (set.type === "speaking-intro") return m.intro;
  if (set.type === "speaking-topic") return m.topic(set.cardA.name, set.theme);
  return m.planning;
}

/** null while unknown; true with the user's own key or the server's AI. */
function useAiAvailable() {
  const ai = useAiAvailability();
  return ai.ready ? ai.available : null;
}

export function SpeakingRunner(props: SpeakingRunnerProps) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-[32rem] rounded-2xl" />;
  return <Runner {...props} />;
}

type Phase = "prepare" | "speak" | "feedback";
type Mode = "partner" | "monologue";

function Runner({ examId, part, set, setNumber, rubric, phraseGroups, links, tips }: SpeakingRunnerProps) {
  const strict = useSettings((s) => s.strictTimer);
  const updateSettings = useSettings((s) => s.update);
  const saveSpeaking = useProgress((s) => s.saveSpeaking);
  const history = useProgress((s) => s.speaking);
  const previous = useMemo(() => history.filter((h) => h.setId === set.id), [history, set.id]);
  const aiAvailable = useAiAvailable();
  const t = useT();
  const locale = useLocale();
  const r = t.speaking.runner;
  const selfCheck: string[] = t.speaking.selfCheck[part.id as keyof Messages["speaking"]["selfCheck"]] ?? [];

  const [tab, setTab] = useState("practice");
  const [phase, setPhase] = useState<Phase>("prepare");
  const [chosenMode, setMode] = useState<Mode>("partner");
  const mode: Mode = aiAvailable === false ? "monologue" : chosenMode;
  const [prepEndsAt, setPrepEndsAt] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [speakStartedAt, setSpeakStartedAt] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [ended, setEnded] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [fbState, setFbState] = useState<"idle" | "loading" | "error">("idle");
  const [fbError, setFbError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [revealB, setRevealB] = useState(false);
  const [durationSec, setDurationSec] = useState(0);


  useFocusMode(phase === "speak");
  const prepLeft = useSecondsLeft(prepEndsAt);
  const prepSeconds = PREP_SECONDS[part.id] ?? 120;
  const partner = set.speakers.find((s) => s.id === "B") ?? { id: "B", gender: "f" as const, age: "adult" as const, name: "Lena" };
  const userName = "Ich";
  const speakLimit = (part.speaking?.minutes ?? part.minutes) * 60;

  const beginPrep = () => setPrepEndsAt(Date.now() + prepSeconds * 1000);
  const beginSpeaking = useCallback(() => {
    setPrepEndsAt(null);
    setPhase("speak");
    setSpeakStartedAt(Date.now());
    setTurns([]);
    setEnded(false);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!prepEndsAt) return;
    const timer = setTimeout(() => {
      toast.info(r.prepOver);
      beginSpeaking();
    }, Math.max(0, prepEndsAt - Date.now()));
    return () => clearTimeout(timer);
  }, [prepEndsAt, beginSpeaking, r.prepOver]);

  const fallbackError = r.aiFailedFallback;
  const requestFeedback = useCallback(
    async (allTurns: Turn[], seconds: number) => {
      const recordId = uid();
      const transcript = allTurns.map((turn) => `${turn.role === "user" ? "Ich" : (partner.name ?? "Partner")}: ${turn.text}`).join("\n");
      saveSpeaking({ id: recordId, examId, partId: part.id, setId: set.id, transcript, durationSec: Math.round(seconds), createdAt: Date.now() });
      if (!aiAvailable) return;
      setFbState("loading");
      setFbError(null);
      try {
        const res = await aiFetch("/api/ai/sprechen", { examId, partId: part.id, setNumber, turns: allTurns, durationSec: Math.round(seconds), locale });
        const data = (await res.json().catch(() => ({}))) as { feedback?: SpeakingFeedback; error?: string };
        if (!res.ok || !data.feedback) {
          // Show the server's message as it arrives; our own text only when there is none.
          setFbState("error");
          setFbError(data.error || fallbackError);
          return;
        }
        setFeedback(data.feedback);
        saveSpeaking({ id: recordId, examId, partId: part.id, setId: set.id, transcript, durationSec: Math.round(seconds), createdAt: Date.now(), feedback: data.feedback });
        setFbState("idle");
      } catch {
        setFbState("error");
        setFbError(fallbackError);
      }
    },
    [aiAvailable, examId, part.id, partner.name, saveSpeaking, set.id, setNumber, locale, fallbackError],
  );

  const finish = useCallback(
    (allTurns: Turn[], seconds?: number) => {
      const secs = seconds ?? (speakStartedAt ? (Date.now() - speakStartedAt) / 1000 : 0);
      setEnded(true);
      setDurationSec(secs);
      setPhase("feedback");
      setRevealB(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      void requestFeedback(allTurns, secs);
    },
    [requestFeedback, speakStartedAt],
  );

  const restart = () => {
    setPhase("prepare");
    setTurns([]);
    setFeedback(null);
    setFbState("idle");
    setChecked({});
    setNotes("");
    setRevealB(false);
  };

  const partnerStarts = set.type !== "speaking-topic";

  const practice = (
    <div className="space-y-5">
      {phase === "prepare" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <TaskSheet set={set} revealPartner={revealB} />
            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Notizen</span>
                <span className="text-xs text-muted-foreground">{r.notesHint}</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="• Meinung: …&#10;• Erfahrung: …&#10;• Frage an Partner: …"
                className="min-h-28 w-full resize-y rounded-xl border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                lang="de"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Hourglass className="size-4 text-sprechen" /> {r.preparation}
              </div>
              {prepEndsAt ? (
                <div className="mt-3 font-mono text-4xl font-semibold tabular">{formatClock(prepLeft)}</div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{r.prepText(Math.round(prepSeconds / 60))}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {!prepEndsAt && (
                  <Button variant="outline" onClick={beginPrep}>
                    <Timer /> {r.startPrep}
                  </Button>
                )}
                <Button onClick={beginSpeaking} className="bg-sprechen text-white hover:bg-sprechen/90">
                  <Mic /> {prepEndsAt ? r.readyStart : r.startSpeaking}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-2 text-sm font-semibold">{r.modeTitle}</div>
              <div className="space-y-2">
                <ModeButton
                  active={mode === "partner"}
                  disabled={aiAvailable === false}
                  onClick={() => setMode("partner")}
                  icon={<Bot className="size-4" />}
                  title={r.modePartner}
                  text={aiAvailable === false ? r.modePartnerMissing : r.modePartnerText}
                />
                <ModeButton
                  active={mode === "monologue"}
                  onClick={() => setMode("monologue")}
                  icon={<Mic className="size-4" />}
                  title={r.modeMonologue}
                  text={r.modeMonologueText}
                />
              </div>
              <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{r.strictTiming(Math.round(speakLimit / 60))}</span>
                <Switch checked={strict} onCheckedChange={(v) => updateSettings({ strictTimer: v })} />
              </label>
            </div>

            {tips.length > 0 && (
              <div className="rounded-2xl border border-dashed p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="size-4 text-gold" /> {r.strategy}
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "speak" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <TaskSheet set={set} revealPartner={false} />
            {notes.trim() && (
              <div className="rounded-2xl border bg-card p-4 text-sm whitespace-pre-wrap">
                <div className="mb-1 font-semibold">{r.yourNotes}</div>
                {notes}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              {speakStartedAt && (
                <CountdownTimer
                  startedAt={speakStartedAt}
                  limitSec={mode === "monologue" ? (part.speaking?.monologueSeconds ?? 90) + 60 : speakLimit}
                  strict={strict}
                  running={!ended}
                  onExpire={() => {
                    if (strict && mode === "partner" && !ended) {
                      toast.info(r.timeUp);
                      finish(turns);
                    }
                  }}
                />
              )}
              {mode === "partner" && (
                <Button variant="outline" onClick={() => finish(turns)} disabled={!turns.some((turn) => turn.role === "user")}>
                  <StopCircle /> {r.endFeedback}
                </Button>
              )}
            </div>
            {mode === "partner" ? (
              <Conversation
                examId={examId}
                partId={part.id}
                setNumber={setNumber}
                partner={partner}
                userName={userName}
                partnerStarts={partnerStarts}
                disabled={ended}
                turns={turns}
                onTurns={setTurns}
              />
            ) : (
              <Monologue
                prompt={monologuePrompt(set, t.speaking.monologuePrompt)}
                targetSeconds={part.speaking?.monologueSeconds ?? 90}
                maxSeconds={strict ? (part.speaking?.monologueSeconds ?? 90) + 60 : undefined}
                onDone={(text, secs) => finish([{ role: "user", text }], secs)}
              />
            )}
          </div>
        </div>
      )}

      {phase === "feedback" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm">
            <span className="font-medium">{r.finished}</span>
            <span className="text-muted-foreground">{r.finishedStats(formatClock(durationSec), turns.filter((turn) => turn.role === "user").length || 1)}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcw /> {r.practiseAgain}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setTab("model")}>
                <PlayCircle /> {r.modelDialogue}
              </Button>
            </div>
          </div>

          {feedback ? (
            <SpeakingFeedbackView feedback={feedback} rubric={rubric} partId={part.id} />
          ) : fbState === "loading" ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
              <Loader2 className="size-8 animate-spin text-sprechen" />
              <div className="font-medium">{r.loadingTitle}</div>
              <p className="max-w-md text-sm text-muted-foreground">{r.loadingText}</p>
            </div>
          ) : fbState === "error" ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <span className="font-medium text-destructive">{r.aiFailed}</span> {fbError}
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => requestFeedback(turns.length ? turns : [], durationSec)}>
                <RotateCcw /> {t.common.retry}
              </Button>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-1 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4 text-success" /> {r.selfCheckTitle}
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">{r.selfCheckText}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {selfCheck.map((item, i) => (
                <li key={item}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm">
                    <Checkbox checked={!!checked[i]} onCheckedChange={(v) => setChecked((c) => ({ ...c, [i]: !!v }))} className="mt-0.5" />
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {turns.length > 0 && (
            <details className="rounded-2xl border bg-card p-4">
              <summary className="cursor-pointer text-sm font-semibold">{r.transcript}</summary>
              <div className="mt-3 space-y-1.5 text-sm">
                {turns.map((turn, i) => (
                  <p key={i}>
                    <span className={cn("font-semibold", turn.role === "user" ? "text-primary" : "text-sprechen")}>
                      {turn.role === "user" ? "Ich" : partner.name}:
                    </span>{" "}
                    {turn.text}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={links.part} aria-label={t.common.back}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-sprechen">
            Sprechen · {t.common.teil(part.teil)} · {part.name}
          </div>
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{set.title}</h1>
        </div>
        {previous.length > 0 && <Badge variant="secondary">{t.common.practised(previous.length)}</Badge>}
        {aiAvailable && (
          <Badge variant="outline">
            <Sparkles /> {r.aiReady}
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="practice">{r.tabs.practice}</TabsTrigger>
          <TabsTrigger value="model">{r.tabs.model}</TabsTrigger>
          <TabsTrigger value="roleplay">{r.tabs.roleplay}</TabsTrigger>
          <TabsTrigger value="phrases">{r.tabs.phrases}</TabsTrigger>
        </TabsList>
        <TabsContent value="practice" className="mt-4">
          {practice}
        </TabsContent>
        <TabsContent value="model" className="mt-4">
          <div className="mx-auto max-w-3xl">
            <ModelDialogue lines={set.model} speakers={set.speakers} />
          </div>
        </TabsContent>
        <TabsContent value="roleplay" className="mt-4">
          <div className="mx-auto max-w-3xl">
            <RolePlay lines={set.model} speakers={set.speakers} />
          </div>
        </TabsContent>
        <TabsContent value="phrases" className="mt-4">
          <PhrasesAndIdeas set={set} groups={phraseGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModeButton({ active, disabled, onClick, icon, title, text }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-sprechen/50 disabled:cursor-not-allowed disabled:opacity-50",
        active && "border-sprechen bg-sprechen/6 ring-1 ring-sprechen/30",
      )}
    >
      <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg", active ? "bg-sprechen text-white" : "bg-muted")}>{icon}</span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

function PhrasesAndIdeas({ set, groups }: { set: SpeakingSet; groups: SpeakingRunnerProps["phraseGroups"] }) {
  const t = useT();
  const locale = useLocale();
  const showEnglish = useSettings((s) => s.showEnglish);
  const ideas = t.speaking.ideas;
  const taskPhrases: GlossaryEntry[] = set.phrases;
  const vocab: GlossaryEntry[] = "vocabulary" in set ? set.vocabulary : [];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        {set.type === "speaking-topic" && (
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">{ideas.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-xs font-semibold tracking-wide text-success uppercase">{ideas.pro}</div>
                <ul className="space-y-1 text-sm">
                  {set.ideas.pro.map((p) => (
                    <li key={p}>+ {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold tracking-wide text-destructive uppercase">{ideas.contra}</div>
                <ul className="space-y-1 text-sm">
                  {set.ideas.contra.map((p) => (
                    <li key={p}>– {p}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 border-t pt-3">
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{ideas.examinerQuestions}</div>
              <ul className="space-y-1 text-sm">
                {set.questions.map((q) => (
                  <li key={q}>„{q}“</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {set.type === "speaking-intro" && (
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">{ideas.partnerQuestions}</h3>
            <div className="space-y-3">
              {set.questions.map((q) => (
                <div key={q.point}>
                  <div className="text-xs font-semibold tracking-wide text-sprechen uppercase">{q.point}</div>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {q.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">{ideas.taskPhrases}</h3>
          <dl className="space-y-2">
            {taskPhrases.map((p) => (
              <div key={p.de} className="text-sm">
                <dt className="font-medium">{p.de}</dt>
                {showEnglish && <dd className="text-muted-foreground">{p.en}</dd>}
              </div>
            ))}
          </dl>
        </div>
        {vocab.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">{ideas.vocabulary}</h3>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {vocab.map((v) => (
                <div key={v.de} className="flex justify-between gap-3 border-b border-dashed pb-1 text-sm">
                  <dt className="font-medium">{v.de}</dt>
                  {showEnglish && <dd className="text-right text-muted-foreground">{v.en}</dd>}
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.title} className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">
              {g.title}
              {locale === "en" && <span className="text-sm font-normal text-muted-foreground"> · {g.titleEn}</span>}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {g.phrases.map((p) => {
                const sub = [showEnglish ? p.en : "", p.note ?? ""].filter(Boolean).join(" · ");
                return (
                  <li key={p.de} className="text-sm">
                    <span className="font-medium">{p.de}</span>
                    {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
