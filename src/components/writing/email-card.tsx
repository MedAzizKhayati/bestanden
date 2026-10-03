import { Mail, Megaphone } from "lucide-react";
import type { WritingSet } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

export function EmailCard({ stimulus, className }: { stimulus: WritingSet["stimulus"]; className?: string }) {
  if (stimulus.kind !== "email") {
    return (
      <div className={cn("rounded-xl border-2 border-paper-foreground/60 bg-paper p-5 text-paper-foreground", className)}>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-paper-foreground/60 uppercase">
          <Megaphone className="size-3.5" /> {stimulus.kind === "ad" ? "Anzeige" : "Aushang"}
        </div>
        {stimulus.subject && <div className="mb-1 font-reading text-lg font-bold">{stimulus.subject}</div>}
        <div className="reading text-[15px] whitespace-pre-line">{stimulus.body}</div>
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-paper text-paper-foreground shadow-xs", className)}>
      <div className="space-y-1 border-b bg-muted/40 px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <Mail className="size-3.5" /> Posteingang
        </div>
        {stimulus.from && (
          <div>
            <span className="text-muted-foreground">Von: </span>
            <span className="font-medium">{stimulus.from}</span>
          </div>
        )}
        {stimulus.subject && (
          <div>
            <span className="text-muted-foreground">Betreff: </span>
            <span className="font-medium">{stimulus.subject}</span>
          </div>
        )}
      </div>
      <div className="reading px-4 py-4 text-[15px] whitespace-pre-line sm:px-5">{stimulus.body}</div>
    </div>
  );
}
