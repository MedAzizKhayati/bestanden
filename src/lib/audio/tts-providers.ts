/**
 * Neural text-to-speech through the providers' HTTP APIs. Used by the /api/tts route and by
 * scripts/audio/render.ts (pre-rendering). Never import this into client code – it handles keys.
 */
import type { NeuralEngine } from "./voice-map";

export class TtsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface SynthesisRequest {
  text: string;
  voice: string;
  model?: string;
  apiKey: string;
  signal?: AbortSignal;
}

/** Spoken like a calm recording for a listening exam: clear standard German. */
const OPENAI_INSTRUCTIONS =
  "Sprich natürliches, klares Hochdeutsch ohne Akzent, in ruhigem, normalem Sprechtempo – wie in einer Aufnahme für eine Deutschprüfung.";

async function failed(res: Response, engine: string): Promise<never> {
  const detail = (await res.text().catch(() => "")).slice(0, 200);
  throw new TtsError(`${engine} TTS failed (${res.status}): ${detail}`, res.status);
}

export async function synthesize(engine: NeuralEngine, req: SynthesisRequest): Promise<ArrayBuffer> {
  if (engine === "openai") {
    const model = req.model || "gpt-4o-mini-tts";
    const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${req.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        voice: req.voice,
        input: req.text,
        response_format: "mp3",
        ...(model.startsWith("gpt-4o") ? { instructions: OPENAI_INSTRUCTIONS } : {}),
      }),
      signal: req.signal,
    });
    if (!res.ok) await failed(res, "OpenAI");
    return res.arrayBuffer();
  }
  if (engine === "elevenlabs") {
    const res = await fetch(
      `${process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io"}/v1/text-to-speech/${encodeURIComponent(req.voice)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": req.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text: req.text, model_id: req.model || "eleven_multilingual_v2" }),
        signal: req.signal,
      },
    );
    if (!res.ok) await failed(res, "ElevenLabs");
    return res.arrayBuffer();
  }
  const res = await fetch(`${process.env.GOOGLE_TTS_BASE_URL ?? "https://texttospeech.googleapis.com"}/v1/text:synthesize`, {
    method: "POST",
    headers: { "X-Goog-Api-Key": req.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { text: req.text }, voice: { languageCode: "de-DE", name: req.voice }, audioConfig: { audioEncoding: "MP3" } }),
    signal: req.signal,
  });
  if (!res.ok) await failed(res, "Google");
  const { audioContent } = (await res.json()) as { audioContent?: string };
  if (!audioContent) throw new TtsError("Google TTS returned no audio", 502);
  return Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0)).buffer;
}

/** Server-side keys from the environment, per engine. */
export function serverTtsKey(engine: NeuralEngine): string | undefined {
  if (engine === "openai") return process.env.OPENAI_API_KEY;
  if (engine === "elevenlabs") return process.env.ELEVENLABS_API_KEY;
  return process.env.GOOGLE_TTS_API_KEY;
}
