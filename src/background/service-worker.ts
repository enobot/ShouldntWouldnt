import { PROTECTION_STORAGE_KEY, protectionFromStored } from "../shared/protection.js";
import { isExtensionPageSender, isWebPageSender, parseIncoming } from "../shared/messages.js";

const DEFAULT_TITLE = "Shouldn't Wouldn't";
const HIDDEN_TITLE = "Shouldn't Wouldn't: this page removed or covered a reminder";

/** Only this extension's own popup page may change the setting, whether it is open as the popup or in a tab. */
function senderIsPopup(sender: ChromeMessageSender): boolean {
  return isExtensionPageSender(sender.url, chrome.runtime.getURL("popup.html"));
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

function readEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROTECTION_STORAGE_KEY, (items) => {
      void chrome.runtime.lastError;
      resolve(protectionFromStored(items?.[PROTECTION_STORAGE_KEY]));
    });
  });
}

function writeEnabled(next: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROTECTION_STORAGE_KEY]: next }, () => {
      resolve(!chrome.runtime.lastError);
    });
  });
}

/** Marks the toolbar button for one tab. The page cannot reach this, so it is a fallback when a note is hidden. */
function markTab(tabId: number, hidden: boolean): void {
  const done = (): void => {
    void chrome.runtime.lastError;
  };
  chrome.action.setBadgeText({ tabId, text: hidden ? "!" : "" }, done);
  if (hidden) chrome.action.setBadgeBackgroundColor({ tabId, color: "#9f1239" }, done);
  chrome.action.setTitle({ tabId, title: hidden ? HIDDEN_TITLE : DEFAULT_TITLE }, done);
}

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
    void readEnabled().then((enabled) => {
      sendResponse({ ok: true, type: "sw/enabledState", enabled });
    });
    return true;
  }
  if (parsed.type === "sw/setEnabled") {
    if (!senderIsPopup(sender)) {
      sendResponse({ ok: false });
      return false;
    }
    void writeEnabled(parsed.enabled).then((saved) => {
      if (!saved) {
        sendResponse({ ok: false });
        return;
      }
      broadcast(parsed.enabled);
      sendResponse({ ok: true, type: "sw/enabledState", enabled: parsed.enabled });
    });
    return true;
  }
  if (parsed.type === "page/reminderHidden" || parsed.type === "page/left") {
    const tabId = sender.tab?.id;
    if (!isWebPageSender(sender.url, tabId) || typeof tabId !== "number") {
      sendResponse({ ok: false });
      return false;
    }
    markTab(tabId, parsed.type === "page/reminderHidden");
    sendResponse({ ok: true });
    return false;
  }
  sendResponse({ ok: false });
  return false;
});
