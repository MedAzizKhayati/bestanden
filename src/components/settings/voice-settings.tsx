"use client";

import { Info, Loader2, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import { createNeuralResolver } from "@/lib/audio/resolvers";
import { germanVoices, loadVoices, playLines, voiceGender, voiceTier, type Gender } from "@/lib/audio/speech";
import { NEURAL_VOICES, type NeuralEngine } from "@/lib/audio/voice-map";
import { ttsKeyId, useAiConfig, type TtsChoice } from "@/lib/store/ai-config";
import { useSettings } from "@/lib/store/settings";
import { KeyInput } from "./ai-settings";

const ENGINES: TtsChoice[] = ["browser", "openai", "elevenlabs", "google"];
const ENGINE_NAMES: Record<NeuralEngine, string> = { openai: "OpenAI", elevenlabs: "ElevenLabs", google: "Google Cloud" };
const SAMPLE: Record<Gender, string> = { f: "Hallo! So klinge ich in den Hörtexten.", m: "Guten Tag! Und so klingt meine Stimme." };

export function VoiceSettings() {
  const locale = useLocale();
  const t = useT();
  const tv = t.aiSettings.voices;
  const settings = useSettings(useShallow((s) => ({ voiceFemale: s.voiceFemale, voiceMale: s.voiceMale, speechRate: s.speechRate, update: s.update })));
  const ai = useAiConfig(useShallow((s) => ({ tts: s.tts, keys: s.keys, ttsVoices: s.ttsVoices, update: s.update, setKey: s.setKey, setTtsVoice: s.setTtsVoice })));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testing, setTesting] = useState<Gender | null>(null);

  useEffect(() => {
    loadVoices().then(() => setVoices(germanVoices()));
  }, []);

  const engine = ai.tts;
  const female = voices.filter((v) => voiceGender(v) !== "m");
  const male = voices.filter((v) => voiceGender(v) !== "f");
  const noGoodMale = voices.length > 0 && !voices.some((v) => voiceGender(v) === "m");

  const testBrowser = async (gender: Gender) => {
    setTesting(gender);
    const voiceURI = gender === "f" ? settings.voiceFemale : settings.voiceMale;
    await playLines([{ s: "t", t: SAMPLE[gender] }], {
      speakers: [{ id: "t", gender }],
      prefs: { female: gender === "f" ? voiceURI : undefined, male: gender === "m" ? voiceURI : undefined, rate: settings.speechRate },
    }).done;
    setTesting(null);
  };

  const testNeural = async (neural: NeuralEngine, gender: Gender) => {
    setTesting(gender);
    const resolve = createNeuralResolver(neural, { key: ai.keys[ttsKeyId(neural)] || undefined, voices: ai.ttsVoices[neural] });
    const url = await resolve(SAMPLE[gender], { gender, age: "adult", index: 0 }, new AbortController().signal);
    if (!url) toast.error(tv.testFailed);
    else {
      const audio = new Audio(url);
      audio.playbackRate = settings.speechRate;
      await audio.play().catch(() => toast.error(tv.testFailed));
      await new Promise<void>((r) => {
        audio.onended = () => r();
        audio.onerror = () => r();
      });
    }
    setTesting(null);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="text-sm font-medium">{tv.engine}</div>
        <Select value={engine} onValueChange={(v) => ai.update({ tts: v as TtsChoice })}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENGINES.map((e) => (
              <SelectItem key={e} value={e}>
                {tv.engines[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{tv.engineHints[engine]}</p>
      </div>

      {engine === "browser" ? (
        voices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tv.none}</p>
        ) : (
          <div className="space-y-3">
            <BrowserVoiceRow label={tv.female} voices={female} value={settings.voiceFemale} onChange={(v) => settings.update({ voiceFemale: v })} onTest={() => testBrowser("f")} testing={testing === "f"} />
            <BrowserVoiceRow label={tv.male} voices={male} value={settings.voiceMale} onChange={(v) => settings.update({ voiceMale: v })} onTest={() => testBrowser("m")} testing={testing === "m"} />
            {noGoodMale && (
              <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" /> {tv.onlyFemale}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <KeyInput
            label={tv.key(ENGINE_NAMES[engine])}
            value={ai.keys[ttsKeyId(engine)] ?? ""}
            onChange={(v) => ai.setKey(ttsKeyId(engine), v)}
            placeholder={t.aiSettings.ai.keyPlaceholder}
          />
          {engine === "openai" && <p className="-mt-2 text-xs text-muted-foreground">{tv.sharedKey}</p>}
          {(["f", "m"] as const).map((g) => (
            <NeuralVoiceRow
              key={g}
              label={g === "f" ? tv.female : tv.male}
              options={NEURAL_VOICES[engine][g]}
              value={ai.ttsVoices[engine]?.[g]}
              onChange={(v) => ai.setTtsVoice(engine, g, v)}
              onTest={() => testNeural(engine, g)}
              testing={testing === g}
            />
          ))}
          <p className="text-xs text-muted-foreground">{tv.cached}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 basis-36">
          <div className="text-sm font-medium">{t.settings.voices.rate(formatNumber(settings.speechRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</div>
          <div className="text-xs text-muted-foreground">{t.settings.voices.rateHint}</div>
        </div>
        <Slider className="w-48" min={0.8} max={1.15} step={0.05} value={[settings.speechRate]} onValueChange={([v]) => settings.update({ speechRate: v })} />
      </div>

      <p className="text-xs text-muted-foreground">{tv.recordings}</p>

      {engine === "browser" && (
        <details className="rounded-xl border p-3 text-sm">
          <summary className="cursor-pointer font-medium">{tv.installTitle}</summary>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>{tv.install.mac}</li>
            <li>{tv.install.windows}</li>
            <li>{tv.install.mobile}</li>
          </ul>
        </details>
      )}
    </div>
  );
}

function BrowserVoiceRow({
  label,
  voices,
  value,
  onChange,
  onTest,
  testing,
}: {
  label: string;
  voices: SpeechSynthesisVoice[];
  value?: string;
  onChange: (v: string | undefined) => void;
  onTest: () => void;
  testing: boolean;
}) {
  const tv = useT().aiSettings.voices;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Select value={value ?? "auto"} onValueChange={(v) => onChange(v === "auto" ? undefined : v)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">{tv.auto}</SelectItem>
            {voices.map((v) => {
              const tier = voiceTier(v);
              return (
                <SelectItem key={v.voiceURI} value={v.voiceURI}>
                  <span className="flex items-center gap-2">
                    {v.name}
                    {tier !== "novelty" && tier !== "standard" && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {tv.tier[tier]}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onTest} disabled={testing} aria-label={tv.test}>
          {testing ? <Loader2 className="animate-spin" /> : <Play />}
        </Button>
      </div>
    </div>
  );
}

function NeuralVoiceRow({
  label,
  options,
  value,
  onChange,
  onTest,
  testing,
}: {
  label: string;
  options: { id: string; label: string }[];
  value?: string;
  onChange: (v: string) => void;
  onTest: () => void;
  testing: boolean;
}) {
  const tv = useT().aiSettings.voices;
  const known = !value || options.some((o) => o.id === value);
  const [custom, setCustom] = useState(!known);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-2">
          <Select
            value={custom ? "__custom" : (value ?? options[0].id)}
            onValueChange={(v) => {
              if (v === "__custom") setCustom(true);
              else {
                setCustom(false);
                onChange(v);
              }
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value="__custom">{tv.customVoice}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onTest} disabled={testing} aria-label={tv.test}>
            {testing ? <Loader2 className="animate-spin" /> : <Play />}
          </Button>
        </div>
      </div>
      {custom && (
        <input
          value={known ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={tv.customVoicePlaceholder}
          spellCheck={false}
          className="h-9 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}
