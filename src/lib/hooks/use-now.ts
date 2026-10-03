"use client";

import { useEffect, useState } from "react";

/** Current time as state, refreshed every `refreshMs` – keeps render functions pure. */
export function useNow(refreshMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return now;
}
