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
  if (/\bssn\b|\bsoc sec\b/.test(text)) return true;
  if (!/\bsocial security\b/.test(text)) return false;
  return !/\b(benefit|benefits|office|administration|income|disability|retirement|payment|payments|check|checks)\b/.test(text);
}

const NOT_PAYMENT_CARD =
  /\b(library|loyalty|membership|member|rewards?|student|identity|id|medicare|medicaid|insurance|health|sim|business|greeting|playing|discount|club|access|report|key)\s+card\b/;

function isCard(text: string): boolean {
  if (NOT_PAYMENT_CARD.test(text)) return false;
  if (/\bcc number\b|\bcard number\b|\b(credit|debit) card number\b|\b(cc|card)(num|number|no)\b|\bprimary account number\b/.test(text)) {
    return true;
  }
  if (text === "pan" || /\bpan (number|no)\b/.test(text)) return true;
  const words = text.split(" ").filter(Boolean);
  if (words.length > 4) return false;
  if (/\b(name|holder|type|brand|expir|month|year|message|note)\b/.test(text)) return false;
  return /\b(credit|debit) card\b/.test(text);
}

function isCvv(text: string): boolean {
  if (/\bcc csc\b|\bcvv2?\b|\bcvc2?\b|\bcsc\b|\bsecurity code\b|\bcard verification\b/.test(text)) return true;
  return text === "cid";
}

/** Sign-in and verification codes. They are not card security codes, and they are not phone numbers. */
function isOneTimeCode(text: string): boolean {
  if (/\bone time (code|password|passcode|pin)\b|\botp\b|\b2fa\b|\btwo (factor|step)\b|\bauthenticator\b|\bverification code\b/.test(text)) {
    return true;
  }
  return /\b(security|confirmation|login|sign in|access) code\b/.test(text) && /\b(sent|text|texted|sms|emailed|app)\b/.test(text);
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
    /\b(taxpayer|tax) (identification|id)\b/.test(text) ||
    /\bitin\b/.test(text) ||
    text === "tin" ||
    /\bnational insurance\b/.test(text) ||
    /\bsocial insurance\b/.test(text) ||
    /\bstate (issued )?id (number|card)\b|\bstate identification\b|\bstate issued id\b/.test(text)
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
  return /\b(password|passwd|pwd|passcode|passphrase)\b/.test(text);
}

function isAddress(text: string): boolean {
  if (/\b(email|e mail|ip|mac|web|website|url|wallet|bitcoin|ethereum|crypto|server|network|hardware|memory)\b/.test(text)) {
    return false;
  }
  if (/\baddress level\d\b/.test(text)) return false;
  if (/\bpostal code\b|\bzip code\b|\bpostcode\b/.test(text)) return true;
  return /\baddress\b/.test(text) || text === "street";
}

function isPhone(text: string): boolean {
  if (/\b(model|type|brand|make|case|carrier|screen|charger|os)\b/.test(text)) return false;
  return /\b(phone|mobile|telephone|cell)( number)?\b/.test(text);
}

function isEmail(text: string): boolean {
  return /\bemail\b/.test(text) || /\be mail\b/.test(text);
}

function isDob(text: string): boolean {
  return /\bdate of birth\b|\bbirth ?date\b|\bbirthday\b|\bdob\b|\bbirth (year|month|day)\b|\b(year|month|day) of birth\b/.test(text);
}

function isHealth(text: string): boolean {
  if (/\bmedical (school|college|degree|center|centre|device|devices|supplies|supply|field|specialty|specialties|equipment|license)\b/.test(text)) {
    return false;
  }
  if (/\b(diagnosis|diagnoses|prescriptions?|medications?|medical|medicare|medicaid)\b/.test(text)) return true;
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

function scanText(source: Source, raw: string, into: Map<WarnCategory, Candidate>): void {
  // Normalize once per source; the category rules all read the same text.
  const text = normalizeText(raw);
  if (!text) return;
  for (const category of PRIORITY) {
    if (matches(category, text)) push(into, { category, confidence: WEIGHT[source], source });
  }
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

function isOneTimeCodeField(snapshot: FieldSnapshot): boolean {
  if (autocompleteTokens(snapshot.autocomplete).includes("one-time-code")) return true;
  return [snapshot.name, snapshot.id, snapshot.ariaLabel, snapshot.labelText, snapshot.placeholder].some((raw) =>
    isOneTimeCode(normalizeText(raw)),
  );
}

/**
 * A specific identity or payment label beats the field type. Sites hide an SSN in a password box,
 * and use type="tel" on card, account, and SSN fields to get a number keypad on phones.
 */
function specificOverType(found: Map<WarnCategory, Candidate>, typed: WarnCategory): Candidate | undefined {
  let best: Candidate | undefined;
  for (const candidate of found.values()) {
    if (candidate.category === typed || !HIGH.has(candidate.category)) continue;
    if (candidate.source === "placeholder" || candidate.source === "nearby") continue;
    best = best ? better(best, candidate) : candidate;
  }
  return best;
}

export function classifyField(snapshot: FieldSnapshot): Detection {
  // A search box is never the place a site asks for these details, whatever its hint text says.
  if (snapshot.type === "search") return NONE;
  if (isOneTimeCodeField(snapshot)) return NONE;

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

  if (snapshot.type === "password") best = specificOverType(found, "password") ?? best;
  if (snapshot.type === "tel") best = specificOverType(found, "phone") ?? best;
  if (snapshot.type === "url" && best.source === "nearby") return NONE;
  // A drop-down list cannot hold a typed number, so the high-sensitivity number warnings do not apply to it.
  if (snapshot.tag === "select" && HIGH.has(best.category)) return NONE;

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
