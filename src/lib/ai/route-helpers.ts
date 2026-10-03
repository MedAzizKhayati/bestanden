import "server-only";

import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { clientIp, rateLimit, toAiError } from "./client";
import { aiText } from "./i18n";
import { resolveConfig, type AiConfig } from "./providers";

/**
 * Resolve the AI configuration of a request, or a ready error response.
 * Requests on the server's own key are rate-limited per IP; requests with the user's key are not.
 */
export function configForRequest(
  req: Request,
  locale: Locale,
  limit: { bucket: string; perHour: number; message: string },
  notConfigured: string,
): { config: AiConfig } | { response: NextResponse } {
  let config: AiConfig | null;
  try {
    config = resolveConfig(req);
  } catch (e) {
    const err = toAiError(e, locale);
    return { response: NextResponse.json({ error: err.message }, { status: err.status }) };
  }
  if (!config) return { response: NextResponse.json({ error: notConfigured }, { status: 503 }) };
  if (config.source === "server" && !rateLimit(`${limit.bucket}:${clientIp(req)}`, limit.perHour, 60 * 60 * 1000))
    return { response: NextResponse.json({ error: limit.message }, { status: 429 }) };
  return { config };
}

export { aiText };
