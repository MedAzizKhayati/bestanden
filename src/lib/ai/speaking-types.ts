import type {
  SpeakingDiscussionSet,
  SpeakingExperienceSet,
  SpeakingIntroSet,
  SpeakingPlanningSet,
  SpeakingTopicSet,
} from "@/lib/content/schemas";

/** Shared (client + server) types for the speaking features. */
export type SpeakingSet = SpeakingIntroSet | SpeakingTopicSet | SpeakingPlanningSet | SpeakingExperienceSet | SpeakingDiscussionSet;

export interface Turn {
  role: "user" | "partner";
  text: string;
}

/** Whether the AI partner opens the conversation (otherwise the learner starts). */
export function partnerOpens(set: SpeakingSet): boolean {
  return set.type === "speaking-intro" || set.type === "speaking-planning";
}
