# Translations

Since version 0.2.0, a person can choose the language of the extension's own words: the notes beside
fields, "Why am I seeing this?", the buttons, the site warning, the toolbar tooltip, the popup, and the
welcome page. The website being visited is never translated or changed.

**Status: every translation below is a machine-drafted (AI-assisted) first version. None has been
reviewed by a native speaker yet.** These are safety reminders, so each language should be checked by a
native speaker before it is published in the Chrome Web Store.

| Language | Code | File | Reviewed by a native speaker |
| --- | --- | --- | --- |
| English | `en` | [src/shared/i18n/en.ts](src/shared/i18n/en.ts) | Source text |
| Español (Spanish) | `es` | [src/shared/i18n/es.ts](src/shared/i18n/es.ts) | No |
| 简体中文 (Chinese, Simplified) | `zh-CN` | [src/shared/i18n/zh-CN.ts](src/shared/i18n/zh-CN.ts) | No |
| 繁體中文 (Chinese, Traditional) | `zh-TW` | [src/shared/i18n/zh-TW.ts](src/shared/i18n/zh-TW.ts) | No |
| Tiếng Việt (Vietnamese) | `vi` | [src/shared/i18n/vi.ts](src/shared/i18n/vi.ts) | No |
| Tagalog (Filipino) | `tl` | [src/shared/i18n/tl.ts](src/shared/i18n/tl.ts) | No |
| 한국어 (Korean) | `ko` | [src/shared/i18n/ko.ts](src/shared/i18n/ko.ts) | No |
| العربية (Arabic, right to left) | `ar` | [src/shared/i18n/ar.ts](src/shared/i18n/ar.ts) | No |
| Français (French) | `fr` | [src/shared/i18n/fr.ts](src/shared/i18n/fr.ts) | No |
| Русский (Russian) | `ru` | [src/shared/i18n/ru.ts](src/shared/i18n/ru.ts) | No |
| Português (Portuguese) | `pt` | [src/shared/i18n/pt.ts](src/shared/i18n/pt.ts) | No |
| Kreyòl ayisyen (Haitian Creole) | `ht` | [src/shared/i18n/ht.ts](src/shared/i18n/ht.ts) | No |

## How a language is chosen

- Right after install, a welcome page asks for a language first. It can be changed at any time from the
  "Language" button in the popup.
- The choice is saved as the `language` setting in `chrome.storage.local` (a code above, or `auto`). With
  no choice, or `auto`, the extension follows the browser's language setting, read on the device, and
  falls back to English.
- Notes carry `lang` and `dir`, so screen readers pronounce them in the right language and Arabic is laid
  out right to left.

## Recognizing forms written in other languages

Separately from the words it shows, the extension recognizes field labels written in these languages
(for example "Número de Seguro Social" or "银行卡号"), so a person on a non-English site still gets a
reminder, in the language they chose. The label phrases are in the `FOREIGN` table in
[src/shared/detect.ts](src/shared/detect.ts). They were drafted the same way as the translations and have
not been reviewed either. The test cases for them (42, in [tests/accuracy-cases.ts](tests/accuracy-cases.ts))
were written with those phrases, so passing them shows the rules do what was intended, not how well they
work on real sites.

## Reviewing a language

Each file has the same keys as `en.ts`; `npm test` fails if a key is missing or empty, or if a reminder is
left in English. When reviewing:

1. Keep the meaning and the calm tone of the English. A note is a reminder, never an alarm.
2. Never say a site is safe, verified, legitimate, or a scam. Keep "appears to be asking": the extension
   reads labels, not intent.
3. Keep "Shouldn't Wouldn't" in Latin letters; it is the product name.
4. Keep each sentence whole. Explanations are built by joining whole sentences, never by inserting words
   into a sentence.
5. Use the form of address that is polite and plain for older adults (for example, `usted` in Spanish,
   `quý vị` in Vietnamese).
6. Check the label phrases for your language in `detect.ts`: common labels that are missing, and phrases
   that would match ordinary fields by mistake.
7. Change "No" to the reviewer's name or initials and the date in the table above.

## Adding to the Chrome Web Store listing

The store description in [store/listing-detailed.md](store/listing-detailed.md) describes 0.1.3, the next
upload. When 0.2.0 or later is uploaded, add this paragraph to the description:

> Choose your language. Right after you install it, Shouldn't Wouldn't asks which language to use for its
> reminders: English, Español, 简体中文, 繁體中文, Tiếng Việt, Tagalog, 한국어, العربية, Français, Русский,
> Português, or Kreyòl ayisyen. You can change it at any time from the toolbar button. The website you
> visit is not translated. Forms written in those languages are recognized too.
