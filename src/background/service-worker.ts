import { stringsFor } from "../shared/i18n/index.js";
import { isLanguageChoice, LANGUAGE_STORAGE_KEY, resolveLanguage, type LanguageChoice } from "../shared/i18n/strings.js";
import { PROTECTION_STORAGE_KEY, protectionFromStored } from "../shared/protection.js";
import { isExtensionPageSender, isWebPageSender, parseIncoming } from "../shared/messages.js";

const DEFAULT_TITLE = "Shouldn't Wouldn't";

/** Only this extension's own pages may change a setting: the popup (as the popup or in a tab) and the welcome page. */
function senderIsSettingsPage(sender: ChromeMessageSender, pages: string[]): boolean {
  return pages.some((page) => isExtensionPageSender(sender.url, chrome.runtime.getURL(page)));
}

function broadcast(next: boolean): void {
  chrome.tabs.query({}, (tabs) => {
    void chrome.runtime.lastError;
    for (const tab of tabs ?? []) {
      if (typeof tab.id !== "number") continue;
      chrome.tabs.sendMessage(tab.id, { type: "sw/enabledChanged", enabled: next }, () => {
        void chrome.runtime.lastError;
      });
    }
  });
}

function readSetting(key: string): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (items) => {
      void chrome.runtime.lastError;
      resolve(items?.[key]);
    });
  });
}

/** The only place settings are written: the on/off boolean, or the language choice. */
function writeSetting(key: typeof PROTECTION_STORAGE_KEY | typeof LANGUAGE_STORAGE_KEY, value: boolean | LanguageChoice): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve(!chrome.runtime.lastError);
    });
  });
}

async function readLanguage(): Promise<LanguageChoice> {
  const stored = await readSetting(LANGUAGE_STORAGE_KEY);
  return isLanguageChoice(stored) ? stored : "auto";
}

/** Marks the toolbar button for one tab. The page cannot reach this, so it is a fallback when a note is hidden. */
async function markTab(tabId: number, hidden: boolean): Promise<void> {
  const done = (): void => {
    void chrome.runtime.lastError;
  };
  chrome.action.setBadgeText({ tabId, text: hidden ? "!" : "" }, done);
  if (hidden) chrome.action.setBadgeBackgroundColor({ tabId, color: "#9f1239" }, done);
  const strings = stringsFor(resolveLanguage(await readLanguage(), chrome.i18n?.getUILanguage() ?? "en"));
  chrome.action.setTitle({ tabId, title: hidden ? strings.toolbarHiddenTitle : DEFAULT_TITLE }, done);
}

// Right after install, ask for a language first.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;
  chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") }, () => {
    void chrome.runtime.lastError;
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false });
    return false;
  }
  const parsed = parseIncoming(message);
  if (!parsed) {
    sendResponse({ ok: false });
    return false;
  }
  if (parsed.type === "sw/getEnabled") {
    void readSetting(PROTECTION_STORAGE_KEY).then((stored) => {
      sendResponse({ ok: true, type: "sw/enabledState", enabled: protectionFromStored(stored) });
    });
    return true;
  }
  if (parsed.type === "sw/setEnabled") {
    if (!senderIsSettingsPage(sender, ["popup.html"])) {
      sendResponse({ ok: false });
      return false;
    }
    void writeSetting(PROTECTION_STORAGE_KEY, parsed.enabled).then((saved) => {
      if (!saved) {
        sendResponse({ ok: false });
        return;
      }
      broadcast(parsed.enabled);
      sendResponse({ ok: true, type: "sw/enabledState", enabled: parsed.enabled });
    });
    return true;
  }
  if (parsed.type === "sw/getLanguage") {
    void readLanguage().then((language) => {
      sendResponse({ ok: true, type: "sw/languageState", language });
    });
    return true;
  }
  if (parsed.type === "sw/setLanguage") {
    if (!senderIsSettingsPage(sender, ["popup.html", "welcome.html"])) {
      sendResponse({ ok: false });
      return false;
    }
    // Open pages pick the change up from storage, so nothing is broadcast.
    void writeSetting(LANGUAGE_STORAGE_KEY, parsed.language).then((saved) => {
      sendResponse(saved ? { ok: true, type: "sw/languageState", language: parsed.language } : { ok: false });
    });
    return true;
  }
  if (parsed.type === "page/reminderHidden" || parsed.type === "page/left") {
    const tabId = sender.tab?.id;
    if (!isWebPageSender(sender.url, tabId) || typeof tabId !== "number") {
      sendResponse({ ok: false });
      return false;
    }
    void markTab(tabId, parsed.type === "page/reminderHidden");
    sendResponse({ ok: true });
    return false;
  }
  sendResponse({ ok: false });
  return false;
});
