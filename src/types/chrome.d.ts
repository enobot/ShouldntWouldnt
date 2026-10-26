// Minimal surface for the extension APIs this project calls.
// Kept local so the only development dependency is TypeScript.

interface ChromeLastError {
  message?: string;
}

interface ChromeMessageSender {
  id?: string;
  url?: string;
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
    callback: (tabs: Array<{ id?: number }>) => void,
  ): void;
  sendMessage(
    tabId: number,
    message: unknown,
    responseCallback?: (response: unknown) => void,
  ): void;
}

interface ChromeDom {
  openOrClosedShadowRoot(element: HTMLElement): ShadowRoot | null;
}

interface ChromeStorageChange {
  newValue?: unknown;
  oldValue?: unknown;
}

interface ChromeStorageArea {
  get(key: string, callback: (items: Record<string, unknown>) => void): void;
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
  storage: ChromeStorage;
  dom?: ChromeDom;
}

declare const chrome: ChromeNamespace;
