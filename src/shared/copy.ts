import { en } from "./i18n/en.js";
import type { UiStrings } from "./i18n/strings.js";
import type { ConcernKind, WarnCategory } from "./types.js";

// The words themselves live in src/shared/i18n/, one file per language; English is i18n/en.ts.
// These English names stay exported for code and tests that only need English.
export const FIELD_COPY = en.field;
export const HTTP_HEADLINE = en.httpHeadline;
export const HTTP_DETAIL = en.httpDetail;
export const FORM_LINE = en.formLine;
export const LOOKALIKE_LINE = en.lookalikeLine;
export const MASK_LINE = en.maskLine;
export const SHOW_LABEL = en.show;
export const HIDE_LABEL = en.hide;
export const SHOW_NAME = en.showName;
export const HIDE_NAME = en.hideName;
export const HIDDEN_REMINDER_LINE = en.hiddenReminderLine;

export function fieldCopy(category: WarnCategory, s: UiStrings = en): string {
  return s.field[category];
}

/** Short text read by screen readers when the field gets focus. */
export function fieldDescription(category: WarnCategory, concerns: ConcernKind[], s: UiStrings = en): string {
  return [s.field[category], ...concernLines(concerns, s)].join(s.sentenceJoiner);
}

export function concernLines(concerns: ConcernKind[], s: UiStrings = en): string[] {
  const lines: string[] = [];
  if (concerns.includes("http-page")) lines.push(s.httpHeadline);
  if (concerns.includes("http-form")) lines.push(s.formLine);
  if (concerns.includes("lookalike")) lines.push(s.lookalikeLine);
  return lines;
}

export function whyText(category: WarnCategory, concerns: ConcernKind[], masked = false, s: UiStrings = en): string {
  const parts = [s.sawSigns[category], s.because[category], s.weDoNotRead];
  if (masked) parts.push(s.maskLine);
  if (concerns.length === 0) {
    parts.push(s.noOtherSigns);
  } else {
    parts.push(...concernLines(concerns, s));
    if (concerns.includes("http-page")) parts.push(s.httpDetail);
  }
  parts.push(s.trustOrLeave);
  return parts.join(s.sentenceJoiner);
}

export function moreInformation(concerns: ConcernKind[], s: UiStrings = en): string {
  const parts = [s.moreAbout, s.cannotPromise, ...concernLines(concerns, s)];
  if (concerns.includes("http-page")) parts.push(s.httpDetail);
  parts.push(s.goBackExplained);
  return parts.join(s.sentenceJoiner);
}
