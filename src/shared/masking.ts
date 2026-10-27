import type { WarnCategory } from "./types.js";

/**
 * Kinds of number that are visually masked while a person types them.
 * Masking uses the CSS property -webkit-text-security, so the field's type, value, autofill,
 * validation, and form submission stay exactly as the website built them. The extension never
 * reads the value to do this. Passwords are left alone because password boxes already hide.
 */
const MASKED_CATEGORIES = new Set<WarnCategory>([
  "ssn",
  "card",
  "bank",
  "routing",
  "government-id",
  "passport",
  "drivers-license",
]);

/** Single-line text controls where the CSS mask is supported and predictable. */
const MASKABLE_TYPES = new Set(["text", "tel", "number"]);

export function shouldMask(category: WarnCategory, tag: string, type: string): boolean {
  if (tag.toLowerCase() !== "input") return false;
  return MASKED_CATEGORIES.has(category) && MASKABLE_TYPES.has(type.toLowerCase());
}
