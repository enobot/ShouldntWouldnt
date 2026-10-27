import { en } from "./i18n/en.js";

/** The product name is the same in every language. */
export const PRODUCT_NAME = "Shouldn't Wouldn't";

// English versions of the popup's privacy words. Every language is in src/shared/i18n/.
export const TAGLINE = en.tagline;

export const PRIVACY_TITLE = en.privacyTitle;

/** Sentences are separated by newlines. The words are the store-facing promise. */
export const PRIVACY_BODY = en.privacyBody.join("\n");

export const PRIVACY_LIMIT = en.privacyLimit;

export const PRIVACY_PARAGRAPHS = en.privacyBody;
