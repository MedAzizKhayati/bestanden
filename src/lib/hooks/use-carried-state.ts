"use client";

/**
 * State that survives switching the UI language.
 *
 * The locale is the first URL segment, so /en/… → /de/… remounts the whole page and every useState starts
 * over. Right before switching, the locale switcher calls `announceLocaleSwitch()`; each carried state then
 * writes a snapshot to sessionStorage, and the same component on the page in the other language starts from
 * it. Snapshots are short-lived and removed once read, so they never resurface on a later visit.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { stripLocale } from "@/i18n/config";

const EVENT = "bestanden:locale-switch";
const PREFIX = "bestanden:carry:";
const MAX_AGE_MS = 30_000;

export function announceLocaleSwitch() {
  window.dispatchEvent(new Event(EVENT));
}

function readSnapshot<T>(key: string): { value: T } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as { at: number; value: T };
    return Date.now() - snapshot.at < MAX_AGE_MS ? { value: snapshot.value } : null;
  } catch {
    return null;
  }
}

/** Like useState, but kept across a language switch. `name` must be unique on the page. JSON values only. */
export function useCarriedState<T>(name: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const key = `${PREFIX}${stripLocale(usePathname())}:${name}`;
  const [value, setValue] = useState<T>(() => {
    const snapshot = readSnapshot<T>(key);
    if (snapshot) return snapshot.value;
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    // Read once (the initializer above) – drop it so a later visit starts fresh.
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
    const save = () => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value: latest.current }));
      } catch {
        /* storage full or unavailable: the state is simply not carried */
      }
    };
    window.addEventListener(EVENT, save);
    return () => window.removeEventListener(EVENT, save);
  }, [key]);

  return [value, setValue];
}
