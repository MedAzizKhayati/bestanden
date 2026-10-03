import type { SpeakingIntroSet, SpeakingPlanningSet, SpeakingTopicSet } from "@/lib/content/schemas";

/** Shared (client + server) types for the speaking features. */
export type SpeakingSet = SpeakingIntroSet | SpeakingTopicSet | SpeakingPlanningSet;

export interface Turn {
  role: "user" | "partner";
  text: string;
}
