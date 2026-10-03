"use client";

import { Keyboard, Loader2, Mic, MicOff, Send, Square, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SoundBars } from "@/components/exam/players/audio-common";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import type { Speaker } from "@/lib/content/schemas";
import type { Turn } from "@/lib/ai/speaking-types";
import { useSpeechRecognition } from "@/lib/audio/recognition";
import { playLines, stopAll } from "@/lib/audio/speech";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { aiFetch } from "@/lib/ai/request";

export interface ConversationProps {
  examId: string;
  partId: string;
  setNumber: string;
  partner: Speaker;
  userName: string;
  /** Who opens the conversation. */
  partnerStarts: boolean;
  disabled?: boolean;
  turns: Turn[];
  onTurns: (turns: Turn[]) => void;
}

type Status = "idle" | "thinking" | "speaking" | "listening";

/** Turn-based spoken conversation with the AI exam partner. */
export function Conversation({ examId, partId, setNumber, partner, userName, partnerStarts, disabled, turns, onTurns }: ConversationProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [streaming, setStreaming] = useState("");
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();
  const c = t.speaking.conversation;
  const rec = useSpeechRecognition();
  const prefs = useSettings(useShallow((s) => ({ female: s.voiceFemale, male: s.voiceMale, rate: s.speechRate })));
  const listRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const turnsRef = useRef(turns);
  useEffect(() => {
    turnsRef.current = turns;
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, streaming, rec.interim]);

  const fallbackError = c.partnerFailed;
  const askPartner = useCallback(
    async (history: Turn[]) => {
      setStatus("thinking");
      setError(null);
      setStreaming("");
      try {
        const res = await aiFetch("/api/ai/partner", { examId, partId, setNumber, turns: history, locale });
        if (!res.ok || !res.body) {
          // Show the server's message as it arrives; our own text only when there is none.
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error || fallbackError);
          setStatus("idle");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setStreaming(text);
        }
        text = text.trim();
        const next = [...history, { role: "partner" as const, text }];
        onTurns(next);
        setStreaming("");
        if (voiceOn && text) {
          setStatus("speaking");
          await playLines([{ s: partner.id, t: text }], { speakers: [partner], prefs }).done;
        }
        setStatus("idle");
      } catch {
        // Connection lost or the stream broke off: no server message to show.
        setError(fallbackError);
        setStatus("idle");
        setStreaming("");
      }
    },
    [examId, partId, setNumber, onTurns, voiceOn, partner, prefs, locale, fallbackError],
  );

  useEffect(() => {
    if (!disabled && partnerStarts && !started.current && turns.length === 0) {
      started.current = true;
      void askPartner([]);
    }
  }, [disabled, partnerStarts, turns.length, askPartner]);

  useEffect(() => () => stopAll(), []);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const next = [...turnsRef.current, { role: "user" as const, text: clean }];
    onTurns(next);
    void askPartner(next);
  };

  const toggleMic = () => {
    if (rec.listening) {
      const text = rec.stop();
      setStatus("idle");
      send(text);
    } else {
      stopAll();
      rec.start();
      setStatus("listening");
    }
  };

  useEffect(() => {
    if (disabled && rec.listening) {
      const text = rec.stop();
      if (text) onTurns([...turnsRef.current, { role: "user", text }]);
    }
  }, [disabled, rec, onTurns]);

  const busy = status === "thinking" || status === "speaking";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-full bg-sprechen/15 text-sm font-bold text-sprechen">
            {partner.name?.[0] ?? "B"}
            {status === "speaking" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sprechen/40" />}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{partner.name ?? c.yourPartner}</div>
            <div className="text-xs text-muted-foreground">
              {status === "thinking" ? c.thinking : status === "speaking" ? c.speaking : status === "listening" ? c.listening : c.aiPartner(partner.gender)}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? c.mute : c.unmute}>
          {voiceOn ? <Volume2 /> : <VolumeX />}
        </Button>
      </div>

      <div ref={listRef} className="h-[24rem] space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {turns.length === 0 && !streaming && status !== "thinking" && (
          <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
            {partnerStarts ? c.partnerStarts : c.youStart}
          </div>
        )}
        {turns.map((turn, i) => (
          <Bubble key={i} mine={turn.role === "user"} name={turn.role === "user" ? userName : (partner.name ?? c.partnerFallback)} text={turn.text} />
        ))}
        {(streaming || status === "thinking") && (
          <Bubble mine={false} name={partner.name ?? c.partnerFallback} text={streaming || "…"} pending={!streaming} />
        )}
        {status === "listening" && <Bubble mine name={userName} text={`${rec.finalText} ${rec.interim}`.trim() || t.speaking.listening} pending />}
      </div>

      <div className="border-t px-4 py-1.5 text-[11px] text-muted-foreground/80">
        {c.privacy}
      </div>
      {error && <div className="border-t bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
      {rec.error && <div className="border-t bg-destructive/5 px-4 py-2 text-sm text-destructive">{rec.error}</div>}

      <div className="flex items-center gap-2 border-t p-3">
        {typing || !rec.supported ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(typed);
              setTyped("");
            }}
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={disabled || busy}
              placeholder={rec.supported ? c.typePlaceholder : c.typePlaceholderNoMic}
              className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              lang="de"
            />
            <Button type="submit" disabled={disabled || busy || !typed.trim()}>
              <Send />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || busy}
            className={cn(
              "relative flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50",
              rec.listening ? "bg-destructive text-white" : "bg-sprechen text-white hover:bg-sprechen/90",
            )}
          >
            {rec.listening ? (
              <>
                <Square className="size-4" /> {c.doneSpeaking}
                <SoundBars active className="ml-1 h-5" />
              </>
            ) : busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {c.waitPartner}
              </>
            ) : (
              <>
                <Mic className="size-5" /> {c.pressSpeak}
              </>
            )}
          </button>
        )}
        {rec.supported && (
          <Button variant="outline" size="icon-lg" onClick={() => setTyping((v) => !v)} aria-label={typing ? c.useMic : c.typeInstead}>
            {typing ? <MicOff /> : <Keyboard />}
          </Button>
        )}
      </div>
    </div>
  );
}

function Bubble({ mine, name, text, pending }: { mine: boolean; name: string; text: string; pending?: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
          pending && "opacity-70",
        )}
      >
        <div className={cn("mb-0.5 text-[11px] font-semibold tracking-wide uppercase", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{name}</div>
        {text}
      </div>
    </div>
  );
}
