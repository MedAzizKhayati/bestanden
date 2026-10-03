import type { VoiceLine, VoiceSpeaker } from "./speech";

/** The exam's announcer, who reads the task instructions (as on the real telc recordings). */
export const NARRATOR_ID = "__sprecher";

/** Speakers of a recording plus the announcer – appended last, so the cast keeps its voices. */
export function withNarrator(speakers: VoiceSpeaker[]): VoiceSpeaker[] {
  return [...speakers, { id: NARRATOR_ID, gender: "m", age: "adult" }];
}

/** "Lesen Sie die Aufgaben 41–45" → "… 41 bis 45", so text-to-speech reads ranges correctly. */
export function spokenInstruction(text: string): string {
  return text.replace(/(\d+)\s*–\s*(\d+)/g, "$1 bis $2").replace(/(?<![\p{L}])([a-z])–([a-z])(?![\p{L}])/gu, "$1 bis $2");
}

export function narratorLines(instruction: string): VoiceLine[] {
  return [{ s: NARRATOR_ID, t: spokenInstruction(instruction) }];
}
