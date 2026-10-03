"use client";

import { Check, Download, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useSwitchLocale } from "@/components/app/locale-switcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useLocale, useT } from "@/i18n/client";
import { AiSettings } from "./ai-settings";
import { VoiceSettings } from "./voice-settings";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress, type ProgressData } from "@/lib/store/progress";
import { useSettings } from "@/lib/store/settings";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const hydrated = useHydrated();
  const locale = useLocale();
  const t = useT();
  const tr = t.settings;
  const switchLocale = useSwitchLocale();
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;

  const exportData = () => {
    const data = {
      app: "bestanden",
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: useProgress.getState(),
      vocab: { cards: useVocab.getState().cards, reviewsByDay: useVocab.getState().reviewsByDay },
      settings: { ...useSettings.getState(), update: undefined },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bestanden-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as { app?: string; progress?: Partial<ProgressData>; vocab?: { cards?: Record<string, never>; reviewsByDay?: Record<string, number> } };
      if (data.app !== "bestanden" || !data.progress) throw new Error(tr.data.notExport);
      const p = data.progress;
      useProgress.getState().importState({
        attempts: p.attempts ?? [],
        inProgress: {},
        mistakes: p.mistakes ?? {},
        writing: p.writing ?? [],
        speaking: p.speaking ?? [],
        grammar: p.grammar ?? {},
        activity: p.activity ?? {},
      });
      if (data.vocab) useVocab.getState().importState(data.vocab);
      toast.success(tr.data.imported);
    } catch (e) {
      toast.error(e instanceof SyntaxError ? tr.data.unreadable : (e as Error).message);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Section title={tr.language.title}>
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCALES.map((l) => {
              const active = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  aria-pressed={active}
                  onClick={() => !active && switchLocale(l)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    active ? "border-primary bg-primary/5 font-semibold" : "hover:bg-muted",
                  )}
                >
                  <span className={cn("grid w-8 place-items-center rounded py-0.5 text-[11px] font-bold", active ? "bg-primary/15 text-primary" : "bg-muted")}>
                    {LOCALE_LABELS[l].short}
                  </span>
                  <span className="flex-1">{LOCALE_LABELS[l].native}</span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{tr.language.hint}</p>
        </div>
        <Row label={tr.language.showEnglish} hint={tr.language.showEnglishHint}>
          <Switch checked={s.showEnglish} onCheckedChange={(v) => s.update({ showEnglish: v })} />
        </Row>
      </Section>

      <Section title={tr.timing.title}>
        <Row label={tr.timing.strict} hint={tr.timing.strictHint}>
          <Switch checked={s.strictTimer} onCheckedChange={(v) => s.update({ strictTimer: v })} />
        </Row>
      </Section>

      <Section title={tr.goals.title}>
        <Row label={tr.goals.examDate} hint={tr.goals.examDateHint}>
          <input
            type="date"
            value={s.examDate ?? ""}
            onChange={(e) => s.update({ examDate: e.target.value || undefined })}
            className="h-9 rounded-lg border bg-background px-3 text-sm"
          />
        </Row>
        <Row label={tr.goals.daily} hint={tr.goals.dailyHint}>
          <Select value={String(s.dailyGoalMinutes)} onValueChange={(v) => s.update({ dailyGoalMinutes: Number(v) })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {t.common.minutes(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </Section>

      <Section id="stimmen" title={t.aiSettings.voices.title}>
        <VoiceSettings />
      </Section>

      <Section id="ki" title={t.aiSettings.ai.title}>
        <AiSettings />
      </Section>

      <Section title={tr.data.title}>
        <p className="text-sm text-muted-foreground">{tr.data.hint}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download /> {tr.data.export}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> {tr.data.import}
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 /> {tr.data.reset}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr.data.resetTitle}</AlertDialogTitle>
                <AlertDialogDescription>{tr.data.resetText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    useProgress.getState().resetAll();
                    useVocab.getState().resetAll();
                    toast.success(tr.data.deleted);
                  }}
                >
                  {tr.data.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 flex-1 basis-36">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
