import { PRODUCT_NAME } from "../shared/disclaimer.js";
import { stringsFor } from "../shared/i18n/index.js";
import { LANGUAGES, languageInfo, resolveLanguage, type LanguageChoice } from "../shared/i18n/strings.js";
import { parseLanguageState } from "../shared/messages.js";

// Opened once, right after install: the person picks a language before anything else.
const DONE_ID = "welcome-done";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function sendRuntime(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      void chrome.runtime.lastError;
      resolve(response ?? null);
    });
  });
}

function browserLanguage(): string {
  return chrome.i18n?.getUILanguage() ?? navigator.language;
}

/** Shows the page in the chosen (or browser) language; after a choice, confirms it and moves focus to the confirmation. */
function render(choice: LanguageChoice, chosen: boolean): void {
  const root = document.querySelector("#app");
  if (!root) return;
  const code = resolveLanguage(choice, browserLanguage());
  const s = stringsFor(code);
  const info = languageInfo(code);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
  root.replaceChildren();

  const tagline = el("p", s.tagline);
  tagline.className = "tagline";
  root.append(el("h1", PRODUCT_NAME), tagline);

  const heading = el("h2", s.welcomeChoose);
  heading.id = "choose";
  root.append(heading);
  const list = el("ul");
  list.className = "languages";
  list.setAttribute("aria-labelledby", "choose");
  for (const language of LANGUAGES) {
    const item = el("li");
    const button = el("button", language.nativeName);
    button.type = "button";
    button.lang = language.code;
    button.dir = language.dir;
    button.setAttribute("aria-pressed", chosen && choice === language.code ? "true" : "false");
    button.addEventListener("click", () => {
      void sendRuntime({ type: "sw/setLanguage", language: language.code }).then(() => render(language.code, true));
    });
    item.append(button);
    list.append(item);
  }
  root.append(list);

  if (!chosen) return;
  const done = el("section");
  done.id = DONE_ID;
  done.className = "done";
  done.tabIndex = -1;
  done.setAttribute("role", "status");
  done.append(el("p", s.welcomeDone), el("p", s.welcomeIntro), el("p", s.welcomeClose));
  root.append(done);
  done.focus();
}

async function start(): Promise<void> {
  const state = parseLanguageState(await sendRuntime({ type: "sw/getLanguage" }));
  const choice = state ? state.language : "auto";
  render(choice, choice !== "auto");
}

void start();
