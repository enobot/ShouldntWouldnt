import { ar } from "./ar.js";
import { en } from "./en.js";
import { es } from "./es.js";
import { fr } from "./fr.js";
import { ht } from "./ht.js";
import { ko } from "./ko.js";
import { pt } from "./pt.js";
import { ru } from "./ru.js";
import type { LanguageCode, UiStrings } from "./strings.js";
import { tl } from "./tl.js";
import { vi } from "./vi.js";
import { zhCN } from "./zh-CN.js";
import { zhTW } from "./zh-TW.js";

// Each language is a function, so a page builds only the language it shows; English is always ready.
const LOADERS: Record<LanguageCode, () => UiStrings> = {
  en: () => en,
  es,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  vi,
  tl,
  ko,
  ar,
  fr,
  ru,
  pt,
  ht,
};

const built = new Map<LanguageCode, UiStrings>();

export function stringsFor(code: LanguageCode): UiStrings {
  let strings = built.get(code);
  if (!strings) {
    strings = (LOADERS[code] ?? LOADERS.en)();
    built.set(code, strings);
  }
  return strings;
}
