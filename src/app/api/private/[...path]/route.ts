import { createReadStream, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { PRIVATE_DIR, privateMaterialsEnabled } from "@/lib/official/tests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav", ".pdf": "application/pdf" };

const notFound = () => new Response("Not found", { status: 404 });

/** 1 MB ≈ 2–3 minutes of a speech MP3. */
const AUDIO_CHUNK = 1024 * 1024;

/**
 * Serves files from /private (personal copies of official practice tests) – locally only.
 * Supports Range requests so audio can be streamed and (in training mode) seeked.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/private/[...path]">) {
  if (!privateMaterialsEnabled()) return notFound();
  const { path } = await ctx.params;
  const full = resolve(PRIVATE_DIR, ...path);
  if (!full.startsWith(PRIVATE_DIR + sep)) return notFound();
  const type = TYPES[extname(full).toLowerCase()];
  if (!type) return notFound();
  let size: number;
  try {
    // turbopackIgnore: never trace /private into the build output.
    const stat = statSync(/*turbopackIgnore: true*/ full);
    if (!stat.isFile()) return notFound();
    size = stat.size;
  } catch {
    return notFound();
  }

  const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600", "X-Robots-Tag": "noindex" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    // Open-ended audio ranges ("bytes=0-") get a bounded chunk: a media element stops reading once its
    // buffer is full, and an unfinished response would block one of the few HTTP/1.1 connections
    // per host (the dev server) – later requests, e.g. the next part of the recording, would stall.
    const openEnded = range[1] !== "" && range[2] === "";
    const cap = openEnded && type.startsWith("audio/") ? start + AUDIO_CHUNK - 1 : size - 1;
    // "bytes=a-b" → b · "bytes=a-" → cap · "bytes=-n" (the last n bytes) → end of file.
    const end = Math.min(range[1] && range[2] ? Number(range[2]) : cap, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ full, { start, end })) as unknown as ReadableStream;
    return new Response(stream, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  const stream = Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ full)) as unknown as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
