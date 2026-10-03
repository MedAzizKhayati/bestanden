import { LOCALE_TAGS, type Locale } from "./config";

/** "3 Oct" / "3. Okt." */
export function formatShortDate(value: number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "short" });
}

/** "3 October 2026" / "3. Oktober 2026" */
export function formatLongDate(value: number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "long", year: "numeric" });
}

/** "Saturday, 3 October" / "Samstag, 3. Oktober" */
export function formatWeekdayDate(value: number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(LOCALE_TAGS[locale], { weekday: "long", day: "numeric", month: "long" });
}

/** 2.5 → "2.5" / "2,5" */
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value);
}
