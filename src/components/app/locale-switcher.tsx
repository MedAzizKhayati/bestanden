"use client";

import { Check, Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useT } from "@/i18n/client";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Remember the choice (the proxy reads it for unprefixed URLs) and open the same page in the other language. */
export function useSwitchLocale() {
  const pathname = usePathname();
  const router = useRouter();
  return (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(`${switchLocalePath(pathname, next)}${window.location.search}${window.location.hash}`);
  };
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const switchTo = useSwitchLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5 px-2.5", className)} aria-label={t.nav.language}>
          <Languages />
          <span className="text-xs font-semibold">{LOCALE_LABELS[locale].short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t.nav.language}</DropdownMenuLabel>
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => l !== locale && switchTo(l)} lang={l}>
            <span className="grid w-7 place-items-center rounded bg-muted text-[11px] font-bold">{LOCALE_LABELS[l].short}</span>
            <span className="flex-1">{LOCALE_LABELS[l].native}</span>
            {l === locale && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
