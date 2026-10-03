"use client";

import { ChevronRight } from "lucide-react";
import { useT } from "@/i18n/client";
import Link from "@/i18n/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useT();
  return (
    <nav aria-label={t.exam.pageHeader.breadcrumb} className={cn("flex flex-wrap items-center gap-1 text-xs text-muted-foreground", className)}>
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 opacity-60" />}
          {c.href ? (
            <Link href={c.href} className="transition-colors hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground/80">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  crumbs,
  icon,
  actions,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  crumbs?: Crumb[];
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon}
          <div className="min-w-0 space-y-1.5">
            {eyebrow && <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{eyebrow}</div>}
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
            {description && <p className="max-w-2xl text-[15px] text-pretty text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function PageContainer({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-6 sm:px-8 sm:py-8", wide ? "max-w-7xl" : "max-w-6xl", className)}>{children}</div>;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
