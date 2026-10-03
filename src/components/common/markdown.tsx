import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Block Markdown (paragraphs, lists, emphasis) for explanations. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 text-[15px] leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

/** Inline **bold**, *italic* and `code` for short strings (examples, labels). Safe in client components. */
export function InlineMd({ text, className, boldClass }: { text: string; className?: string; boldClass?: string }) {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**"))
      nodes.push(
        <strong key={i++} className={cn("font-semibold", boldClass)}>
          {tok.slice(2, -2)}
        </strong>,
      );
    else if (tok.startsWith("`"))
      nodes.push(
        <code key={i++} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
          {tok.slice(1, -1)}
        </code>,
      );
    else nodes.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    last = m.index! + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className={className}>{nodes}</span>;
}
