import { PROTECTION_STORAGE_KEY, protectionFromStored } from "../shared/protection.js";
import { isExtensionPageSender, parseIncoming } from "../shared/messages.js";

function senderIsPopup(sender: ChromeMessageSender): boolean {
  return isExtensionPageSender(sender.url, chrome.runtime.getURL("")) && sender.tab?.id == null;
}

function broadcast(next: boolean): void {
  chrome.tabs.query({}, (tabs) => {
    void chrome.runtime.lastError;
    for (const tab of tabs) {
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
      resolve(protectionFromStored(items[PROTECTION_STORAGE_KEY]));
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
  sendResponse({ ok: false });
  return false;
});
