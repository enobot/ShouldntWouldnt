import { isLanguageChoice, type LanguageChoice } from "./i18n/strings.js";

export interface GetEnabledMessage {
  type: "sw/getEnabled";
}

export interface SetEnabledMessage {
  type: "sw/setEnabled";
  enabled: boolean;
}

export interface EnabledChangedMessage {
  type: "sw/enabledChanged";
  enabled: boolean;
}

export interface GetLanguageMessage {
  type: "sw/getLanguage";
}

/** From the popup or the welcome page: show the notes in this language ("auto" follows the browser). */
export interface SetLanguageMessage {
  type: "sw/setLanguage";
  language: LanguageChoice;
}

export interface GetSummaryMessage {
  type: "page/getSummary";
}

/** From a content script: this page removed or covered a reminder, or the page that did so has gone. */
export interface ReminderHiddenMessage {
  type: "page/reminderHidden" | "page/left";
}

export type IncomingMessage =
  | GetEnabledMessage
  | SetEnabledMessage
  | GetLanguageMessage
  | SetLanguageMessage
  | EnabledChangedMessage
  | GetSummaryMessage
  | ReminderHiddenMessage;

export interface EnabledState {
  ok: true;
  type: "sw/enabledState";
  enabled: boolean;
}

export interface LanguageState {
  ok: true;
  type: "sw/languageState";
  language: LanguageChoice;
}

export interface PageSummary {
  ok: true;
  protection: boolean;
  hostname: string;
  scheme: "http" | "https" | "other";
  sensitiveCount: number | null;
  concernCount: number | null;
  status: "no_obvious_risks" | "caution" | "strong_concern" | "unable";
  reminderHidden: boolean;
}

const FORBIDDEN_KEYS = new Set([
  "value",
  "formData",
  "password",
  "key" + "strokes",
  "href",
  "url",
  "html",
  "cookie",
  "cookies",
  "history",
]);

function plainObject(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  if (Object.getPrototypeOf(value) !== Object.prototype) return null;
  return value as Record<string, unknown>;
}

function hasForbiddenKey(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => FORBIDDEN_KEYS.has(key));
}

export function parseIncoming(message: unknown): IncomingMessage | null {
  const record = plainObject(message);
  if (!record || hasForbiddenKey(record)) return null;
  const type = record.type;
  if (type === "sw/getEnabled" || type === "sw/getLanguage" || type === "page/getSummary" || type === "page/reminderHidden" || type === "page/left") {
    if (Object.keys(record).length !== 1) return null;
    return { type };
  }
  if (type === "sw/setEnabled" || type === "sw/enabledChanged") {
    if (Object.keys(record).length !== 2 || typeof record.enabled !== "boolean") return null;
    return { type, enabled: record.enabled };
  }
  if (type === "sw/setLanguage") {
    if (Object.keys(record).length !== 2 || !isLanguageChoice(record.language)) return null;
    return { type, language: record.language };
  }
  return null;
}

export function parseLanguageState(message: unknown): LanguageState | null {
  const record = plainObject(message);
  if (!record || hasForbiddenKey(record)) return null;
  if (record.ok !== true || record.type !== "sw/languageState" || !isLanguageChoice(record.language)) return null;
  if (Object.keys(record).length !== 3) return null;
  return { ok: true, type: "sw/languageState", language: record.language };
}

export function parseEnabledState(message: unknown): EnabledState | null {
  const record = plainObject(message);
  if (!record || hasForbiddenKey(record)) return null;
  if (record.ok !== true || record.type !== "sw/enabledState" || typeof record.enabled !== "boolean") return null;
  if (Object.keys(record).length !== 3) return null;
  return { ok: true, type: "sw/enabledState", enabled: record.enabled };
}

export function parsePageSummary(message: unknown): PageSummary | null {
  const record = plainObject(message);
  if (!record || hasForbiddenKey(record)) return null;
  if (record.ok !== true || typeof record.protection !== "boolean") return null;
  if (typeof record.hostname !== "string" || record.hostname.length > 253) return null;
  if (record.scheme !== "http" && record.scheme !== "https" && record.scheme !== "other") return null;
  if (!isCount(record.sensitiveCount) || !isCount(record.concernCount)) return null;
  if (
    record.status !== "no_obvious_risks" &&
    record.status !== "caution" &&
    record.status !== "strong_concern" &&
    record.status !== "unable"
  ) {
    return null;
  }
  if (typeof record.reminderHidden !== "boolean") return null;
  const allowed = ["ok", "protection", "hostname", "scheme", "sensitiveCount", "concernCount", "status", "reminderHidden"];
  if (Object.keys(record).some((key) => !allowed.includes(key))) return null;
  return {
    ok: true,
    protection: record.protection,
    hostname: record.hostname,
    scheme: record.scheme,
    sensitiveCount: record.sensitiveCount,
    concernCount: record.concernCount,
    status: record.status,
    reminderHidden: record.reminderHidden,
  };
}

function isCount(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10_000;
}

/** True when the sender is exactly the given extension page, ignoring a query string or fragment. */
export function isExtensionPageSender(senderUrl: string | undefined, pageUrl: string): boolean {
  if (typeof senderUrl !== "string") return false;
  const bare = senderUrl.split(/[?#]/)[0];
  return bare === pageUrl;
}

/** A content script in an ordinary web page tab, the only place a reminder can be hidden. */
export function isWebPageSender(senderUrl: string | undefined, tabId: number | undefined): boolean {
  if (typeof tabId !== "number" || tabId < 0 || typeof senderUrl !== "string") return false;
  return senderUrl.startsWith("http://") || senderUrl.startsWith("https://") || senderUrl.startsWith("about:");
}
