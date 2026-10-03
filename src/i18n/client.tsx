"use client";

import { createContext, use, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getMessages, type Messages } from "./messages";

const I18nContext = createContext<{ locale: Locale; t: Messages }>({ locale: DEFAULT_LOCALE, t: getMessages(DEFAULT_LOCALE) });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={{ locale, t: getMessages(locale) }}>{children}</I18nContext>;
}

/** Current UI locale ("de" | "en"). */
export function useLocale(): Locale {
  return use(I18nContext).locale;
}

/** UI dictionary: `const t = useT(); t.common.submit`. */
export function useT(): Messages {
  return use(I18nContext).t;
}
