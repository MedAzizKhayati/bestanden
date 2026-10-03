import type { SpeakerProfile } from "./speech";

/**
 * Stable file key for a spoken line: the same text spoken by the same kind of speaker always
 * maps to the same file. Shared by the player and scripts/audio/render.ts.
 */
export async function audioKey(text: string, speaker: SpeakerProfile): Promise<string> {
  const data = new TextEncoder().encode(`${speaker.gender}|${speaker.age}|${speaker.index}|${text.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** public/audio/manifest.json – written by scripts/audio/render.ts. */
export interface AudioManifest {
  version: 1;
  /** Engine and voice set the files were rendered with (informational). */
  engine: string;
  /** Keys of the files in public/audio/tts/<key>.mp3 */
  files: string[];
}
