/**
 * Spells out numbers the way a German speaker says them („um 18 Uhr 30“ → „um achtzehn Uhr dreißig“).
 * Neural voices that read whole sentences garble or skip digits, so scripts/audio/render.ts sends them
 * this form. The content keeps its digits; file keys are computed from the original text.
 */

const ONES = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

/** "ein" inside compounds (einundzwanzig, einhundert), "eins" on its own. */
const unit = (n: number, inCompound: boolean) => (n === 1 && inCompound ? "ein" : ONES[n]);

export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1_000_000) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) {
    const u = n % 10;
    return u ? `${unit(u, true)}und${TENS[Math.floor(n / 10)]}` : TENS[n / 10];
  }
  if (n < 1000) {
    const rest = n % 100;
    return `${unit(Math.floor(n / 100), true)}hundert${rest ? numberWords(rest) : ""}`;
  }
  const rest = n % 1000;
  const thousands = Math.floor(n / 1000);
  return `${thousands === 1 ? "ein" : numberWords(thousands)}tausend${rest ? numberWords(rest) : ""}`;
}

/** 1990 → neunzehnhundertneunzig; other years read like numbers. */
function yearWords(n: number): string {
  if (n >= 1100 && n < 2000) {
    const rest = n % 100;
    return `${numberWords(Math.floor(n / 100))}hundert${rest ? numberWords(rest) : ""}`;
  }
  return numberWords(n);
}

function ordinalStem(n: number): string {
  const special: Record<number, string> = { 1: "erst", 3: "dritt", 7: "siebt", 8: "acht" };
  if (special[n]) return special[n];
  const words = numberWords(n);
  return n < 20 ? `${words}t` : `${words}st`;
}

const MONTHS = "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";

export function spokenNumbers(text: string): string {
  let s = text;
  // 1.250 → 1250 (thousands separator), but not times like 9.30 Uhr.
  s = s.replace(/\b(\d{1,3})\.(\d{3})\b(?!\s*Uhr)/g, "$1$2");
  // 12,50 Euro → zwölf Euro fünfzig · 0,99 Euro → neunundneunzig Cent
  s = s.replace(/\b(\d+),(\d{2})\s*(Euro|€)/g, (_, e: string, c: string) =>
    Number(e) === 0 ? `${numberWords(Number(c))} Cent` : `${Number(e) === 1 ? "ein" : numberWords(Number(e))} Euro ${numberWords(Number(c))}`,
  );
  // 1,5 → eins Komma fünf
  s = s.replace(/\b(\d+),(\d+)\b/g, (_, a: string, b: string) => `${numberWords(Number(a))} Komma ${[...b].map((d) => ONES[Number(d)]).join(" ")}`);
  // 18:30 / 18.30 Uhr → achtzehn Uhr dreißig
  s = s.replace(/\b(\d{1,2})[:.](\d{2})(\s*Uhr)?/g, (_, h: string, m: string) => `${Number(h) === 1 ? "ein" : numberWords(Number(h))} Uhr${Number(m) ? ` ${numberWords(Number(m))}` : ""}`);
  // Phone numbers and codes said digit by digit: 0 6 9 – 4 4 2 1 7
  s = s.replace(/\b\d(?:[  ]+\d\b){2,}/g, (m) => m.split(/\s+/).map((d) => ONES[Number(d)]).join(" "));
  // 9–17 Uhr → neun bis siebzehn Uhr
  s = s.replace(/\b(\d+)\s*[–-]\s*(\d+)\b/g, "$1 bis $2");
  // Ordinals: am 14. Dezember → am vierzehnten Dezember · der 3. Stock → der dritte Stock
  s = s.replace(new RegExp(`(\\b\\p{L}+\\s+)?\\b(\\d{1,2})\\.(?=\\s+(?:${MONTHS}|\\p{Ll}|\\p{Lu}\\p{Ll}))`, "gu"), (_, before: string | undefined, n: string) => {
    const nominative = before && /^(der|die|das|jeder|jede|jedes)\s+$/i.test(before);
    return `${before ?? ""}${ordinalStem(Number(n))}${nominative ? "e" : "en"}`;
  });
  s = s.replace(/\s*%/g, " Prozent");
  // Remaining whole numbers. "1 Uhr"/"1 Euro" → ein.
  s = s.replace(/\b\d+\b/g, (m, offset: number, all: string) => {
    const n = Number(m);
    const after = all.slice(offset + m.length);
    if (n === 1 && /^\s+(Uhr|Euro)\b/.test(after)) return "ein";
    const yearContext = /(Jahr|Jahre|seit|bis|ab|von|vor|nach|im|anno)\s+$/i.test(all.slice(0, offset));
    return m.length === 4 && yearContext ? yearWords(n) : numberWords(n);
  });
  return s.replace(/[  ]{2,}/g, " ");
}
