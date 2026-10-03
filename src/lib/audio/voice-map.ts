import type { SpeakerProfile } from "./speech";

export type NeuralEngine = "openai" | "elevenlabs" | "google";

export interface NeuralVoice {
  id: string;
  label: string;
}

/**
 * Default voices per engine and gender. Speakers of a recording get distinct voices in this
 * order (first woman → first female voice, second woman → second …). Users can override the
 * first voice of each gender in the settings; any voice id of the provider works.
 */
export const NEURAL_VOICES: Record<NeuralEngine, { f: NeuralVoice[]; m: NeuralVoice[] }> = {
  openai: {
    f: [
      { id: "nova", label: "Nova" },
      { id: "coral", label: "Coral" },
      { id: "shimmer", label: "Shimmer" },
      { id: "sage", label: "Sage" },
    ],
    m: [
      { id: "onyx", label: "Onyx" },
      { id: "ash", label: "Ash" },
      { id: "echo", label: "Echo" },
      { id: "fable", label: "Fable" },
    ],
  },
  elevenlabs: {
    f: [
      { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah" },
      { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda" },
      { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice" },
    ],
    m: [
      { id: "JBFqnCBsd6RMkjVDRZzb", label: "George" },
      { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel" },
      { id: "nPczCjzI2devNBz1zQrb", label: "Brian" },
    ],
  },
  google: {
    f: [
      { id: "de-DE-Chirp3-HD-Aoede", label: "Aoede (Chirp 3 HD)" },
      { id: "de-DE-Chirp3-HD-Kore", label: "Kore (Chirp 3 HD)" },
      { id: "de-DE-Neural2-C", label: "Neural2 C" },
    ],
    m: [
      { id: "de-DE-Chirp3-HD-Charon", label: "Charon (Chirp 3 HD)" },
      { id: "de-DE-Chirp3-HD-Fenrir", label: "Fenrir (Chirp 3 HD)" },
      { id: "de-DE-Neural2-B", label: "Neural2 B" },
    ],
  },
};

export const DEFAULT_TTS_MODELS: Record<NeuralEngine, string> = {
  openai: "gpt-4o-mini-tts",
  elevenlabs: "eleven_multilingual_v2",
  google: "",
};

/** Voice for a speaker: the user's override for the first speaker of a gender, then the defaults. */
export function neuralVoiceFor(engine: NeuralEngine, speaker: SpeakerProfile, overrides: { f?: string; m?: string } = {}): string {
  const list = NEURAL_VOICES[engine][speaker.gender].map((v) => v.id);
  const preferred = overrides[speaker.gender];
  const ordered = preferred ? [preferred, ...list.filter((id) => id !== preferred)] : list;
  return ordered[speaker.index % ordered.length];
}
