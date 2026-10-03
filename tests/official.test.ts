import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { answerSheet, completeKey, scoreSheet } from "@/lib/official/sheet";
import { telcB1Exam } from "./helpers";

const exam = telcB1Exam();

describe("official answer sheet", () => {
  test("items 1–60 with the official options per part", () => {
    const sheet = answerSheet(exam);
    expect(sheet.flatMap((s) => s.numbers)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    expect(sheet.find((s) => s.part.id === "lesen-3")!.options).toContain("x");
    expect(sheet.find((s) => s.part.id === "sprachbausteine-2")!.options).toHaveLength(15);
    expect(sheet.find((s) => s.part.id === "hoeren-2")!.options).toEqual(["r", "f"]);
  });

  test("a full key scores the official maximum: 75 + 30 + 75", () => {
    const key: Record<string, string> = {};
    for (const { numbers, options } of answerSheet(exam)) for (const n of numbers) key[n] = options[n % options.length];
    expect(completeKey(exam, key)).toBe(true);
    const full = scoreSheet(exam, key, key);
    expect(full.points).toBe(180);
    expect(full.bySection).toEqual({ lesen: { points: 75, maxPoints: 75 }, sprachbausteine: { points: 30, maxPoints: 30 }, hoeren: { points: 75, maxPoints: 75 } });
    expect(scoreSheet(exam, { 41: key[41], 46: key[46] }, key, ["hoeren"]).points).toBe(5 + 2.5);
    expect(completeKey(exam, { ...key, 60: "z" })).toBe(false);
  });
});

describe("private file route", () => {
  let dir: string;
  let GET: (req: Request, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response>;
  const call = (path: string[], headers: Record<string, string> = {}) => GET(new Request("http://x/api/private", { headers }), { params: Promise.resolve({ path }) });

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "bestanden-private-"));
    mkdirSync(join(dir, "telc", "probe"), { recursive: true });
    writeFileSync(join(dir, "telc", "probe", "hoeren.mp3"), Buffer.alloc(3 * 1024 * 1024, 7));
    writeFileSync(join(dir, "telc", "probe", "info.json"), JSON.stringify({ title: "Probe", examId: "telc-b1", key: {} }));
    process.env.BESTANDEN_PRIVATE_DIR = dir;
    ({ GET } = (await import("@/app/api/private/[...path]/route")) as never);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test("serves audio in bounded chunks and honours ranges", async () => {
    const open = await call(["telc", "probe", "hoeren.mp3"], { range: "bytes=0-" });
    expect(open.status).toBe(206);
    expect(open.headers.get("content-range")).toBe(`bytes 0-${1024 * 1024 - 1}/${3 * 1024 * 1024}`);
    const suffix = await call(["telc", "probe", "hoeren.mp3"], { range: "bytes=-100" });
    expect(suffix.headers.get("content-range")).toBe(`bytes ${3 * 1024 * 1024 - 100}-${3 * 1024 * 1024 - 1}/${3 * 1024 * 1024}`);
    const whole = await call(["telc", "probe", "hoeren.mp3"]);
    expect(whole.status).toBe(200);
    expect((await whole.arrayBuffer()).byteLength).toBe(3 * 1024 * 1024);
  });

  test("never serves other file types or anything outside private/", async () => {
    expect((await call(["telc", "probe", "info.json"])).status).toBe(404);
    expect((await call(["..", "package.json"])).status).toBe(404);
    expect((await call(["telc", "probe", "..", "..", "..", "etc", "passwd.mp3"])).status).toBe(404);
  });

  test("refuses in production unless explicitly allowed", async () => {
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = "production";
    expect((await call(["telc", "probe", "hoeren.mp3"])).status).toBe(404);
    env.ALLOW_PRIVATE_MATERIALS = "1";
    expect((await call(["telc", "probe", "hoeren.mp3"])).status).toBe(200);
    delete env.ALLOW_PRIVATE_MATERIALS;
    env.NODE_ENV = prev;
  });
});
