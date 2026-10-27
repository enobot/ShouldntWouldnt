// Minimal surface for the extension APIs this project calls.
// Kept local so the only development dependency is TypeScript.

interface ChromeLastError {
  message?: string;
}

interface ChromeMessageSender {
  id?: string;
  url?: string;
  frameId?: number;
  tab?: { id?: number };
}

interface ChromePort {
  name: string;
  sender?: ChromeMessageSender;
  disconnect(): void;
  onDisconnect: {
    addListener(callback: () => void): void;
  };
}

interface ChromeRuntime {
  id: string;
  lastError?: ChromeLastError;
  getURL(path: string): string;
  sendMessage(message: unknown, responseCallback?: (response: unknown) => void): void;
  connect(connectInfo: { name: string }): ChromePort;
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: ChromeMessageSender,
        sendResponse: (response: unknown) => void,
      ) => boolean | void,
    ): void;
  };
}

interface ChromeTabs {
  query(
    queryInfo: { active?: boolean; currentWindow?: boolean },
    callback: (tabs: Array<{ id?: number }> | undefined) => void,
  ): void;
  sendMessage(tabId: number, message: unknown, responseCallback?: (response: unknown) => void): void;
  sendMessage(
    tabId: number,
    message: unknown,
    options: { frameId?: number },
    responseCallback?: (response: unknown) => void,
  ): void;
}

interface ChromeAction {
  setBadgeText(details: { tabId?: number; text: string }, callback?: () => void): void;
  setBadgeBackgroundColor(details: { tabId?: number; color: string }, callback?: () => void): void;
  setTitle(details: { tabId?: number; title: string }, callback?: () => void): void;
}

interface ChromeDom {
  openOrClosedShadowRoot(element: HTMLElement): ShadowRoot | null;
}

interface ChromeStorageChange {
  newValue?: unknown;
  oldValue?: unknown;
}

interface ChromeStorageArea {
  get(key: string, callback: (items: Record<string, unknown> | undefined) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
}

interface ChromeStorage {
  local: ChromeStorageArea;
  onChanged: {
    addListener(callback: (changes: Record<string, ChromeStorageChange>, areaName: string) => void): void;
  };
}

interface ChromeNamespace {
  runtime: ChromeRuntime;
  tabs: ChromeTabs;
  action: ChromeAction;
  storage: ChromeStorage;
  dom?: ChromeDom;
}

declare const chrome: ChromeNamespace;
