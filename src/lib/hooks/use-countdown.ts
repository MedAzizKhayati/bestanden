"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wall-clock countdown. Time is derived from `startedAt`, so pausing the tab,
 * reloading or navigating away never gives extra time.
 */
export function useCountdown({
  startedAt,
  limitSec,
  running,
  onExpire,
}: {
  startedAt: number | null;
  limitSec: number;
  running: boolean;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    expiredRef.current = false;
  }, [startedAt]);

  useEffect(() => {
    if (!running || !startedAt) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (!expiredRef.current && t - startedAt >= limitSec * 1000) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, startedAt, limitSec]);

  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const remaining = limitSec - elapsed;
  return { elapsed, remaining, overtime: Math.max(0, -remaining), expired: remaining <= 0 };
}

/** Simple seconds countdown for short phases (reading time, preparation). */
export function useSecondsLeft(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [endsAt]);
  return endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
}
