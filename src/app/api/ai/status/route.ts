import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

/** Whether the server has its own AI credentials – and which provider/model (never the key). */
export function GET() {
  const config = serverConfig();
  return NextResponse.json(config ? { available: true, provider: config.provider, model: config.model } : { available: false });
}
