"use client";

import type { ScoredSet, ScoreResult } from "@/lib/exam/scoring";
import type { PartDefinition } from "@/lib/exams";
import type { Answers } from "@/lib/store/progress";
import { AdMatchingPlayer } from "./players/ad-matching";
import { AudioLongPlayer, AudioShortPlayer, type AudioExtra } from "./players/audio-players";
import { GapMcPlayer } from "./players/gap-mc";
import { GapWordbankPlayer } from "./players/gap-wordbank";
import { HeadlineMatchingPlayer } from "./players/headline-matching";
import { TextMcPlayer } from "./players/text-mc";

/** Renders the right interactive player for any automatically scored set. */
export function ScoredPlayer({
  set,
  part,
  answers,
  onAnswer,
  review,
  audio,
}: {
  set: ScoredSet;
  part: PartDefinition;
  answers: Answers;
  onAnswer: (n: number, value: string | null) => void;
  review: ScoreResult | null;
  audio: AudioExtra;
}) {
  const common = { part, answers, onAnswer, review };
  switch (set.type) {
    case "headline-matching":
      return <HeadlineMatchingPlayer set={set} {...common} />;
    case "text-mc":
      return <TextMcPlayer set={set} {...common} />;
    case "ad-matching":
      return <AdMatchingPlayer set={set} {...common} />;
    case "gap-mc":
      return <GapMcPlayer set={set} {...common} />;
    case "gap-wordbank":
      return <GapWordbankPlayer set={set} {...common} />;
    case "audio-short":
      return <AudioShortPlayer set={set} {...common} {...audio} />;
    case "audio-long":
      return <AudioLongPlayer set={set} {...common} {...audio} />;
  }
}
