import { AlertTriangle, BookOpenCheck, Lightbulb, X } from "lucide-react";
import { InlineMd, Markdown } from "@/components/common/markdown";
import type { Messages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import type { GrammarBlock, GrammarTopic } from "@/lib/content/schemas";

/** Server Component: renders a topic's explanation blocks in the request's UI language. */
export async function GrammarBlocks({ blocks }: { blocks: GrammarBlock[] }) {
  const labels = (await getT()).grammar.blocks;
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} labels={labels} />
      ))}
    </div>
  );
}

function BlockView({ block, labels }: { block: GrammarBlock; labels: Messages["grammar"]["blocks"] }) {
  switch (block.type) {
    case "rule":
      return (
        <div className="flex gap-3 rounded-2xl border-2 border-primary/25 bg-primary/5 p-4 sm:p-5">
          <BookOpenCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <Markdown className="font-medium">{block.md}</Markdown>
        </div>
      );
    case "text":
      return (
        <section className="space-y-2">
          {block.heading && <h3 className="text-lg font-semibold tracking-tight">{block.heading}</h3>}
          <Markdown className="text-foreground/90">{block.md}</Markdown>
        </section>
      );
    case "table":
      return (
        <section className="space-y-2">
          {block.heading && <h3 className="text-lg font-semibold tracking-tight">{block.heading}</h3>}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {block.columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {block.rows.map((r, i) => (
                  <tr key={i} className="even:bg-muted/20">
                    {r.map((cell, j) => (
                      <td key={j} className={j === 0 ? "px-3 py-2 font-medium" : "px-3 py-2"}>
                        <InlineMd text={cell} boldClass="text-primary" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.note && <p className="text-xs text-muted-foreground">{block.note}</p>}
        </section>
      );
    case "examples":
      return (
        <section className="space-y-2">
          {block.heading && <h3 className="text-lg font-semibold tracking-tight">{block.heading}</h3>}
          <ul className="divide-y rounded-xl border">
            {block.items.map((ex) => (
              <li key={ex.de} className="px-4 py-2.5">
                <div className="reading text-[15.5px] leading-snug">
                  <InlineMd text={ex.de} boldClass="text-primary" />
                </div>
                <div className="text-sm text-muted-foreground">{ex.en}</div>
              </li>
            ))}
          </ul>
        </section>
      );
    case "tip":
      return (
        <div className="flex gap-3 rounded-2xl border border-gold/40 bg-gold/8 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold" />
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wide text-gold uppercase">{labels.tip}</div>
            <Markdown>{block.md}</Markdown>
          </div>
        </div>
      );
    case "warning":
      return (
        <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wide text-destructive uppercase">{labels.warning}</div>
            <Markdown>{block.md}</Markdown>
          </div>
        </div>
      );
  }
}

export function MistakesList({ mistakes }: { mistakes: GrammarTopic["mistakes"] }) {
  return (
    <ul className="space-y-3">
      {mistakes.map((m) => (
        <li key={m.wrong} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 text-destructive">
              <X className="size-4" />
              <span className="reading line-through decoration-destructive/50">{m.wrong}</span>
            </span>
            <span className="reading font-semibold text-success">✓ {m.right}</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{m.why}</p>
        </li>
      ))}
    </ul>
  );
}
