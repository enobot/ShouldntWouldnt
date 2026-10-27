import type { ConcernKind } from "./types.js";

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adaptBias(delta: number, points: number, first: boolean): number {
  let next = first ? Math.floor(delta / DAMP) : delta >> 1;
  next += Math.floor(next / points);
  let k = 0;
  while (next > ((BASE - TMIN) * TMAX) >> 1) {
    next = Math.floor(next / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * next) / (next + SKEW));
}

function digitValue(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 22;
  if (code >= 97 && code <= 122) return code - 97;
  if (code >= 65 && code <= 90) return code - 65;
  return BASE;
}

/** Punycode label decoder. Compared with Node in the tests. */
export function unicodeHostname(hostname: string): string {
  return hostname
    .split(".")
    .map((label) => {
      const lower = label.toLowerCase();
      if (!lower.startsWith("xn--")) return lower;
      return decodePunycode(lower.slice(4));
    })
    .join(".");
}

function decodePunycode(input: string): string {
  const output: number[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  const basicEnd = input.lastIndexOf("-");
  const basic = basicEnd < 0 ? 0 : basicEnd;
  for (let j = 0; j < basic; j += 1) output.push(input.charCodeAt(j));
  let index = basic > 0 ? basic + 1 : 0;
  while (index < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) return input;
      const value = digitValue(input.charAt(index));
      index += 1;
      if (value >= BASE) return input;
      i += value * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (value < t) break;
      w *= BASE - t;
    }
    const length = output.length + 1;
    bias = adaptBias(i - oldi, length, oldi === 0);
    n += Math.floor(i / length);
    i %= length;
    output.splice(i, 0, n);
    i += 1;
  }
  return String.fromCodePoint(...output);
}

const BRANDS = [
  "paypal",
  "google",
  "apple",
  "microsoft",
  "amazon",
  "chase",
  "wellsfargo",
  "bankofamerica",
  "irs",
  "ssa",
];

const SUSPICIOUS = new Set(["login", "secure", "account", "verify", "update", "signin", "password", "wallet", "support"]);

const CONFUSABLES: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ї: "i",
  ѕ: "s",
  α: "a",
  ο: "o",
  ρ: "p",
  τ: "t",
  ν: "v",
};

function fold(label: string): string {
  let out = "";
  for (const char of label.toLowerCase()) out += CONFUSABLES[char] ?? char;
  return out;
}

function scriptsIn(label: string): Set<string> {
  const found = new Set<string>();
  for (const char of label) {
    if (/[a-z]/i.test(char)) found.add("latin");
    else if (/[\u0400-\u04ff]/.test(char)) found.add("cyrillic");
    else if (/[\u0370-\u03ff]/.test(char)) found.add("greek");
  }
  return found;
}

function isLookalikeHostname(hostname: string): boolean {
  const unicode = unicodeHostname(hostname).replace(/\.$/, "");
  const labels = unicode.split(".").filter(Boolean);
  if (labels.length === 0) return false;
  const joined = labels.join(".");
  if (BRANDS.some((brand) => joined === brand || joined === `${brand}.com`)) return false;

  for (const label of labels) {
    const scripts = scriptsIn(label);
    if (scripts.has("latin") && (scripts.has("cyrillic") || scripts.has("greek"))) return true;
    const folded = fold(label);
    if (BRANDS.includes(folded) && folded !== label) return true;
    const parts = label.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const foldedParts = parts.map(fold);
      const hasBrand = foldedParts.some((part) => BRANDS.includes(part));
      const hasSuspicious = foldedParts.some((part) => SUSPICIOUS.has(part));
      if (hasBrand && hasSuspicious) return true;
    }
  }

  for (const brand of BRANDS) {
    for (const suffix of [".com.", ".net.", ".org.", ".gov."]) {
      const needle = `${brand}${suffix}`;
      const at = joined.indexOf(needle);
      if (at < 0 || joined.endsWith(`${brand}${suffix.slice(0, -1)}`)) continue;
      // brand.com.au, brand.com.br and similar are country sites, not lookalikes.
      if (/^[a-z]{2}$/.test(joined.slice(at + needle.length))) continue;
      return true;
    }
  }
  return false;
}

export function resolvesToHttp(action: string | null, pageUrl: string): boolean {
  if (action === null) return false;
  try {
    return new URL(action, pageUrl).protocol === "http:";
  } catch {
    return false;
  }
}

export function collectConcerns(input: {
  pageUrl: string;
  hostname: string;
  sensitiveFormActions: Array<string | null>;
}): ConcernKind[] {
  const concerns: ConcernKind[] = [];
  let pageIsHttp = false;
  try {
    pageIsHttp = new URL(input.pageUrl).protocol === "http:";
  } catch {
    pageIsHttp = false;
  }
  if (pageIsHttp) concerns.push("http-page");
  if (input.sensitiveFormActions.some((action) => resolvesToHttp(action, input.pageUrl))) concerns.push("http-form");
  if (isLookalikeHostname(input.hostname)) concerns.push("lookalike");
  return concerns;
}
