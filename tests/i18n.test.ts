import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { whyText } from "../src/shared/copy.js";
import { en } from "../src/shared/i18n/en.js";
import { stringsFor } from "../src/shared/i18n/index.js";
import { isLanguageChoice, languageForBrowser, LANGUAGES, resolveLanguage, type UiStrings } from "../src/shared/i18n/strings.js";

const OTHERS = LANGUAGES.filter((language) => language.code !== "en");

/** Every string in a table, with its path, so a missing or empty one is named in the failure. */
function entries(strings: UiStrings): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const visit = (value: unknown, path: string): void => {
    if (typeof value === "string") out.push([path, value]);
    else if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}[${index}]`));
    else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) visit(item, path ? `${path}.${key}` : key);
  };
  visit(strings, "");
  return out;
}

describe("translations", () => {
  test("every language fills in every string English has", () => {
    const english = new Map(entries(en));
    for (const language of LANGUAGES) {
      const table = new Map(entries(stringsFor(language.code)));
      for (const path of english.keys()) {
        assert.equal(table.has(path), true, `${language.code} is missing ${path}`);
        if (path !== "sentenceJoiner") assert.equal(table.get(path)?.trim() !== "", true, `${language.code} has an empty ${path}`);
      }
      assert.equal(table.size, english.size, `${language.code} has strings English does not`);
    }
  });

  test("the reminders themselves are translated, not left in English", () => {
    for (const language of OTHERS) {
      const s = stringsFor(language.code);
      for (const category of Object.keys(en.field) as Array<keyof UiStrings["field"]>) {
        assert.equal(s.field[category] !== en.field[category], true, `${language.code} field.${category}`);
        assert.equal(s.because[category] !== en.because[category], true, `${language.code} because.${category}`);
        assert.equal(s.sawSigns[category] !== en.sawSigns[category], true, `${language.code} sawSigns.${category}`);
      }
      for (const key of ["weDoNotRead", "maskLine", "httpHeadline", "why", "dismiss", "privacyLimit"] as const) {
        assert.equal(s[key] !== en[key], true, `${language.code} ${key}`);
      }
    }
  });

  test("the product name is never translated", () => {
    for (const language of LANGUAGES) {
      const s = stringsFor(language.code);
      for (const key of ["noteName", "panelName", "toolbarHiddenTitle", "hiddenReminderLine", "moreAbout"] as const) {
        assert.match(s[key], /Shouldn't Wouldn't/, `${language.code} ${key}`);
      }
    }
  });

  test("Arabic is written right to left; the others left to right", () => {
    for (const language of LANGUAGES) assert.equal(language.dir, language.code === "ar" ? "rtl" : "ltr", language.code);
  });

  test("explanations are built from whole sentences of one language", () => {
    const spanish = whyText("ssn", [], true, stringsFor("es"));
    assert.match(spanish, /Seguro Social/);
    assert.match(spanish, /No leemos lo que usted escribe\./);
    assert.equal(spanish.includes("We do not read"), false);
    const chinese = whyText("card", ["http-page"], false, stringsFor("zh-CN"));
    assert.equal(chinese.includes("。 "), false, "Chinese sentences are joined without spaces");
    assert.match(chinese, /HTTPS/);
  });
});

describe("language choice", () => {
  test("browser languages map to a supported language, English otherwise", () => {
    const cases: Array<[string, string]> = [
      ["es-MX", "es"],
      ["es", "es"],
      ["zh-CN", "zh-CN"],
      ["zh", "zh-CN"],
      ["zh-TW", "zh-TW"],
      ["zh-HK", "zh-TW"],
      ["zh-Hant-TW", "zh-TW"],
      ["vi", "vi"],
      ["fil", "tl"],
      ["tl-PH", "tl"],
      ["ko-KR", "ko"],
      ["ar-EG", "ar"],
      ["fr-CA", "fr"],
      ["ru", "ru"],
      ["pt-BR", "pt"],
      ["ht", "ht"],
      ["de-DE", "en"],
      ["en-US", "en"],
      ["", "en"],
    ];
    for (const [tag, expected] of cases) assert.equal(languageForBrowser(tag), expected, tag);
  });

  test("a saved choice wins; a missing, unknown, or automatic choice follows the browser", () => {
    assert.equal(resolveLanguage("vi", "en-US"), "vi");
    assert.equal(resolveLanguage("auto", "ko-KR"), "ko");
    assert.equal(resolveLanguage(undefined, "es-419"), "es");
    assert.equal(resolveLanguage("klingon", "fr-FR"), "fr");
    assert.equal(resolveLanguage(true, "en-GB"), "en");
  });

  test("only known choices are accepted", () => {
    for (const language of LANGUAGES) assert.equal(isLanguageChoice(language.code), true);
    assert.equal(isLanguageChoice("auto"), true);
    for (const bad of ["", "EN", "es-MX", "zh", null, 1, {}]) assert.equal(isLanguageChoice(bad), false, String(bad));
  });
});
