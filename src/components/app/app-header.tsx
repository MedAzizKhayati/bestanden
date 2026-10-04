"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/app/locale-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useT } from "@/i18n/client";

export interface SearchEntry {
  group: string;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string;
}

export function AppHeader({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = [...new Set(searchIndex.map((e) => e.group))];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/65 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      {/* min-w-0: without it the placeholder's full width stops the button from shrinking and the
          header overflows narrow phones (Safari then zooms the whole page out). */}
      <button
        onClick={() => setOpen(true)}
        className="ml-1 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{t.nav.searchPlaceholder}</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title={t.nav.searchDialogTitle} description={t.nav.searchDialogDescription}>
        {/* CommandDialog is only the dialog: the cmdk root must wrap input and list, or cmdk crashes on open. */}
        <Command>
          <CommandInput placeholder={t.nav.searchInput} />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>{t.nav.searchEmpty}</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g} heading={g}>
                {searchIndex
                  .filter((e) => e.group === g)
                  .map((e) => (
                    <CommandItem
                      key={e.href + e.title}
                      value={`${e.title} ${e.subtitle ?? ""} ${e.keywords ?? ""}`}
                      onSelect={() => {
                        setOpen(false);
                        router.push(e.href);
                      }}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{e.title}</span>
                        {e.subtitle ? <span className="truncate text-xs text-muted-foreground">{e.subtitle}</span> : null}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  );
}
