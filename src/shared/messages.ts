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

export interface GetSummaryMessage {
  type: "page/getSummary";
}

export type IncomingMessage = GetEnabledMessage | SetEnabledMessage | EnabledChangedMessage | GetSummaryMessage;

export interface EnabledState {
  ok: true;
  type: "sw/enabledState";
  enabled: boolean;
}

export interface PageSummary {
  ok: true;
  protection: boolean;
  hostname: string;
  scheme: "http" | "https" | "other";
  sensitiveCount: number | null;
  concernCount: number | null;
  status: "no_obvious_risks" | "caution" | "strong_concern" | "unable";
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
  if (type === "sw/getEnabled" || type === "page/getSummary") {
    if (Object.keys(record).length !== 1) return null;
    return { type };
  }
  if (type === "sw/setEnabled" || type === "sw/enabledChanged") {
    if (Object.keys(record).length !== 2 || typeof record.enabled !== "boolean") return null;
    return { type, enabled: record.enabled };
  }
  return null;
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
  const allowed = ["ok", "protection", "hostname", "scheme", "sensitiveCount", "concernCount", "status"];
  if (Object.keys(record).some((key) => !allowed.includes(key))) return null;
  return {
    ok: true,
    protection: record.protection,
    hostname: record.hostname,
    scheme: record.scheme,
    sensitiveCount: record.sensitiveCount,
    concernCount: record.concernCount,
    status: record.status,
  };
}

function isCount(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10_000;
}

export function isExtensionPageSender(senderUrl: string | undefined, extensionBaseUrl: string): boolean {
  return typeof senderUrl === "string" && senderUrl.startsWith(extensionBaseUrl);
}
