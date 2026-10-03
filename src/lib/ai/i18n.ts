import "server-only";

import type { Locale } from "@/i18n/config";

/** Server-side texts of the AI features (kept out of the client bundle). */
const TEXTS = {
  en: {
    notConfigured: "AI feedback is not set up on this server. Add your own API key in the settings to use it.",
    partnerNotConfigured: "The AI partner is not set up on this server. Add your own API key in the settings to use it.",
    writingLimit: "You have reached the hourly limit for AI corrections. Please try again later.",
    speakingLimit: "Hourly limit for speaking feedback reached. Please try again later.",
    partnerLimit: "Hourly limit for the AI partner reached. Please try again later.",
    invalidRequest: "Invalid request.",
    writeMore: "Write at least a few sentences first.",
    speakMore: "Say a few complete sentences first – there is not enough to assess yet.",
    unknownTask: "Unknown task.",
    invalidKey: "The AI service is not configured correctly (invalid API key).",
    busy: "The AI examiner is busy right now. Please try again in a minute.",
    badRequest: "The request could not be processed. Please shorten your text and retry.",
    connection: "Could not reach the AI service. Check your connection.",
    serviceError: (status: string) => `AI service error (${status}). Please retry.`,
    unexpected: "Unexpected error while generating feedback.",
    refusedWriting: "The AI examiner could not assess this text. Please check its content and retry.",
    refusedSpeaking: "The AI examiner could not assess this conversation.",
    cutOff: "The examiner's answer was cut off. Please retry.",
    unreadable: "The AI examiner returned an unreadable result. Please retry.",
    missingKey: "Add your API key in the settings, or switch back to the server's AI.",
    missingModel: "Choose a model in the settings.",
    invalidBaseUrl: "The server address (base URL) in your AI settings is not a valid http(s) URL.",
    localBaseUrl: "This server does not allow AI endpoints in a private network. Use a public URL.",
    unknownModel: "The AI provider does not know this model. Check the model name in the settings.",
  },
  de: {
    notConfigured: "Das KI-Feedback ist auf diesem Server nicht eingerichtet. Trag in den Einstellungen deinen eigenen API-Schlüssel ein, um es zu nutzen.",
    partnerNotConfigured: "Der KI-Gesprächspartner ist auf diesem Server nicht eingerichtet. Trag in den Einstellungen deinen eigenen API-Schlüssel ein, um ihn zu nutzen.",
    writingLimit: "Du hast das Limit für KI-Korrekturen in dieser Stunde erreicht. Bitte versuche es später noch einmal.",
    speakingLimit: "Das Limit für Feedback zum Sprechen in dieser Stunde ist erreicht. Bitte versuche es später noch einmal.",
    partnerLimit: "Das Limit für den KI-Gesprächspartner in dieser Stunde ist erreicht. Bitte versuche es später noch einmal.",
    invalidRequest: "Ungültige Anfrage.",
    writeMore: "Schreib zuerst ein paar Sätze.",
    speakMore: "Sag zuerst ein paar ganze Sätze – noch gibt es zu wenig zum Bewerten.",
    unknownTask: "Unbekannte Aufgabe.",
    invalidKey: "Der KI-Dienst ist nicht richtig eingerichtet (ungültiger API-Schlüssel).",
    busy: "Der KI-Prüfer ist gerade ausgelastet. Bitte versuche es in einer Minute noch einmal.",
    badRequest: "Die Anfrage konnte nicht verarbeitet werden. Bitte kürze deinen Text und versuche es noch einmal.",
    connection: "Der KI-Dienst ist nicht erreichbar. Bitte prüfe deine Internetverbindung.",
    serviceError: (status: string) => `Fehler beim KI-Dienst (${status}). Bitte versuche es noch einmal.`,
    unexpected: "Beim Erstellen des Feedbacks ist ein unerwarteter Fehler passiert.",
    refusedWriting: "Der KI-Prüfer konnte diesen Text nicht bewerten. Bitte prüfe den Inhalt und versuche es noch einmal.",
    refusedSpeaking: "Der KI-Prüfer konnte dieses Gespräch nicht bewerten.",
    cutOff: "Die Antwort des Prüfers wurde abgeschnitten. Bitte versuche es noch einmal.",
    unreadable: "Der KI-Prüfer hat ein unlesbares Ergebnis geliefert. Bitte versuche es noch einmal.",
    missingKey: "Trag deinen API-Schlüssel in den Einstellungen ein oder wechsle zurück zur KI des Servers.",
    missingModel: "Wähle in den Einstellungen ein Modell aus.",
    invalidBaseUrl: "Die Serveradresse (Base URL) in deinen KI-Einstellungen ist keine gültige http(s)-Adresse.",
    localBaseUrl: "Dieser Server erlaubt keine KI-Adressen in einem privaten Netzwerk. Bitte nutze eine öffentliche Adresse.",
    unknownModel: "Der KI-Anbieter kennt dieses Modell nicht. Prüfe den Modellnamen in den Einstellungen.",
  },
} satisfies Record<Locale, Record<string, string | ((status: string) => string)>>;

export function aiText(locale: Locale) {
  return TEXTS[locale];
}

/** Instruction appended to the examiner prompts: the language of all explanatory feedback. */
export function feedbackLanguage(locale: Locale): string {
  return locale === "de"
    ? `Feedback language: GERMAN. The learner uses the German interface. Write every comment, summary, explanation, strength and tip in clear, simple German at B1 level: short sentences, everyday words, standard German grammar terms (Akkusativ, Nebensatz, Verb am Ende, Konnektor …). Address the learner with "du". Use German quotation marks „…“.`
    : `Feedback language: ENGLISH. Write every comment, summary, explanation, strength and tip in clear, simple English for a B1 learner. Address the learner directly as "you".`;
}
