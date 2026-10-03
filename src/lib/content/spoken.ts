/**
 * The exact text the speak buttons read aloud. Shared by the UI and scripts/audio/render.ts, so the
 * pre-rendered files match what the page asks for.
 */
import type { ReferenceList } from "./schemas";

/** „die Ermäßigung“ – nouns with their article. */
export const spokenWord = (w: { article?: string; de: string }) => (w.article ? `${w.article} ${w.de}` : w.de);

/** Redemittel without the „…“ placeholders. */
export const spokenPhrase = (de: string) => de.replace(/[…]/g, "");

/** One spoken text per item of a reference list, in item order. */
export function listSpeech(list: ReferenceList): string[] {
  switch (list.kind) {
    case "verb-preposition":
    case "connectors":
    case "phrases":
      return list.items.map((i) => i.example);
    case "irregular-verbs":
      return list.items.map((i) => `${i.inf}, ${i.past}, ${i.perfect}`);
  }
}
