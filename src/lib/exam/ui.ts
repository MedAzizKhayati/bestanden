import { BookOpen, Headphones, Mic, PenLine, Puzzle, type LucideIcon } from "lucide-react";
import type { SectionId } from "@/lib/content/schemas";

export interface SectionUi {
  icon: LucideIcon;
  /** Static Tailwind class strings (must stay literal for class detection). */
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  gradient: string;
}

export const SECTION_UI: Record<SectionId, SectionUi> = {
  lesen: {
    icon: BookOpen,
    text: "text-lesen",
    bg: "bg-lesen",
    bgSoft: "bg-lesen/10",
    border: "border-lesen/30",
    ring: "ring-lesen/30",
    gradient: "from-lesen/15 via-lesen/5 to-transparent",
  },
  sprachbausteine: {
    icon: Puzzle,
    text: "text-sprachbausteine",
    bg: "bg-sprachbausteine",
    bgSoft: "bg-sprachbausteine/10",
    border: "border-sprachbausteine/30",
    ring: "ring-sprachbausteine/30",
    gradient: "from-sprachbausteine/15 via-sprachbausteine/5 to-transparent",
  },
  hoeren: {
    icon: Headphones,
    text: "text-hoeren",
    bg: "bg-hoeren",
    bgSoft: "bg-hoeren/10",
    border: "border-hoeren/30",
    ring: "ring-hoeren/30",
    gradient: "from-hoeren/15 via-hoeren/5 to-transparent",
  },
  schreiben: {
    icon: PenLine,
    text: "text-schreiben",
    bg: "bg-schreiben",
    bgSoft: "bg-schreiben/10",
    border: "border-schreiben/30",
    ring: "ring-schreiben/30",
    gradient: "from-schreiben/15 via-schreiben/5 to-transparent",
  },
  sprechen: {
    icon: Mic,
    text: "text-sprechen",
    bg: "bg-sprechen",
    bgSoft: "bg-sprechen/10",
    border: "border-sprechen/30",
    ring: "ring-sprechen/30",
    gradient: "from-sprechen/15 via-sprechen/5 to-transparent",
  },
};
