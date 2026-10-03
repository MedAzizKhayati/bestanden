import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-sm shadow-primary/30",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6}>
        <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-sidebar bg-gold" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">Bestanden</span>
        <span className="text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">telc Prüfungstraining</span>
      </span>
    </span>
  );
}
