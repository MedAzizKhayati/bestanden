import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/ai/client";
import { serverTtsKey, synthesize, TtsError } from "@/lib/audio/tts-providers";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  engine: z.enum(["openai", "elevenlabs", "google"]),
  text: z.string().trim().min(1).max(800),
  voice: z.string().trim().min(1).max(100),
  model: z.string().trim().max(100).optional(),
});

/**
 * Neural speech for one line. Uses the user's key (x-tts-key header) or the server's env key.
 * The client caches every result, so each line is synthesized once per device.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid request" }, { status: 400 });
  const { engine, text, voice, model } = parsed.data;
  const userKey = req.headers.get("x-tts-key")?.trim();
  const apiKey = userKey || serverTtsKey(engine);
  if (!apiKey) return NextResponse.json({ error: "no key" }, { status: 503 });
  if (!userKey && !rateLimit(`tts:${clientIp(req)}`, 1500, 60 * 60 * 1000)) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  try {
    const audio = await synthesize(engine, { text, voice, model, apiKey, signal: req.signal });
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (e) {
    const status = e instanceof TtsError ? e.status : 502;
    console.error("[tts]", engine, e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: status === 401 || status === 403 ? "invalid key" : "tts failed" }, { status: status === 401 || status === 403 ? 401 : 502 });
  }
}
