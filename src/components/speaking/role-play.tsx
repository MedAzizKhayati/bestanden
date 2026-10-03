"use client";

import { Eye, EyeOff, Mic, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { SoundBars, VoiceWarning } from "@/components/exam/players/audio-common";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import type { Line, Speaker } from "@/lib/content/schemas";
import { useSpeechRecognition } from "@/lib/audio/recognition";
import { playLines, stopAll } from "@/lib/audio/speech";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { normalizeAnswer } from "@/lib/utils/text";

/** Share of the model line's words the speaker produced, in order (LCS over tokens). */
export function lineMatch(model: string, said: string): number {
  const a = normalizeAnswer(model).split(" ").filter(Boolean);
  const b = normalizeAnswer(said).split(" ").filter(Boolean);
  if (!a.length) return 1;
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length] / a.length;
}

type Status = "idle" | "partner" | "me" | "done";

/** Act out a model dialogue: the app speaks the other roles, you speak yours. */
export function RolePlay({ lines, speakers }: { lines: Line[]; speakers: Speaker[] }) {
  const roles = speakers.filter((s) => s.id === "A" || s.id === "B");
  const [role, setRole] = useState(roles[0]?.id ?? "A");
  const [showLines, setShowLines] = useState(true);
  const [index, setIndex] = useState(-1);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Record<number, { said: string; score: number }>>({});
  const rec = useSpeechRecognition();
  const prefs = useSettings(useShallow((s) => ({ female: s.voiceFemale, male: s.voiceMale, rate: s.speechRate })));
  const runId = useRef(0);
  const t = useT();
  const locale = useLocale();
  const rp = t.speaking.rolePlay;
  const percent = (share: number) => formatNumber(share, locale, { style: "percent" });

  useEffect(() => () => stopAll(), []);

  const advance = async (from: number, my = runId.current) => {
    for (let i = from; i < lines.length; i++) {
      if (runId.current !== my) return;
      setIndex(i);
      if (lines[i].s === role) {
        setStatus("me");
        rec.start();
        return; // wait for "Done"
      }
      setStatus("partner");
      await playLines([lines[i]], { speakers, prefs }).done;
    }
    if (runId.current === my) {
      setStatus("done");
      setIndex(lines.length);
    }
  };

  const start = () => {
    runId.current++;
    setResults({});
    void advance(0, runId.current);
  };

  const finishMyLine = () => {
    const said = rec.stop();
    const score = lineMatch(lines[index].t, said);
    setResults((r) => ({ ...r, [index]: { said, score } }));
    void advance(index + 1, runId.current);
  };

  const reset = () => {
    runId.current++;
    stopAll();
    if (rec.listening) rec.stop();
    setStatus("idle");
    setIndex(-1);
    setResults({});
  };

  const mine = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.s === role);
  const scored = Object.values(results);
  const avg = scored.length ? Math.round((scored.reduce((s, r) => s + r.score, 0) / scored.length) * 100) : null;
  const name = (id: string) => speakers.find((s) => s.id === id)?.name ?? id;

  if (!rec.supported)
    return (
      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{rp.unsupported}</div>
    );

  return (
    <div className="space-y-4">
      <VoiceWarning />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm">
          <span className="font-medium">{rp.yourRole}</span>
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={role} onValueChange={(v) => v && status === "idle" && setRole(v)}>
          {roles.map((r) => (
            <ToggleGroupItem key={r.id} value={r.id} className="px-3">
              {r.name ?? r.id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" size="sm" onClick={() => setShowLines((s) => !s)}>
          {showLines ? <Eye /> : <EyeOff />} {showLines ? rp.readLines : rp.ownWords}
        </Button>
        <div className="ml-auto flex gap-2">
          {status === "idle" || status === "done" ? (
            <Button onClick={start} className="bg-sprechen text-white hover:bg-sprechen/90">
              <Play /> {status === "done" ? rp.again : rp.start}
            </Button>
          ) : (
            <Button variant="outline" onClick={reset}>
              <RotateCcw /> {t.common.stop}
            </Button>
          )}
        </div>
      </div>

      {status === "done" && avg !== null && (
        <div className="rounded-2xl border border-success/30 bg-success/8 p-4 text-sm">
          <span className="font-semibold">{rp.matchLead(percent(avg / 100))}</span>
          {rp.matchRest(scored.length)} {showLines ? rp.readingTip : rp.ownWordsTip}
        </div>
      )}

      <ol className="space-y-2">
        {lines.map((l, i) => {
          const isMine = l.s === role;
          const active = i === index && status !== "done";
          const res = results[i];
          const hidden = isMine && !showLines && !res;
          return (
            <li key={i} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed transition-all",
                  isMine ? "rounded-br-md bg-primary/10" : "rounded-bl-md bg-muted",
                  active && "ring-2 ring-sprechen shadow-md",
                  !active && index >= 0 && i > index && "opacity-50",
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {isMine ? rp.you : name(l.s)}
                  {active && status === "partner" && <Volume2 className="size-3 text-sprechen" />}
                </div>
                {hidden ? <span className="text-muted-foreground italic">{rp.yourTurn}</span> : l.t}
                {active && status === "me" && (
                  <div className="mt-2 space-y-2 border-t pt-2">
                    <div className="min-h-6 text-sm">
                      {rec.finalText} <span className="text-muted-foreground">{rec.interim}</span>
                      {!rec.finalText && !rec.interim && <span className="text-muted-foreground">{t.speaking.listening}</span>}
                    </div>
                    <Button size="sm" onClick={finishMyLine} className="bg-sprechen text-white hover:bg-sprechen/90">
                      <Square /> {t.common.done} <SoundBars active className="ml-1 h-4" />
                    </Button>
                  </div>
                )}
                {res && (
                  <div className="mt-2 border-t pt-2 text-sm">
                    <div className="text-muted-foreground">
                      <Mic className="mr-1 inline size-3.5" />
                      {res.said || rp.nothing}
                    </div>
                    <div className={cn("font-semibold", res.score >= 0.8 ? "text-success" : res.score >= 0.5 ? "text-warning" : "text-destructive")}>
                      {rp.match(percent(Math.round(res.score * 100) / 100))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {mine.length === 0 && <p className="text-sm text-muted-foreground">{rp.noLines}</p>}
      {rec.error && <p className="text-sm text-destructive">{rec.error}</p>}
    </div>
  );
}
