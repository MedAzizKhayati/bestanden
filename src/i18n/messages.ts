import type { Locale } from "./config";
import { de } from "./messages/de";
import { en, type Messages } from "./messages/en";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { de, en };

/** The UI dictionary for one locale. Usable anywhere (server, client, route handlers). */
export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
