"use client";

import { Check, Layers, ListChecks, Plus, Search, Shapes, SquareStack } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/i18n/client";
import { useHydrated } from "@/lib/store/hydration";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";
import { Flashcards } from "./flashcards";
import { ArticleTrainer, MeaningQuiz } from "./quizzes";
import { SpeakButton, spokenForm, WordLabel, type ClientWord } from "./word-bits";

const POS_LABEL: Record<string, string> = {
  noun: "Nomen",
  verb: "Verb",
  adjective: "Adjektiv",
  adverb: "Adverb",
  phrase: "Wendung",
  preposition: "Präposition",
  conjunction: "Konjunktion",
  other: "Andere",
};

export function ThemeView({ words }: { words: ClientWord[] }) {
  const t = useT();
  const labels = t.vocab.theme;
  const hydrated = useHydrated();
  const cards = useVocab((s) => s.cards);
  const learn = useVocab((s) => s.learn);
  const forget = useVocab((s) => s.forget);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<string>("all");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => words.filter((w) => (pos === "all" || w.pos === pos) && (!q || w.de.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))),
    [words, pos, q],
  );
  const inDeck = hydrated ? words.filter((w) => cards[w.id]).length : 0;
  const posList = [...new Set(words.map((w) => w.pos))];

  return (
    <Tabs defaultValue="list">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="list">
            <ListChecks /> {labels.tabs.words}
          </TabsTrigger>
          <TabsTrigger value="cards">
            <SquareStack /> {labels.tabs.cards}
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Layers /> {labels.tabs.quiz}
          </TabsTrigger>
          <TabsTrigger value="article">
            <Shapes /> {labels.tabs.article}
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{labels.inDeck(inDeck, words.length)}</span>
          {inDeck < words.length && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                learn(words.map((w) => w.id));
                toast.success(labels.added(words.length - inDeck));
              }}
            >
              <Plus /> {labels.addAll}
            </Button>
          )}
        </div>
      </div>

      <TabsContent value="list" className="mt-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {["all", ...posList].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPos(p)}
                className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", pos === p ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {p === "all" ? t.common.all : POS_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {filtered.map((w) => {
            const added = hydrated && !!cards[w.id];
            return (
              <li key={w.id} className="flex items-start gap-3 px-4 py-3">
                <SpeakButton text={spokenForm(w)} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <WordLabel word={w} className="text-[16px]" />
                    {w.plural && w.plural !== "–" && <span className="text-sm text-muted-foreground">{labels.pluralShort} {w.plural}</span>}
                    {w.forms && <span className="text-sm text-muted-foreground">{w.forms}</span>}
                    <span className="text-sm">{w.en}</span>
                  </div>
                  <div className="reading mt-1 text-[14.5px] text-foreground/80">
                    {w.example} <span className="font-sans text-xs text-muted-foreground">– {w.exampleEn}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => (added ? forget(w.id) : learn([w.id]))}
                  aria-label={added ? labels.removeCard : labels.addCard}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                    added ? "border-success/40 bg-success/10 text-success" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {added ? <Check className="size-4" /> : <Plus className="size-4" />}
                </button>
              </li>
            );
          })}
          {!filtered.length && <li className="p-6 text-center text-sm text-muted-foreground">{labels.noMatch}</li>}
        </ul>
      </TabsContent>
      <TabsContent value="cards" className="mt-5">
        {hydrated && <Flashcards words={words} newLimit={10} />}
      </TabsContent>
      <TabsContent value="quiz" className="mt-5">
        <MeaningQuiz words={words} />
      </TabsContent>
      <TabsContent value="article" className="mt-5">
        <ArticleTrainer words={words} />
      </TabsContent>
    </Tabs>
  );
}
