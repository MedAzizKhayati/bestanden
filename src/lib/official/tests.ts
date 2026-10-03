import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";

/**
 * Official practice tests (e.g. telc Übungstests) that the user downloaded for personal use into
 * /private (gitignored). They are only listed and served outside production – unless
 * ALLOW_PRIVATE_MATERIALS=1 is set for a private, local production run.
 */
export const PRIVATE_DIR = process.env.BESTANDEN_PRIVATE_DIR ? resolve(process.env.BESTANDEN_PRIVATE_DIR) : join(process.cwd(), "private");

export function privateMaterialsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_PRIVATE_MATERIALS === "1";
}

const Page = z.number().int().min(1).optional();
const Info = z.object({
  title: z.string().min(1),
  examId: z.string().min(1),
  source: z.string().url().optional(),
  pages: z
    .object({ lesen: Page, sprachbausteine: Page, hoeren: Page, schreiben: Page, sprechen: Page, loesungen: Page, hoertexte: Page })
    .default({}),
  key: z.record(z.string(), z.string()).optional(),
});

export type OfficialPages = z.infer<typeof Info>["pages"];

export interface OfficialTest {
  id: string;
  title: string;
  examId: string;
  source?: string;
  pages: OfficialPages;
  key?: Record<string, string>;
  audioUrl?: string;
  bookletUrl?: string;
}

const PROVIDER_DIRS = ["telc"];

/** Every test folder private/<provider>/<id>/ with an info.json (and hoeren.mp3 / heft.pdf). */
export function listOfficialTests(examId?: string): OfficialTest[] {
  if (!privateMaterialsEnabled()) return [];
  const tests: OfficialTest[] = [];
  for (const provider of PROVIDER_DIRS) {
    const dir = join(/*turbopackIgnore: true*/ PRIVATE_DIR, provider);
    // turbopackIgnore: private files must never be traced into a build (they would be deployed).
    if (!existsSync(/*turbopackIgnore: true*/ dir)) continue;
    for (const id of readdirSync(/*turbopackIgnore: true*/ dir).sort()) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) continue;
      const infoPath = join(/*turbopackIgnore: true*/ dir, id, "info.json");
      if (!existsSync(/*turbopackIgnore: true*/ infoPath)) continue;
      const parsed = Info.safeParse(JSON.parse(readFileSync(/*turbopackIgnore: true*/ infoPath, "utf8")));
      if (!parsed.success) {
        console.warn(`[private] ${provider}/${id}/info.json: ${parsed.error.issues[0]?.message}`);
        continue;
      }
      if (examId && parsed.data.examId !== examId) continue;
      const file = (name: string) => (existsSync(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ dir, id, name)) ? `/api/private/${provider}/${id}/${name}` : undefined);
      tests.push({ id, ...parsed.data, audioUrl: file("hoeren.mp3"), bookletUrl: file("heft.pdf") });
    }
  }
  return tests;
}

export function getOfficialTest(id: string): OfficialTest | undefined {
  return listOfficialTests().find((t) => t.id === id);
}
