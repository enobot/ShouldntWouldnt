import { PRIVACY_LIMIT, PRIVACY_PARAGRAPHS, PRIVACY_TITLE, PRODUCT_NAME, TAGLINE } from "../shared/disclaimer.js";
import { parseEnabledState, parsePageSummary, type PageSummary } from "../shared/messages.js";
import { PAGE_STATUS_LABEL } from "../shared/types.js";

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

function sendTab(tabId: number, message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      void chrome.runtime.lastError;
      resolve(response ?? null);
    });
  });
}

function activeTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      void chrome.runtime.lastError;
      const id = tabs[0]?.id;
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

function render(enabled: boolean, summary: PageSummary | null): void {
  const root = document.querySelector("#app");
  if (!root) return;
  root.replaceChildren();

  root.append(el("h1", PRODUCT_NAME), el("p", TAGLINE));

  const toggle = el("button", enabled ? "Protection is on" : "Protection is off");
  toggle.type = "button";
  toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  toggle.addEventListener("click", () => {
    void sendRuntime({ type: "sw/setEnabled", enabled: !enabled }).then(() => refresh());
  });
  root.append(toggle);
  root.append(
    el(
      "p",
      "If you turn protection off, scanning stops until you turn it back on. That choice is saved in this browser profile. It stays off when you change pages, refresh, or close Chrome. It is not sent to us.",
    ),
  );

  const status = el("p");
  status.className = "status";
  status.setAttribute("aria-live", "polite");
  const summaryStatus = summary?.status ?? "unable";
  status.textContent = PAGE_STATUS_LABEL[summaryStatus];
  root.append(status);
  root.append(el("p", "This is not a verdict that the website is legitimate."));
  root.append(line("Site", summary?.hostname || "—"));
  root.append(line("Connection", summary ? summary.scheme : "—"));
  root.append(line("Sensitive fields", countText(summary?.sensitiveCount ?? null)));
  root.append(line("Security concerns", countText(summary?.concernCount ?? null)));
  if (!enabled) root.append(el("p", "Protection is off right now, so this page was not scanned."));

  root.append(el("h2", PRIVACY_TITLE));
  for (const paragraph of PRIVACY_PARAGRAPHS) root.append(el("p", paragraph));
  root.append(el("p", PRIVACY_LIMIT));
}

async function refresh(): Promise<void> {
  const enabledState = parseEnabledState(await sendRuntime({ type: "sw/getEnabled" }));
  const enabled = enabledState ? enabledState.enabled : true;
  const tabId = await activeTabId();
  let summary: PageSummary | null = null;
  if (tabId !== null) {
    summary = parsePageSummary(await sendTab(tabId, { type: "page/getSummary" }));
  }
  render(enabled, summary);
}

void refresh();
