"use client";

import { CircleCheck, Eye, EyeOff, Loader2, PlugZap, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale, useT } from "@/i18n/client";
import { DEFAULT_MODEL_HINTS, MODEL_SUGGESTIONS } from "@/lib/ai/models";
import { PROVIDER_IDS, type ProviderId } from "@/lib/ai/providers/types";
import { aiFetch, PROVIDER_LABELS, serverAiStatus, type ServerAiStatus } from "@/lib/ai/request";
import { useAiConfig, type LlmChoice } from "@/lib/store/ai-config";
import { cn } from "@/lib/utils";

/** Password-style input for API keys, with a show/hide toggle. */
export function KeyInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const t = useT().aiSettings.ai;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" variant="outline" size="icon-lg" onClick={() => setVisible((v) => !v)} aria-label={visible ? t.hide : t.show}>
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  );
}

export function AiSettings() {
  const locale = useLocale();
  const t = useT().aiSettings.ai;
  const cfg = useAiConfig(
    useShallow((s) => ({ llm: s.llm, models: s.models, baseUrl: s.baseUrl, keys: s.keys, update: s.update, setKey: s.setKey, setModel: s.setModel, forgetKeys: s.forgetKeys })),
  );
  const [server, setServer] = useState<ServerAiStatus | null>(null);
  const [test, setTest] = useState<{ state: "idle" | "running" | "ok" | "error"; message?: string }>({ state: "idle" });
  const modelListId = useId();

  useEffect(() => {
    let alive = true;
    void serverAiStatus().then((s) => alive && setServer(s));
    return () => {
      alive = false;
    };
  }, []);

  const provider = cfg.llm === "server" ? null : cfg.llm;

  const runTest = async () => {
    setTest({ state: "running" });
    try {
      const res = await aiFetch("/api/ai/test", { locale });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; provider?: ProviderId; model?: string; error?: string };
      if (res.ok && data.ok) setTest({ state: "ok", message: t.testOk(`${PROVIDER_LABELS[data.provider!] ?? data.provider} · ${data.model}`) });
      else setTest({ state: "error", message: data.error || t.testFailed });
    } catch {
      setTest({ state: "error", message: t.testFailed });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.intro}</p>

      <div className="space-y-1.5">
        <div className="text-sm font-medium">{t.provider}</div>
        <Select
          value={cfg.llm}
          onValueChange={(v) => {
            cfg.update({ llm: v as LlmChoice });
            setTest({ state: "idle" });
          }}
        >
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="server">{t.server}</SelectItem>
            {PROVIDER_IDS.map((p) => (
              <SelectItem key={p} value={p}>
                {t.providers[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cfg.llm === "server" && server && (
          <p className={cn("text-xs", server.available ? "text-muted-foreground" : "text-warning")}>
            {server.available ? t.serverActive(`${PROVIDER_LABELS[server.provider as ProviderId] ?? server.provider} · ${server.model}`) : t.serverNone}
          </p>
        )}
      </div>

      {provider && (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <KeyInput
            label={provider === "compatible" ? t.keyOptional : t.key}
            value={cfg.keys[provider] ?? ""}
            onChange={(v) => cfg.setKey(provider, v)}
            placeholder={t.keyPlaceholder}
          />
          {provider === "compatible" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={`${modelListId}-url`}>
                {t.baseUrl}
              </label>
              <input
                id={`${modelListId}-url`}
                value={cfg.baseUrl}
                onChange={(e) => cfg.update({ baseUrl: e.target.value.trim() })}
                placeholder="https://openrouter.ai/api/v1"
                spellCheck={false}
                className="h-9 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">{t.baseUrlHint}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor={`${modelListId}-model`}>
              {t.model}
            </label>
            <input
              id={`${modelListId}-model`}
              list={modelListId}
              value={cfg.models[provider] ?? ""}
              onChange={(e) => cfg.setModel(provider, e.target.value)}
              placeholder={DEFAULT_MODEL_HINTS[provider] || "model-id"}
              spellCheck={false}
              className="h-9 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <datalist id={modelListId}>
              {MODEL_SUGGESTIONS[provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">{t.modelHint(DEFAULT_MODEL_HINTS[provider])}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={runTest} disabled={test.state === "running"}>
          {test.state === "running" ? <Loader2 className="animate-spin" /> : <PlugZap />} {test.state === "running" ? t.testing : t.test}
        </Button>
        {test.state === "ok" && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CircleCheck className="size-4" /> {test.message}
          </span>
        )}
        {test.state === "error" && <span className="text-sm text-destructive">{test.message}</span>}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-t pt-4">
        <p className="flex max-w-xl gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {t.privacy}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            cfg.forgetKeys();
            setTest({ state: "idle" });
            toast.success(t.forgotten);
          }}
        >
          <Trash2 /> {t.forget}
        </Button>
      </div>
    </div>
  );
}
