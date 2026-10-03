import { locale as rootLocale } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { getMessages, type Messages } from "./messages";

/** Locale of the current request, from the `[locale]` root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** UI dictionary of the current request: `const t = await getT(); t.nav.grammar`. */
export async function getT(): Promise<Messages> {
  return getMessages(await getLocale());
}
