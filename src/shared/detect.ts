import type { Category, Detection, FieldSnapshot, Tier, WarnCategory } from "./types.js";

export const HIGH_CONFIDENCE_MIN = 0.7;
export const CONTEXT_CONFIDENCE_MIN = 0.74;

const WEIGHT = {
  autocomplete: 0.97,
  type: 0.96,
  name: 0.86,
  id: 0.84,
  aria: 0.8,
  label: 0.8,
  placeholder: 0.74,
  nearby: 0.45,
} as const;

type Source = keyof typeof WEIGHT;

const HIGH = new Set<WarnCategory>([
  "ssn",
  "card",
  "cvv",
  "bank",
  "routing",
  "government-id",
  "passport",
  "drivers-license",
  "password",
]);

const PRIORITY: WarnCategory[] = [
  "password",
  "ssn",
  "card",
  "cvv",
  "bank",
  "routing",
  "passport",
  "drivers-license",
  "government-id",
  "health",
  "dob",
  "address",
  "phone",
  "email",
];

const AUTO: Record<string, WarnCategory> = {
  "current-password": "password",
  "new-password": "password",
  "cc-number": "card",
  "cc-csc": "cvv",
  email: "email",
  tel: "phone",
  "street-address": "address",
  "address-line1": "address",
  "address-line2": "address",
  "address-line3": "address",
  "postal-code": "address",
  bday: "dob",
  "bday-day": "dob",
  "bday-month": "dob",
  "bday-year": "dob",
};

interface Candidate {
  category: WarnCategory;
  confidence: number;
  source: Source;
}

const NONE: Detection = { tier: "none", category: "none", confidence: 0, warn: false };

export function normalizeText(raw: string): string {
  return raw
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function autocompleteTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && token !== "on" && token !== "off" && !token.startsWith("section-"));
}

function tierOf(category: WarnCategory): Tier {
  return HIGH.has(category) ? "high" : "context";
}

function isSsn(text: string): boolean {
  return /\bssn\b/.test(text) || /\bsocial security\b/.test(text);
}

function isCard(text: string): boolean {
  if (/\bcc number\b|\bcard number\b|\bpan\b|\b(credit|debit) card number\b/.test(text)) return true;
  const words = text.split(" ").filter(Boolean);
  if (words.length > 4) return false;
  if (/\b(name|holder|type|brand|expir|month|year)\b/.test(text)) return false;
  return /\b(credit|debit) card\b/.test(text);
}

function isCvv(text: string): boolean {
  if (/\bcc csc\b|\bcvv2?\b|\bcvc2?\b|\bsecurity code\b|\bcard verification\b/.test(text)) return true;
  return text === "cid" || text === "cvc" || text === "cvv";
}

function isBank(text: string): boolean {
  if (/\biban\b/.test(text)) return true;
  if (/\b(bank|checking|savings)\b/.test(text) && /\b(account|acct)\b/.test(text)) return true;
  return /\baccount number\b/.test(text) || /\bacct number\b/.test(text);
}

function isRouting(text: string): boolean {
  if (/\brouting number\b/.test(text)) return true;
  if (/\baba routing\b/.test(text) || /\baba number\b/.test(text)) return true;
  return text === "rtn" || text === "aba";
}

function isGovernmentId(text: string): boolean {
  return (
    /\bgovernment id\b/.test(text) ||
    /\bnational id\b/.test(text) ||
    /\btax id\b/.test(text) ||
    /\bitin\b/.test(text) ||
    text === "tin" ||
    /\bnational insurance\b/.test(text)
  );
}

function isPassport(text: string): boolean {
  if (!/\bpassport\b/.test(text)) return false;
  const words = text.split(" ").filter(Boolean).length;
  if (words <= 5) return true;
  return /\bpassport number\b/.test(text);
}

function isLicense(text: string): boolean {
  if (/\b(license key|product license|software license|license code)\b/.test(text)) return false;
  return (
    /\bdriver s license\b/.test(text) ||
    /\bdrivers license\b/.test(text) ||
    /\bdriver license\b/.test(text) ||
    /\bdriving licen[cs]e\b/.test(text)
  );
}

function isPassword(text: string): boolean {
  if (/\b(hint|reminder)\b/.test(text)) return false;
  return /\b(password|passwd|pwd)\b/.test(text);
}

function isAddress(text: string): boolean {
  if (/\b(email|ip|mac|web) address\b/.test(text)) return false;
  if (/\bstreet address\b|\bmailing address\b|\bpostal code\b|\bzip code\b|\bpostcode\b|\baddress line\b/.test(text)) {
    return true;
  }
  return text === "address" || text === "street";
}

function isPhone(text: string): boolean {
  return /\b(phone|mobile|telephone|cell)( number)?\b/.test(text);
}

function isEmail(text: string): boolean {
  return /\bemail\b/.test(text) || /\be mail\b/.test(text);
}

function isDob(text: string): boolean {
  return /\bdate of birth\b|\bbirth date\b|\bbirthday\b|\bdob\b/.test(text);
}

function isHealth(text: string): boolean {
  if (/\b(diagnosis|prescription|medication|medical)\b/.test(text)) return true;
  if (/\bpatient (id|number|record)\b/.test(text)) return true;
  return /\bhealth (plan|record|information|insurance|history)\b/.test(text);
}

function matches(category: WarnCategory, text: string): boolean {
  switch (category) {
    case "ssn":
      return isSsn(text);
    case "card":
      return isCard(text);
    case "cvv":
      return isCvv(text);
    case "bank":
      return isBank(text);
    case "routing":
      return isRouting(text);
    case "government-id":
      return isGovernmentId(text);
    case "passport":
      return isPassport(text);
    case "drivers-license":
      return isLicense(text);
    case "password":
      return isPassword(text);
    case "address":
      return isAddress(text);
    case "phone":
      return isPhone(text);
    case "email":
      return isEmail(text);
    case "dob":
      return isDob(text);
    case "health":
      return isHealth(text);
    default:
      return false;
  }
}

function push(into: Map<WarnCategory, Candidate>, candidate: Candidate): void {
  const current = into.get(candidate.category);
  if (!current || candidate.confidence > current.confidence) into.set(candidate.category, candidate);
}

function fromText(category: WarnCategory, source: Source, raw: string, into: Map<WarnCategory, Candidate>): void {
  const text = normalizeText(raw);
  if (!text || !matches(category, text)) return;
  push(into, { category, confidence: WEIGHT[source], source });
}

function scanText(source: Source, raw: string, into: Map<WarnCategory, Candidate>): void {
  for (const category of PRIORITY) fromText(category, source, raw, into);
}

function scanAutocomplete(raw: string, into: Map<WarnCategory, Candidate>): void {
  for (const token of autocompleteTokens(raw)) {
    const mapped = AUTO[token] ?? (token.startsWith("tel-") ? "phone" : undefined);
    if (mapped) push(into, { category: mapped, confidence: WEIGHT.autocomplete, source: "autocomplete" });
  }
  scanText("autocomplete", raw, into);
}

function better(left: Candidate, right: Candidate): Candidate {
  if (left.confidence !== right.confidence) return left.confidence > right.confidence ? left : right;
  return PRIORITY.indexOf(left.category) <= PRIORITY.indexOf(right.category) ? left : right;
}

export function classifyField(snapshot: FieldSnapshot): Detection {
  const found = new Map<WarnCategory, Candidate>();
  if (snapshot.type === "password") {
    push(found, { category: "password", confidence: WEIGHT.type, source: "type" });
  } else if (snapshot.type === "email") {
    push(found, { category: "email", confidence: WEIGHT.type, source: "type" });
  } else if (snapshot.type === "tel") {
    push(found, { category: "phone", confidence: WEIGHT.type, source: "type" });
  }

  scanAutocomplete(snapshot.autocomplete, found);
  scanText("name", snapshot.name, found);
  scanText("id", snapshot.id, found);
  scanText("aria", snapshot.ariaLabel, found);
  scanText("label", snapshot.labelText, found);
  scanText("placeholder", snapshot.placeholder, found);
  scanText("nearby", snapshot.nearbyText, found);

  let best: Candidate | undefined;
  for (const candidate of found.values()) best = best ? better(best, candidate) : candidate;
  if (!best) return NONE;

  if ((snapshot.type === "search" || snapshot.type === "url") && best.source === "nearby") return NONE;

  const tier = tierOf(best.category);
  const minimum = tier === "high" ? HIGH_CONFIDENCE_MIN : CONTEXT_CONFIDENCE_MIN;
  const confidence = Math.round(best.confidence * 100) / 100;
  const warn = confidence >= minimum;
  return {
    tier: warn ? tier : "none",
    category: warn ? best.category : "none",
    confidence,
    warn,
  };
}

export function isHighCategory(category: Category): boolean {
  return category !== "none" && HIGH.has(category);
}
