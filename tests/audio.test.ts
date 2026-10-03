import { describe, expect, test } from "bun:test";
import { audioKey } from "@/lib/audio/audio-key";
import { spokenInstruction, withNarrator } from "@/lib/audio/narrator";
import { assignVoices, speakerProfiles, voiceTier } from "@/lib/audio/speech";
import { neuralVoiceFor } from "@/lib/audio/voice-map";

const voice = (name: string, localService = true) =>
  ({ name, lang: "de-DE", localService, voiceURI: name, default: false }) as unknown as SpeechSynthesisVoice;

// What Chrome offers on a Mac without extra voices: one natural voice, one compact voice, and novelty voices.
const MAC_CHROME = [
  voice("Google Deutsch", false),
  voice("Anna"),
  voice("Grandpa (German (Germany))"),
  voice("Rocko (German (Germany))"),
  voice("Shelley (German (Germany))"),
];

describe("browser voices", () => {
  test("tiers: natural, premium, standard, novelty", () => {
    expect(voiceTier(voice("Google Deutsch", false))).toBe("natural");
    expect(voiceTier(voice("Microsoft Katja Online (Natural) - German (Germany)", false))).toBe("natural");
    expect(voiceTier(voice("Yannick (Premium)"))).toBe("premium");
    expect(voiceTier(voice("Anna"))).toBe("standard");
    expect(voiceTier(voice("Grandpa (German (Germany))"))).toBe("novelty");
    expect(voiceTier(voice("Florian"))).toBe("standard");
  });

  test("novelty voices are never assigned; men borrow a good voice with a lower pitch", () => {
    const map = assignVoices(
      [
        { id: "A", gender: "f" },
        { id: "B", gender: "m" },
        { id: "C", gender: "m" },
      ],
      MAC_CHROME,
    );
    for (const a of map.values()) expect(voiceTier(a.voice!)).not.toBe("novelty");
    expect(map.get("A")!.voice!.name).toBe("Google Deutsch");
    expect(map.get("B")!.pitch).toBeLessThan(0.8);
    // The man gets a different timbre than the main female speaker where possible.
    expect(map.get("B")!.voice!.name).toBe("Anna");
  });

  test("real male voices are used when the device has them", () => {
    const map = assignVoices([{ id: "B", gender: "m" }], [...MAC_CHROME, voice("Yannick (Premium)")]);
    expect(map.get("B")!.voice!.name).toBe("Yannick (Premium)");
    expect(map.get("B")!.pitch).toBe(1);
  });
});

describe("recordings and neural voices", () => {
  test("speaker profiles count per gender, the narrator comes last", () => {
    const cast = withNarrator([
      { id: "A", gender: "f" },
      { id: "B", gender: "m" },
      { id: "C", gender: "f" },
    ]);
    const p = speakerProfiles(cast);
    expect(p.get("C")).toEqual({ gender: "f", age: "adult", index: 1 });
    expect(p.get("__sprecher")).toEqual({ gender: "m", age: "adult", index: 1 });
  });

  test("instructions are read with spoken ranges", () => {
    expect(spokenInstruction("Lesen Sie die Aufgaben 41–45 und die Anzeigen a–l.")).toBe("Lesen Sie die Aufgaben 41 bis 45 und die Anzeigen a bis l.");
  });

  test("file keys are stable and depend on text and speaker", async () => {
    const f0 = { gender: "f" as const, age: "adult" as const, index: 0 };
    expect(await audioKey("Guten Tag.", f0)).toBe(await audioKey(" Guten Tag. ", f0));
    expect(await audioKey("Guten Tag.", f0)).not.toBe(await audioKey("Guten Tag.", { ...f0, index: 1 }));
    expect(await audioKey("Guten Tag.", f0)).toMatch(/^[0-9a-f]{24}$/);
  });

  test("neural voices: distinct per speaker, user override for the first", () => {
    const f = (index: number) => ({ gender: "f" as const, age: "adult" as const, index });
    expect(neuralVoiceFor("openai", f(0))).not.toBe(neuralVoiceFor("openai", f(1)));
    expect(neuralVoiceFor("openai", f(0), { f: "sage" })).toBe("sage");
    expect(neuralVoiceFor("openai", f(1), { f: "sage" })).not.toBe("sage");
  });
});
