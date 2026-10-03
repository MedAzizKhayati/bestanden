"use client";

import { Check, CornerDownLeft, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeakButton } from "@/components/vocab/word-bits";
import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import type { ReferenceList } from "@/lib/content/schemas";
import { listSpeech } from "@/lib/content/spoken";
import { useProgress } from "@/lib/store/progress";
import { cn } from "@/lib/utils";
import { answerMatches, seededShuffle } from "@/lib/utils/text";

type Labels = Messages["lists"];

function rows(list: ReferenceList, groups: Labels["groups"]): { key: string; cells: string[]; speak: string; search: string }[] {
  const speech = listSpeech(list);
  switch (list.kind) {
    case "verb-preposition":
      return list.items.map((i, n) => ({
        key: `${i.verb}-${i.prep}`,
        cells: [`${i.verb} ${i.prep}`, i.case, i.en, i.example],
        speak: speech[n],
        search: `${i.verb} ${i.prep} ${i.en}`,
      }));
    case "irregular-verbs":
      return list.items.map((i, n) => ({ key: i.inf, cells: [i.inf, i.present, i.past, i.perfect, i.en], speak: speech[n], search: `${i.inf} ${i.en} ${i.past}` }));
    case "connectors":
      return list.items.map((i, n) => ({ key: i.word, cells: [i.word, groups[i.group], i.meaning, i.example], speak: speech[n], search: `${i.word} ${i.meaning}` }));
    case "phrases":
      return list.items.map((i, n) => ({ key: i.de, cells: [i.de, i.en, i.example], speak: speech[n], search: `${i.de} ${i.en}` }));
  }
}

function headers(list: ReferenceList, c: Labels["columns"]): string[] {
  switch (list.kind) {
    case "verb-preposition":
      return [c.verbPreposition, c.case, c.english, c.example];
    case "irregular-verbs":
      return [c.infinitive, c.present, c.past, c.perfect, c.english];
    case "connectors":
      return [c.connector, c.wordOrder, c.meaning, c.example];
    case "phrases":
      return [c.expression, c.english, c.example];
  }
}

export function ListView({ list }: { list: ReferenceList }) {
  const t = useT();
  const labels = t.lists;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const all = rows(list, labels.groups);
  const visible = all.filter((r) => !q || r.search.toLowerCase().includes(q));
  return (
    <Tabs defaultValue="table">
      <TabsList>
        <TabsTrigger value="table">{labels.tabs.list(all.length)}</TabsTrigger>
        <TabsTrigger value="drill">{labels.tabs.drill}</TabsTrigger>
      </TabsList>
      <TabsContent value="table" className="mt-5 space-y-3">
        <label className="relative block max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.search}
            className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10" />
                {headers(list, labels.columns).map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((r) => (
                <tr key={r.key} className="align-top hover:bg-muted/30">
                  <td className="py-2 pl-2">
                    <SpeakButton text={r.speak} className="size-7" />
                  </td>
                  {r.cells.map((c, i) => (
                    <td key={i} className={cn("px-3 py-2.5", i === 0 && "font-semibold", i === r.cells.length - 1 && list.kind !== "irregular-verbs" && "reading text-foreground/80")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
      <TabsContent value="drill" className="mt-5">
        <ListDrill list={list} />
      </TabsContent>
    </Tabs>
  );
}

interface Question {
  prompt: string;
  sub?: string;
  options?: string[];
  answers: string[];
  reveal: string;
}

function buildQuestions(list: ReferenceList, seed: string, labels: Labels): Question[] {
  switch (list.kind) {
    case "verb-preposition": {
      const preps = [...new Set(list.items.map((i) => i.prep))];
      return seededShuffle(list.items, seed)
        .slice(0, 12)
        .map((i, k) => ({
          prompt: `${i.verb} ___`,
          sub: i.en,
          options: seededShuffle([i.prep, ...seededShuffle(preps.filter((p) => p !== i.prep), `${seed}${k}`).slice(0, 3)], `${seed}o${k}`),
          answers: [i.prep],
          reveal: `${i.verb} ${i.prep} + ${i.case} · ${i.example}`,
        }));
    }
    case "irregular-verbs":
      return seededShuffle(list.items, seed)
        .slice(0, 10)
        .flatMap((i) => [
          { prompt: `${i.inf} → Präteritum`, sub: `${i.en} · „er/sie …“`, answers: [i.past, i.past.replace(/^(er|sie|es)\s+/, "")], reveal: i.past },
          { prompt: `${i.inf} → Perfekt`, sub: `${i.en} · „er/sie … …“`, answers: [i.perfect, i.perfect.replace(/^(er|sie|es)\s+/, "")], reveal: i.perfect },
        ]);
    case "connectors": {
      const groups = [...new Set(list.items.map((i) => i.group))];
      return seededShuffle(list.items, seed)
        .slice(0, 12)
        .map((i) => ({
          prompt: i.word,
          sub: labels.drill.whichWordOrder,
          options: groups.map((g) => labels.groups[g]),
          answers: [labels.groups[i.group]],
          reveal: `${i.meaning} · ${i.example}`,
        }));
    }
    case "phrases":
      return seededShuffle(list.items, seed)
        .slice(0, 12)
        .map((i, k) => ({
          prompt: i.en,
          sub: labels.drill.chooseGerman,
          options: seededShuffle([i.de, ...seededShuffle(list.items.filter((o) => o.de !== i.de), `${seed}${k}`).slice(0, 3).map((o) => o.de)], `${seed}p${k}`),
          answers: [i.de],
          reveal: i.example,
        }));
  }
}

function ListDrill({ list }: { list: ReferenceList }) {
  const t = useT();
  const labels = t.lists;
  const logActivity = useProgress((s) => s.logActivity);
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildQuestions(list, `${list.id}-${round}`, labels), [list, round, labels]);
  const [i, setI] = useState(0);
  const [given, setGiven] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const q = questions[i];

  if (!q)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <div className="text-4xl font-bold tabular">
          {score}/{questions.length}
        </div>
        <Button
          onClick={() => {
            setRound((r) => r + 1);
            setI(0);
            setScore(0);
            setGiven(null);
          }}
        >
          <RotateCcw /> {labels.drill.newRound}
        </Button>
      </div>
    );

  const correct = given !== null && (q.options ? q.answers.includes(given) : answerMatches(given, q.answers));
  const answer = (v: string) => {
    if (given !== null) return;
    setGiven(v);
    logActivity(10, 1);
    if (q.options ? q.answers.includes(v) : answerMatches(v, q.answers)) setScore((s) => s + 1);
  };
  const next = () => {
    setGiven(null);
    setTyped("");
    setI((n) => n + 1);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="text-sm text-muted-foreground">{labels.drill.progress(i + 1, questions.length, score)}</div>
      <div className="rounded-3xl border bg-card p-6 text-center">
        <div className="reading text-2xl font-semibold">{q.prompt}</div>
        {q.sub && <div className="mt-1 text-sm text-muted-foreground">{q.sub}</div>}
      </div>
      {q.options ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o) => {
            const isAnswer = q.answers.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => answer(o)}
                className={cn(
                  "rounded-xl border bg-background px-4 py-3 text-left text-sm font-medium transition-all",
                  given === null && "hover:border-primary/50 hover:bg-primary/5",
                  given !== null && isAnswer && "border-success/50 bg-success/10 text-success",
                  given === o && !isAnswer && "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) answer(typed);
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={given !== null}
            placeholder={labels.drill.typeForm}
            className="reading h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            lang="de"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" size="lg" disabled={given !== null || !typed.trim()} aria-label={labels.drill.check}>
            <CornerDownLeft />
          </Button>
        </form>
      )}
      {given !== null && (
        <div className={cn("flex items-start gap-2 rounded-xl px-4 py-3 text-sm", correct ? "bg-success/10" : "bg-destructive/[0.07]")}>
          {correct ? <Check className="mt-0.5 size-4 text-success" /> : <X className="mt-0.5 size-4 text-destructive" />}
          <span className="reading text-[15px]">{q.reveal}</span>
        </div>
      )}
      {given !== null && (
        <Button className="w-full" size="lg" onClick={next}>
          {t.common.next}
        </Button>
      )}
    </div>
  );
}
