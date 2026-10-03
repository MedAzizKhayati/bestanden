"use client";

import {
  BookMarked,
  CalendarCheck,
  ChartNoAxesColumn,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  Flame,
  Gauge,
  House,
  Languages,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  RotateCcw,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "@/i18n/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useT } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { Logo } from "@/components/app/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { SECTION_UI } from "@/lib/exam/ui";
import { PLANNED_EXAMS } from "@/lib/exams";
import { useExam } from "@/lib/exams/use-exam";
import { useNow } from "@/lib/hooks/use-now";
import { useHydrated } from "@/lib/store/hydration";
import { useProgress } from "@/lib/store/progress";
import { useVocab } from "@/lib/store/vocab";
import { cn } from "@/lib/utils";
import { currentStreak } from "@/lib/utils/time";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  iconClass?: string;
  badge?: number;
  exact?: boolean;
}

export function AppSidebar() {
  const pathname = stripLocale(usePathname());
  const { setOpenMobile } = useSidebar();
  const hydrated = useHydrated();
  const exam = useExam();
  const t = useT();
  const n = t.nav;
  const mistakes = useProgress((s) => s.mistakes);
  const activity = useProgress((s) => s.activity);
  const cards = useVocab((s) => s.cards);

  const now = useNow();
  const { dueMistakes, dueCards, streak } = useMemo(() => {
    return {
      dueMistakes: Object.values(mistakes).filter((m) => !m.resolved && m.due <= now).length,
      dueCards: Object.values(cards).filter((c) => c.due <= now).length,
      streak: currentStreak(new Set(Object.keys(activity)), now),
    };
  }, [mistakes, cards, activity, now]);

  const practice: NavItem[] = exam.sections.map((s) => ({
    title: s.short,
    href: `/${exam.slug}/${s.id}`,
    icon: SECTION_UI[s.id].icon,
    iconClass: SECTION_UI[s.id].text,
  }));

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: n.groupStart,
      items: [
        { title: n.dashboard, href: "/", icon: House, exact: true },
        { title: n.examOverview, href: `/${exam.slug}`, icon: ClipboardCheck, exact: true },
        { title: n.placement, href: "/einstufung", icon: Gauge },
      ],
    },
    {
      label: n.groupPractice,
      items: [...practice, { title: n.mockExams, href: `/${exam.slug}/modelltest`, icon: Trophy, iconClass: "text-gold" }],
    },
    {
      label: n.groupLearn,
      items: [
        { title: n.grammar, href: "/grammatik", icon: BookMarked },
        { title: n.vocabulary, href: "/wortschatz", icon: Languages, badge: hydrated ? dueCards : 0 },
        { title: n.phrases, href: "/redemittel", icon: MessageSquareQuote },
        { title: n.wordLists, href: "/listen", icon: ListChecks },
        { title: n.strategies, href: `/${exam.slug}/strategien`, icon: Lightbulb },
      ],
    },
    {
      label: n.groupYou,
      items: [
        { title: n.mistakes, href: "/fehlertrainer", icon: RotateCcw, badge: hydrated ? dueMistakes : 0 },
        { title: n.progress, href: "/fortschritt", icon: ChartNoAxesColumn },
        { title: n.studyPlan, href: "/lernplan", icon: CalendarCheck },
        { title: n.settings, href: "/einstellungen", icon: Settings },
      ],
    },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="gap-3 px-3 pt-4">
        <Link href="/" className="rounded-md outline-none focus-visible:ring-2 group-data-[collapsible=icon]:-mx-1" onClick={() => setOpenMobile(false)}>
          <Logo className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent group-data-[collapsible=icon]:hidden">
              <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                {exam.level}
              </span>
              <span className="flex-1 truncate font-medium">{exam.name}</span>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>{n.chooseExam}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/${exam.slug}`}>
                <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">{exam.level}</span>
                <span className="flex-1">{exam.name}</span>
                <Check className="text-primary" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {PLANNED_EXAMS.map((p) => (
              <DropdownMenuItem key={p.slug} disabled>
                <span className="grid size-6 place-items-center rounded-md bg-muted text-[11px] font-bold">{p.level}</span>
                <span className="flex-1">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">{p.status === "preparing" ? n.inPreparation : n.planned}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.title}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon className={cn(item.iconClass)} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge className="bg-primary/10 text-primary">{item.badge}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <span className={cn("grid size-8 place-items-center rounded-full", streak ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground")}>
            <Flame className="size-4" />
          </span>
          <div className="text-xs leading-tight">
            <div className="font-semibold">{n.streak(hydrated ? streak : 0)}</div>
            <div className="text-muted-foreground">{streak ? n.streakKeep : n.streakStart}</div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
