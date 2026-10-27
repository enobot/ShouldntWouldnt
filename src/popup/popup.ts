import { PRODUCT_NAME } from "../shared/disclaimer.js";
import { stringsFor } from "../shared/i18n/index.js";
import { LANGUAGES, languageInfo, resolveLanguage, type LanguageChoice, type UiStrings } from "../shared/i18n/strings.js";
import { parseEnabledState, parseLanguageState, parsePageSummary, type PageSummary } from "../shared/messages.js";

const TOGGLE_ID = "protection-toggle";
const LANGUAGE_ID = "language-button";
const LANGUAGE_LIST_ID = "language-list";
let saving = false;
let languageOpen = false;
let focusAfterRender: string | null = null;

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

/** Asks only the tab's top frame. Every frame runs the content script, and an ad frame must not answer for the page. */
function sendTopFrame(tabId: number, message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, { frameId: 0 }, (response) => {
      void chrome.runtime.lastError;
      resolve(response ?? null);
    });
  });
}

function activeTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      void chrome.runtime.lastError;
      const id = tabs?.[0]?.id;
      resolve(typeof id === "number" ? id : null);
    });
  });
}

function line(label: string, text: string): HTMLParagraphElement {
  const p = el("p");
  const name = el("span", `${label}: `);
  name.className = "k";
  p.append(name, document.createTextNode(text));
  return p;
}

function countText(count: number | null): string {
  return count === null ? "—" : String(count);
}

function toggleButton(enabled: boolean, s: UiStrings): HTMLButtonElement {
  const toggle = el("button");
  toggle.type = "button";
  toggle.id = TOGGLE_ID;
  toggle.className = "switch";
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  const label = el("span", s.protection);
  const state = el("span", enabled ? s.on : s.off);
  state.className = "state";
  state.setAttribute("aria-hidden", "true");
  toggle.append(label, state);
  toggle.addEventListener("click", () => {
    // Ignore repeat clicks until this save finishes. The button is not disabled, so keyboard focus stays on it.
    if (saving) return;
    saving = true;
    toggle.setAttribute("aria-busy", "true");
    void sendRuntime({ type: "sw/setEnabled", enabled: !enabled })
      .then(() => refresh())
      .finally(() => {
        saving = false;
      });
  });
  return toggle;
}

function chooseLanguage(next: LanguageChoice): void {
  languageOpen = false;
  focusAfterRender = LANGUAGE_ID;
  void sendRuntime({ type: "sw/setLanguage", language: next }).then(() => refresh());
}

/**
 * "Language: Español" opens a list of buttons, one per language, each written in its own language so
 * people can find theirs. Buttons rather than a drop-down: the extension never reads a form control's value.
 */
function languagePicker(choice: LanguageChoice, s: UiStrings): HTMLDivElement {
  const wrap = el("div");
  wrap.className = "language";
  const current = choice === "auto" ? s.languageAuto : languageInfo(choice).nativeName;
  const toggle = el("button", `${s.language}: ${current}`);
  toggle.type = "button";
  toggle.id = LANGUAGE_ID;
  toggle.setAttribute("aria-expanded", languageOpen ? "true" : "false");
  toggle.setAttribute("aria-controls", LANGUAGE_LIST_ID);
  toggle.addEventListener("click", () => {
    languageOpen = !languageOpen;
    focusAfterRender = LANGUAGE_ID;
    void refresh();
  });
  const list = el("ul");
  list.id = LANGUAGE_LIST_ID;
  list.className = "languages";
  list.hidden = !languageOpen;
  const options: Array<{ choice: LanguageChoice; label: string; lang?: string; dir?: string }> = [
    { choice: "auto", label: s.languageAuto },
    ...LANGUAGES.map((language) => ({ choice: language.code, label: language.nativeName, lang: language.code, dir: language.dir })),
  ];
  for (const option of options) {
    const item = el("li");
    const button = el("button", option.label);
    button.type = "button";
    if (option.lang) button.lang = option.lang;
    if (option.dir) button.dir = option.dir;
    button.setAttribute("aria-pressed", option.choice === choice ? "true" : "false");
    button.addEventListener("click", () => chooseLanguage(option.choice));
    item.append(button);
    list.append(item);
  }
  wrap.append(toggle, list);
  return wrap;
}

function render(enabled: boolean, choice: LanguageChoice, summary: PageSummary | null): void {
  const root = document.querySelector("#app");
  if (!root) return;
  const code = resolveLanguage(choice, chrome.i18n?.getUILanguage() ?? navigator.language);
  const s = stringsFor(code);
  const info = languageInfo(code);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
  const focused = document.activeElement?.id;
  root.replaceChildren();

  root.append(el("h1", PRODUCT_NAME), el("p", s.tagline));
  root.append(languagePicker(choice, s));

  const toggle = toggleButton(enabled, s);
  root.append(toggle);
  root.append(el("p", s.offExplained));

  const status = el("p");
  status.className = "status";
  status.setAttribute("role", "status");
  status.textContent = s.status[summary?.status ?? "unable"];
  root.append(status);
  root.append(el("p", s.notAVerdict));
  if (summary?.reminderHidden) {
    const warning = el("p", s.hiddenReminderLine);
    warning.className = "alert";
    root.append(warning);
  }
  root.append(line(s.site, summary?.hostname || "—"));
  root.append(line(s.connection, summary ? summary.scheme : "—"));
  root.append(line(s.sensitiveFields, countText(summary?.sensitiveCount ?? null)));
  root.append(line(s.securityConcerns, countText(summary?.concernCount ?? null)));
  if (!enabled) root.append(el("p", s.offNotScanned));

  root.append(el("h2", s.privacyTitle));
  for (const paragraph of s.privacyBody) root.append(el("p", paragraph));
  root.append(el("p", s.privacyLimit));
  // Keep keyboard focus where it was across the re-render.
  const refocus = focusAfterRender ?? focused;
  focusAfterRender = null;
  if (refocus === TOGGLE_ID) toggle.focus();
  if (refocus === LANGUAGE_ID) document.getElementById(LANGUAGE_ID)?.focus();
}

async function refresh(): Promise<void> {
  const enabledState = parseEnabledState(await sendRuntime({ type: "sw/getEnabled" }));
  const enabled = enabledState ? enabledState.enabled : true;
  const languageState = parseLanguageState(await sendRuntime({ type: "sw/getLanguage" }));
  const tabId = await activeTabId();
  let summary: PageSummary | null = null;
  if (tabId !== null) {
    summary = parsePageSummary(await sendTopFrame(tabId, { type: "page/getSummary" }));
  }
  render(enabled, languageState ? languageState.language : "auto", summary);
}

void refresh();
