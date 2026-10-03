"use client";

import Link from "@/i18n/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n/client";
import { useHydrated } from "@/lib/store/hydration";
import { useVocab } from "@/lib/store/vocab";
import { Flashcards } from "./flashcards";
import type { ClientWord } from "./word-bits";

/** Review all due cards across themes (no new cards). */
export function ReviewSession({ words }: { words: ClientWord[] }) {
  const labels = useT().vocab.review;
  const hydrated = useHydrated();
  const cards = useVocab((s) => s.cards);
  const inDeck = useMemo(() => words.filter((w) => cards[w.id]), [words, cards]);
  if (!hydrated) return <Skeleton className="h-80 rounded-3xl" />;
  if (!inDeck.length)
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <div className="text-lg font-semibold">{labels.emptyTitle}</div>
        <p className="mt-1 text-sm text-muted-foreground">{labels.emptyText}</p>
        <Button asChild className="mt-4">
          <Link href="/wortschatz">{labels.chooseTheme}</Link>
        </Button>
      </div>
    );
  return <Flashcards words={inDeck} newLimit={0} />;
}
