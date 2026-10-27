import type { PageStatus, WarnCategory } from "../types.js";

/** Languages a person can choose for the extension's own words. The page itself is never translated. */
export type LanguageCode = "en" | "es" | "zh-CN" | "zh-TW" | "vi" | "tl" | "ko" | "ar" | "fr" | "ru" | "pt" | "ht";

/** The stored choice: a language, or "auto" to follow the browser's language. */
export type LanguageChoice = LanguageCode | "auto";

/** Local extension-storage key for the language choice. The stored value is "auto" or a language code. */
export const LANGUAGE_STORAGE_KEY = "language";

export interface LanguageInfo {
  code: LanguageCode;
  /** The language's name in that language, shown in the picker so people can find their own. */
  nativeName: string;
  englishName: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", nativeName: "English", englishName: "English", dir: "ltr" },
  { code: "es", nativeName: "Español", englishName: "Spanish", dir: "ltr" },
  { code: "zh-CN", nativeName: "简体中文", englishName: "Chinese (Simplified)", dir: "ltr" },
  { code: "zh-TW", nativeName: "繁體中文", englishName: "Chinese (Traditional)", dir: "ltr" },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", dir: "ltr" },
  { code: "tl", nativeName: "Tagalog", englishName: "Tagalog (Filipino)", dir: "ltr" },
  { code: "ko", nativeName: "한국어", englishName: "Korean", dir: "ltr" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", dir: "rtl" },
  { code: "fr", nativeName: "Français", englishName: "French", dir: "ltr" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", dir: "ltr" },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", dir: "ltr" },
  { code: "ht", nativeName: "Kreyòl ayisyen", englishName: "Haitian Creole", dir: "ltr" },
];

const CODES = new Set<string>(LANGUAGES.map((language) => language.code));

export function isLanguageChoice(value: unknown): value is LanguageChoice {
  return value === "auto" || (typeof value === "string" && CODES.has(value));
}

export function languageInfo(code: LanguageCode): LanguageInfo {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

/** Maps a browser language tag such as "es-MX" or "zh-Hant-TW" to a supported language, English otherwise. */
export function languageForBrowser(tag: string): LanguageCode {
  const lower = tag.toLowerCase();
  const base = lower.split(/[-_]/)[0];
  if (base === "zh") return /\b(tw|hk|mo|hant)\b/.test(lower.replace(/[-_]/g, " ")) ? "zh-TW" : "zh-CN";
  if (base === "fil" || base === "tl") return "tl";
  for (const code of ["es", "vi", "ko", "ar", "fr", "ru", "pt", "ht"] as const) {
    if (base === code) return code;
  }
  return "en";
}

/** The language to show: the stored choice, or the browser's language when the choice is missing or "auto". */
export function resolveLanguage(stored: unknown, browserTag: string): LanguageCode {
  if (isLanguageChoice(stored) && stored !== "auto") return stored;
  return languageForBrowser(browserTag);
}

/**
 * Every word the extension shows. Each language file fills in all of them. Whole sentences are kept
 * whole so translators never have to fit words into an English sentence pattern.
 */
export interface UiStrings {
  /** Put between sentences that are joined into one paragraph (a space, or nothing for Chinese). */
  sentenceJoiner: string;

  /** The note's first sentence for each kind of field. */
  field: Record<WarnCategory, string>;
  /** "Why am I seeing this?": the opening sentence for each kind of field. */
  sawSigns: Record<WarnCategory, string>;
  /** "Why am I seeing this?": why that kind of information matters. */
  because: Record<WarnCategory, string>;
  weDoNotRead: string;
  noOtherSigns: string;
  trustOrLeave: string;

  httpHeadline: string;
  httpDetail: string;
  formLine: string;
  lookalikeLine: string;
  maskLine: string;
  moreAbout: string;
  cannotPromise: string;
  goBackExplained: string;

  show: string;
  hide: string;
  showName: string;
  hideName: string;
  why: string;
  dismiss: string;
  dismissName: string;
  noteName: string;
  goBack: string;
  continueAnyway: string;
  moreInformation: string;
  panelName: string;

  hiddenReminderLine: string;
  toolbarHiddenTitle: string;

  tagline: string;
  protection: string;
  on: string;
  off: string;
  offExplained: string;
  notAVerdict: string;
  site: string;
  connection: string;
  sensitiveFields: string;
  securityConcerns: string;
  offNotScanned: string;
  status: Record<PageStatus, string>;
  privacyTitle: string;
  privacyBody: string[];
  privacyLimit: string;
  language: string;
  languageAuto: string;

  welcomeChoose: string;
  welcomeDone: string;
  welcomeIntro: string;
  welcomeClose: string;
}
