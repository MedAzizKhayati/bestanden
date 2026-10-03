"use client";

import { ThemeProvider } from "next-themes";
import { AudioEngineSync } from "@/components/audio-engine";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreHydration } from "@/lib/store/hydration";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={250}>
        <StoreHydration />
        <AudioEngineSync />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
