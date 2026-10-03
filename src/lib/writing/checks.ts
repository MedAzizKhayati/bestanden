import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { wordCount } from "@/lib/utils/text";

export type CheckStatus = "ok" | "warn" | "todo";

export interface LiveCheck {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
}

export const CONNECTORS = [
  "weil", "dass", "obwohl", "deshalb", "deswegen", "darum", "trotzdem", "außerdem", "denn", "wenn", "damit", "sondern",
  "aber", "dann", "danach", "zuerst", "zuletzt", "also", "leider", "als", "ob", "nachdem", "bevor", "sodass", "nämlich",
  "jedoch", "allerdings", "trotz", "wegen", "während", "sobald", "falls", "zum schluss", "zum beispiel", "einerseits",
  "andererseits", "sowohl", "weder", "entweder", "nicht nur", "erstens", "zweitens", "übrigens", "schließlich",
];

const SALUTATION = /^\s*(liebe|lieber|hallo|hi|sehr geehrte|sehr geehrter|guten tag)\b/i;
const CLOSING = /(viele|liebe|herzliche|beste|freundliche|schöne)\s+grüße|mit freundlichen grüßen|bis bald|alles liebe|bis dann|herzlichst|dein[e]?\s*\n|ihr[e]?\s*\n/i;

function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

export function usedConnectors(text: string): string[] {
  const lower = ` ${text.toLowerCase().replace(/[.,!?;:„“"()]/g, " ")} `;
  return CONNECTORS.filter((c) => lower.includes(` ${c} `));
}

/** Live checks shown while writing. Labels and advice are in the UI language `locale`. */
export function runLiveChecks(text: string, subject: string, register: "informal" | "semiformal", locale: Locale = DEFAULT_LOCALE): LiveCheck[] {
  const m = getMessages(locale).writing.checks;
  const words = wordCount(text);
  const body = sentences(text);
  // Skip salutation and closing lines when counting sentence starts.
  const core = body.filter((s) => !SALUTATION.test(s) && !/grüße|gruß/i.test(s));
  const ichStarts = core.filter((s) => /^(ich|wir)\b/i.test(s)).length;
  const ichShare = core.length ? ichStarts / core.length : 0;
  const connectors = usedConnectors(text);

  const duForms = text.match(/\b(du|dich|dir|dein|deine|deinen|deinem|deiner|euch|euer)\b/gi) ?? [];
  // Capitalised Sie/Ihnen/Ihr in the middle of a sentence = polite form.
  const sieForms = text.match(/(?<![.!?]\s|^|\n)\b(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem)\b/g) ?? [];

  const checks: LiveCheck[] = [
    {
      id: "subject",
      label: m.subject.label,
      detail: subject.trim() ? `„${subject.trim()}“` : m.subject.missing,
      status: subject.trim() ? "ok" : "todo",
    },
    {
      id: "salutation",
      label: m.salutation.label,
      detail: SALUTATION.test(text) ? m.salutation.ok : register === "informal" ? m.salutation.informal : m.salutation.semiformal,
      status: SALUTATION.test(text) ? "ok" : "todo",
    },
    {
      id: "register",
      label: register === "informal" ? m.register.informal : m.register.semiformal,
      detail:
        register === "informal"
          ? sieForms.length
            ? m.register.sieInInformal([...new Set(sieForms)].join(", "))
            : m.register.informalOk
          : duForms.length
            ? m.register.duInSemiformal([...new Set(duForms.map((d) => d.toLowerCase()))].join(", "))
            : m.register.semiformalOk,
      status: (register === "informal" ? sieForms.length : duForms.length) ? "warn" : words > 20 ? "ok" : "todo",
    },
    {
      id: "ich",
      label: m.starts.label,
      detail: core.length < 3 ? m.starts.tooFew : `${m.starts.count(ichStarts, core.length)}${ichShare > 0.4 ? m.starts.tip : ""}`,
      status: core.length < 3 ? "todo" : ichShare > 0.4 ? "warn" : "ok",
    },
    {
      id: "connectors",
      label: m.connectors.label,
      detail: connectors.length
        ? `${m.connectors.used(connectors.length, connectors.slice(0, 8).join(", "))}${connectors.length > 8 ? " …" : ""}${connectors.length < 5 ? m.connectors.aim : ""}`
        : m.connectors.none,
      status: connectors.length >= 5 ? "ok" : connectors.length >= 2 ? "warn" : "todo",
    },
    {
      id: "length",
      label: m.length.label,
      detail: m.length.detail(words),
      status: words >= 120 ? "ok" : words >= 70 ? "warn" : "todo",
    },
    {
      id: "closing",
      label: m.closing.label,
      detail: CLOSING.test(text) ? m.closing.ok : register === "informal" ? m.closing.informal : m.closing.semiformal,
      status: CLOSING.test(text) ? "ok" : "todo",
    },
  ];
  return checks;
}
