"use client";

import { Volume2 } from "lucide-react";
import { useT } from "@/i18n/client";
import type { VocabWord } from "@/lib/content/schemas";
import { speak } from "@/lib/audio/speech";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export type ClientWord = VocabWord & { themeId: string };

export const ARTICLE_CLASS: Record<string, string> = {
  der: "text-der",
  die: "text-die",
  das: "text-das",
};

export const ARTICLE_BG: Record<string, string> = {
  der: "bg-der/12 text-der border-der/30",
  die: "bg-die/12 text-die border-die/30",
  das: "bg-das/12 text-das border-das/30",
};

/** "der Tisch" with the article coloured by gender. */
export function WordLabel({ word, className, hideArticle }: { word: VocabWord; className?: string; hideArticle?: boolean }) {
  return (
    <span className={cn("font-semibold", className)}>
      {word.article && !hideArticle && <span className={cn("mr-1.5", ARTICLE_CLASS[word.article])}>{word.article}</span>}
      {word.de}
    </span>
  );
}

export function spokenForm(word: VocabWord) {
  return word.article ? `${word.article} ${word.de}` : word.de;
}

export function SpeakButton({ text, className, label }: { text: string; className?: string; label?: string }) {
  const t = useT();
  const female = useSettings((s) => s.voiceFemale);
  const rate = useSettings((s) => s.speechRate);
  return (
    <button
      type="button"
      aria-label={label ?? t.common.listen}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, "f", { female, rate: rate * 0.95 });
      }}
      className={cn("grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", className)}
    >
      <Volume2 className="size-4" />
    </button>
  );
}
