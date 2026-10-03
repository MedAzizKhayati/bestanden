import { LOCALE_TAGS, type Locale } from "@/i18n/config";
import { formatShortDate } from "@/i18n/format";

/** Local calendar day as "yyyy-mm-dd". */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 754 → "12:34"; 3725 → "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

const DURATION_UNITS: Record<Locale, { s: string; min: string; h: string }> = {
  en: { s: "s", min: "min", h: "h" },
  de: { s: "Sek.", min: "Min.", h: "Std." },
};

/** 754 → "12 min 34 s" / "12 Min. 34 Sek."; 45 → "45 s" / "45 Sek." */
export function formatDuration(totalSeconds: number, locale: Locale = "en"): string {
  const u = DURATION_UNITS[locale];
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} ${u.s}`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m} ${u.min} ${rest} ${u.s}` : `${m} ${u.min}`;
  const h = Math.floor(m / 60);
  return `${h} ${u.h} ${m % 60} ${u.min}`;
}

/** Whole calendar days from `ms` to `now` (0 = same day, 1 = yesterday, negative = in the future). */
export function daysBetween(ms: number, now = Date.now()): number {
  return Math.round((new Date(dayKey(now)).getTime() - new Date(dayKey(ms)).getTime()) / 86_400_000);
}

/** "today" / "yesterday" / "3 days ago" / "3 Oct" – or "heute" / "gestern" / "vor 3 Tagen" / "3. Okt." */
export function relativeDay(ms: number, now = Date.now(), locale: Locale = "en"): string {
  const diff = daysBetween(ms, now);
  if (diff >= 0 && diff < 7) return new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" }).format(-diff, "day");
  return formatShortDate(ms, locale);
}

/** Consecutive active days ending today (or yesterday, so the streak isn't lost before you study). */
export function currentStreak(activeDays: Set<string>, now = Date.now()): number {
  let streak = 0;
  let cursor = now;
  if (!activeDays.has(dayKey(cursor))) cursor -= 86_400_000;
  while (activeDays.has(dayKey(cursor))) {
    streak++;
    cursor -= 86_400_000;
  }
  return streak;
}
