"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { SpeedToggle, VoiceWarning } from "@/components/exam/players/audio-common";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { Line, Speaker } from "@/lib/content/schemas";
import { usePlayback } from "@/lib/audio/sequence";
import { cn } from "@/lib/utils";

/** Plays a model dialogue with one voice per speaker and highlights the current line. */
export function ModelDialogue({ lines, speakers, highlightSpeaker = "A" }: { lines: Line[]; speakers: Speaker[]; highlightSpeaker?: string }) {
  const t = useT();
  const pb = usePlayback(speakers);
  const [rate, setRate] = useState(1);
  const playing = pb.playing === "model";
  const name = (id: string) => speakers.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-3">
      <VoiceWarning />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => (playing ? pb.stop() : pb.play("model", lines, { rate }))} className="bg-sprechen text-white hover:bg-sprechen/90">
          {playing ? <Pause /> : <Play />} {playing ? t.common.stop : t.speaking.modelDialogue.listen}
        </Button>
        <SpeedToggle value={rate} onChange={setRate} />
        <span className="text-xs text-muted-foreground">{t.speaking.modelDialogue.clickLine}</span>
      </div>
      <ol className="space-y-2">
        {lines.map((l, i) => {
          const isA = l.s === highlightSpeaker;
          const isExaminer = !["A", "B"].includes(l.s);
          const active = playing && pb.lineIndex === i;
          return (
            <li key={i} className={cn("flex", isA ? "justify-end" : "justify-start", isExaminer && "justify-center")}>
              <button
                type="button"
                onClick={() => pb.play("model", lines, { rate, startAt: i })}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-left text-[15px] leading-relaxed transition-all",
                  isExaminer ? "border border-dashed bg-muted/40 text-sm text-muted-foreground" : isA ? "rounded-br-md bg-sprechen/12" : "rounded-bl-md bg-muted",
                  active && "ring-2 ring-sprechen shadow-md",
                )}
              >
                <span className={cn("mb-0.5 block text-[11px] font-semibold tracking-wide uppercase", isA ? "text-sprechen" : "text-muted-foreground")}>
                  {name(l.s)}
                </span>
                {l.t}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
