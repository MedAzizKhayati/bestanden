"use client";

import { AlarmClock, TimerReset } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/i18n/client";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";

export function CountdownTimer({
  startedAt,
  limitSec,
  strict,
  running = true,
  onExpire,
  onTick,
  compact,
}: {
  startedAt: number;
  limitSec: number;
  strict: boolean;
  running?: boolean;
  onExpire?: () => void;
  onTick?: (elapsed: number) => void;
  compact?: boolean;
}) {
  const { remaining, overtime, elapsed } = useCountdown({ startedAt, limitSec, running, onExpire });
  const t = useT();
  const warned = useRef({ five: false, one: false });

  useEffect(() => {
    onTick?.(elapsed);
  }, [elapsed, onTick]);

  useEffect(() => {
    if (!running) return;
    if (limitSec > 6 * 60 && remaining <= 300 && remaining > 290 && !warned.current.five) {
      warned.current.five = true;
      toast.warning(t.runner.timer.minutesLeft(5), { description: strict ? t.runner.timer.autoSubmit : undefined });
    }
    if (remaining <= 60 && remaining > 55 && !warned.current.one) {
      warned.current.one = true;
      toast.warning(t.runner.timer.minutesLeft(1));
    }
  }, [remaining, running, limitSec, strict, t]);

  const fraction = Math.max(0, Math.min(1, remaining / limitSec));
  const state = overtime > 0 ? "over" : remaining <= 60 ? "critical" : remaining <= Math.min(300, limitSec * 0.2) ? "low" : "ok";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative flex items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 font-mono text-sm font-semibold tabular transition-colors",
            state === "ok" && "bg-background",
            state === "low" && "border-warning/50 bg-warning/10 text-warning-foreground dark:text-warning",
            state === "critical" && "animate-pulse border-destructive/50 bg-destructive/10 text-destructive",
            state === "over" && "border-destructive/50 bg-destructive/10 text-destructive",
          )}
          role="timer"
          aria-live="off"
        >
          {state === "over" ? <TimerReset className="size-4" /> : <AlarmClock className="size-4" />}
          <span>{state === "over" ? `+${formatClock(overtime)}` : formatClock(remaining)}</span>
          {!compact && (
            <span className="hidden font-sans text-xs font-medium text-muted-foreground sm:inline">/ {t.common.minutes(Math.round(limitSec / 60))}</span>
          )}
          <span
            className={cn(
              "absolute bottom-0 left-0 h-0.5 transition-[width] duration-300",
              state === "ok" ? "bg-primary" : state === "low" ? "bg-warning" : "bg-destructive",
            )}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {strict ? t.runner.timer.strictTip : t.runner.timer.practiceTip}
      </TooltipContent>
    </Tooltip>
  );
}
