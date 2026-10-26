import { concernLines, fieldCopy, moreInformation, whyText } from "../shared/copy.js";
import { responseToWarning, shouldOfferStrongWarning, shouldPauseSubmit } from "../shared/decisions.js";
import { classifyField } from "../shared/detect.js";
import { FieldBook } from "../shared/ledger.js";
import { parseEnabledState, parseIncoming } from "../shared/messages.js";
import { PROTECTION_STORAGE_KEY, protectionFromStored } from "../shared/protection.js";
import { consumeRepair, freshRepairBudget, type RepairBudget } from "../shared/reminder-guard.js";
import { collectConcerns } from "../shared/signals.js";
import { statusFor } from "../shared/status.js";
import type { PageSummary } from "../shared/messages.js";
import type { ConcernKind, WarnCategory } from "../shared/types.js";
import { extractField, isFieldElement } from "./metadata.js";
import { hostMutationIsOurs, mountPanel, mountWarning, paintHost, type WarningNodes } from "./warning-view.js";

const MARK = "data-shouldnt-wouldnt";
const MARK_SHADOW = "inset 0 0 0 1px #9f1239, 0 0 0 1px #9f1239";
const OBSERVE: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: [
    "type",
    "name",
    "id",
    "placeholder",
    "autocomplete",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "for",
    "action",
  ],
};

interface FieldView extends WarningNodes {
  host: HTMLElement;
  repairs: RepairBudget;
  watcher: MutationObserver | null;
}

interface SavedShadow {
  shadow: string;
  priority: string;
}

const book = new FieldBook<HTMLElement>();
const views = new Map<HTMLElement, FieldView>();
const savedShadows = new WeakMap<HTMLElement, SavedShadow | null>();
const ours = new WeakSet<Node>();
const selfMoved = new WeakSet<Node>();
const watchedShadows = new WeakSet<ShadowRoot>();
const shadowObservers: MutationObserver[] = [];
const styleRepairFields = new Set<HTMLElement>();

let running = false;
let acknowledged = false;
let focusShown = false;
let pausedForm: HTMLFormElement | null = null;
let panelHost: HTMLElement | null = null;
let panelLines: HTMLDivElement | null = null;
let panelMore: HTMLParagraphElement | null = null;
let panelRepairs: RepairBudget = freshRepairBudget();
let panelWatcher: MutationObserver | null = null;
let panelStyleQueued = false;
let queued: MutationRecord[] = [];
let flushTimer = 0;
let rootObserver: MutationObserver | null = null;
let booted = false;

function send(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      void chrome.runtime.lastError;
      resolve(response);
    });
  });
}

function schemeOf(protocol: string): "http" | "https" | "other" {
  if (protocol === "http:") return "http";
  if (protocol === "https:") return "https";
  return "other";
}

function concernsNow(): ConcernKind[] {
  const actions: Array<string | null> = [];
  const seen = new Set<HTMLFormElement>();
  for (const field of book.activeItems()) {
    if (!field.isConnected || !isFieldElement(field)) continue;
    const form = field.form;
    if (!form || seen.has(form)) continue;
    seen.add(form);
    actions.push(form.getAttribute("action"));
  }
  return collectConcerns({
    pageUrl: location.href,
    hostname: location.hostname,
    sensitiveFormActions: actions,
  });
}

function buildSummary(): PageSummary {
  const protection = running;
  if (!protection) {
    return {
      ok: true,
      protection: false,
      hostname: location.hostname,
      scheme: schemeOf(location.protocol),
      sensitiveCount: null,
      concernCount: null,
      status: "unable",
    };
  }
  const sensitiveCount = book.activeItems().filter((field) => field.isConnected).length;
  const concernCount = concernsNow().length;
  return {
    ok: true,
    protection: true,
    hostname: location.hostname,
    scheme: schemeOf(location.protocol),
    sensitiveCount,
    concernCount,
    status: statusFor({
      protectionOn: true,
      scannable: true,
      sensitiveCount,
      concernCount,
    }),
  };
}

function markField(field: HTMLElement): void {
  if (!savedShadows.has(field)) {
    const shadow = field.style.getPropertyValue("box-shadow");
    const priority = field.style.getPropertyPriority("box-shadow");
    savedShadows.set(field, shadow ? { shadow, priority } : null);
  }
  field.setAttribute(MARK, "marked");
  field.style.setProperty("box-shadow", MARK_SHADOW, "important");
}

function unmarkField(field: HTMLElement): void {
  field.removeAttribute(MARK);
  if (!savedShadows.has(field)) return;
  const previous = savedShadows.get(field);
  if (previous && previous.shadow) field.style.setProperty("box-shadow", previous.shadow, previous.priority);
  else field.style.removeProperty("box-shadow");
  savedShadows.delete(field);
}

function noteSelfMove(host: HTMLElement): void {
  if (host.isConnected) selfMoved.add(host);
}

function placeAfter(field: HTMLElement, host: HTMLElement): void {
  const parent = field.parentNode;
  if (!parent) return;
  noteSelfMove(host);
  if (field.nextSibling) parent.insertBefore(host, field.nextSibling);
  else parent.appendChild(host);
}

function takeSelfMove(node: Node): boolean {
  if (!selfMoved.has(node)) return false;
  selfMoved.delete(node);
  return true;
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = window.setTimeout(flush, 150);
}

function armFieldWatcher(field: HTMLElement, view: FieldView): void {
  view.watcher?.disconnect();
  const watcher = new MutationObserver(() => {
    if (hostMutationIsOurs()) return;
    styleRepairFields.add(field);
    scheduleFlush();
  });
  watcher.observe(view.host, {
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "aria-hidden"],
  });
  view.watcher = watcher;
}

function armPanelWatcher(host: HTMLElement): void {
  panelWatcher?.disconnect();
  panelWatcher = new MutationObserver(() => {
    if (hostMutationIsOurs()) return;
    panelStyleQueued = true;
    scheduleFlush();
  });
  panelWatcher.observe(host, {
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "aria-hidden"],
  });
}

function clearUi(field: HTMLElement): void {
  unmarkField(field);
  const view = views.get(field);
  if (!view) return;
  view.watcher?.disconnect();
  view.watcher = null;
  styleRepairFields.delete(field);
  noteSelfMove(view.host);
  view.host.remove();
  views.delete(field);
}

function showFieldWarning(field: HTMLElement, category: WarnCategory): void {
  const concerns = concernsNow();
  const copy = fieldCopy(category);
  const because = whyText(category, concerns);
  let view = views.get(field);
  if (!view) {
    const host = document.createElement("div");
    paintHost(host);
    ours.add(host);
    const shadow = host.attachShadow({ mode: "closed" });
    const nodes = mountWarning(shadow, copy, because);
    nodes.dismissButton.addEventListener("click", () => {
      clearUi(field);
      book.dismiss(field);
    });
    view = { host, repairs: freshRepairBudget(), watcher: null, ...nodes };
    views.set(field, view);
    placeAfter(field, host);
    armFieldWatcher(field, view);
  } else if (!view.host.isConnected || field.nextElementSibling !== view.host) {
    restoreFieldReminder(field, "move");
  }
  view.message.textContent = copy;
  view.why.textContent = because;
  markField(field);
}

function hidePanel(): void {
  panelWatcher?.disconnect();
  panelWatcher = null;
  panelStyleQueued = false;
  if (panelHost) {
    noteSelfMove(panelHost);
    panelHost.remove();
  }
  panelHost = null;
  panelLines = null;
  panelMore = null;
}

function showPanel(concerns: ConcernKind[]): void {
  if (concerns.length === 0) return;
  const lines = concernLines(concerns);
  const more = moreInformation(concerns);
  if (!panelHost || !panelLines || !panelMore) {
    panelHost = document.createElement("div");
    paintHost(panelHost);
    ours.add(panelHost);
    const shadow = panelHost.attachShadow({ mode: "closed" });
    const mounted = mountPanel(shadow, lines, more, {
      goBack: () => respond("go-back"),
      continueAnyway: () => respond("continue"),
      more: () => undefined,
    });
    panelLines = mounted.linesHost;
    panelMore = mounted.more;
    panelRepairs = freshRepairBudget();
    const parent = document.body ?? document.documentElement;
    noteSelfMove(panelHost);
    parent.insertBefore(panelHost, parent.firstChild);
    armPanelWatcher(panelHost);
    return;
  }
  if (!panelHost.isConnected || (document.body ?? document.documentElement).firstElementChild !== panelHost) {
    restorePanel("move");
  }
  panelLines.replaceChildren();
  for (const line of lines) {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    panelLines.append(paragraph);
  }
  panelMore.textContent = more;
}

function respond(action: "go-back" | "continue" | "more"): void {
  const decision = responseToWarning(action);
  if (decision.acknowledge) acknowledged = true;
  const form = pausedForm;
  if (!decision.resumeSubmit) pausedForm = null;
  hidePanel();
  if (decision.resumeSubmit && form && form.isConnected) {
    pausedForm = null;
    try {
      form.requestSubmit();
    } catch {
      // Leave the form untouched when the browser refuses the request.
    }
  }
}

function insideOurs(el: Node): boolean {
  let current: Node | null = el;
  while (current) {
    if (ours.has(current)) return true;
    current = current.parentNode;
  }
  return false;
}

function consider(field: HTMLElement): void {
  if (!running || insideOurs(field)) return;
  const snapshot = extractField(field);
  const detection = snapshot ? classifyField(snapshot) : null;
  if (!snapshot || !detection?.warn || detection.category === "none") {
    clearUi(field);
    book.release(field);
    return;
  }
  const claim = book.claim(field);
  if (claim === "dismissed") return;
  showFieldWarning(field, detection.category);
}

function closedShadow(el: Element): ShadowRoot | null {
  if (!(el instanceof HTMLElement) || !chrome.dom?.openOrClosedShadowRoot) return null;
  try {
    const root = chrome.dom.openOrClosedShadowRoot(el);
    return root instanceof ShadowRoot ? root : null;
  } catch {
    return null;
  }
}

function watchShadow(el: Element): void {
  if (ours.has(el)) return;
  const shadow = el.shadowRoot ?? closedShadow(el);
  if (!shadow || watchedShadows.has(shadow)) return;
  watchedShadows.add(shadow);
  const observer = new MutationObserver((records) => queue(records));
  observer.observe(shadow, OBSERVE);
  shadowObservers.push(observer);
  scanContainer(shadow);
}

function scanContainer(container: ParentNode): void {
  if (container instanceof Element && insideOurs(container)) return;
  if (container instanceof Element && isFieldElement(container)) consider(container);
  container.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el instanceof HTMLElement) consider(el);
  });
  if (container instanceof Element) watchShadow(container);
  container.querySelectorAll("*").forEach((el) => {
    if (el instanceof Element) watchShadow(el);
  });
}

function cleanupRemoved(node: Node): void {
  if (!(node instanceof Element)) return;
  if (isFieldElement(node)) {
    clearUi(node);
    book.release(node);
  }
  node.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el instanceof HTMLElement) {
      clearUi(el);
      book.release(el);
    }
  });
}

function fieldForHost(host: HTMLElement): HTMLElement | null {
  for (const [field, view] of views) {
    if (view.host === host) return field;
  }
  return null;
}

function eachReminderHost(node: Node, visit: (host: HTMLElement) => void): void {
  if (node instanceof HTMLElement && node.classList.contains("shouldnt-wouldnt-host")) visit(node);
  if (!(node instanceof Element)) return;
  node.querySelectorAll(".shouldnt-wouldnt-host").forEach((el) => {
    if (el instanceof HTMLElement) visit(el);
  });
}

function restoreFieldReminder(field: HTMLElement, reason: "move" | "style"): void {
  if (!running) return;
  const view = views.get(field);
  if (!view || !book.hasActive(field) || !field.isConnected) return;
  const misplaced = !view.host.isConnected || field.nextElementSibling !== view.host;
  if (reason === "move" && !misplaced) return;
  const decision = consumeRepair(view.repairs, Date.now());
  view.repairs = decision.budget;
  if (!decision.allow) {
    view.watcher?.disconnect();
    view.watcher = null;
    return;
  }
  if (misplaced) placeAfter(field, view.host);
  paintHost(view.host);
  if (!view.watcher) armFieldWatcher(field, view);
}

function restorePanel(reason: "move" | "style"): void {
  if (!running || !panelHost) return;
  const parent = document.body ?? document.documentElement;
  const misplaced = !panelHost.isConnected || parent.firstElementChild !== panelHost;
  if (reason === "move" && !misplaced) return;
  const decision = consumeRepair(panelRepairs, Date.now());
  panelRepairs = decision.budget;
  if (!decision.allow) {
    panelWatcher?.disconnect();
    panelWatcher = null;
    return;
  }
  if (misplaced) {
    noteSelfMove(panelHost);
    parent.insertBefore(panelHost, parent.firstChild);
  }
  paintHost(panelHost);
  if (!panelWatcher) armPanelWatcher(panelHost);
}

function handleRemoved(node: Node): void {
  if (takeSelfMove(node)) return;
  cleanupRemoved(node);
  eachReminderHost(node, (host) => {
    if (takeSelfMove(host)) return;
    if (panelHost === host) {
      restorePanel("move");
      return;
    }
    const field = fieldForHost(host);
    if (field) restoreFieldReminder(field, "move");
  });
}

function queue(records: MutationRecord[]): void {
  if (!running) return;
  queued.push(...records);
  scheduleFlush();
}

function flush(): void {
  flushTimer = 0;
  const records = queued;
  queued = [];
  const added: Element[] = [];
  for (const record of records) {
    if (record.type === "attributes") {
      const target = record.target;
      if (target instanceof HTMLElement && isFieldElement(target)) consider(target);
      continue;
    }
    record.addedNodes.forEach((node) => {
      if (node instanceof Element && !ours.has(node)) added.push(node);
    });
    record.removedNodes.forEach((node) => handleRemoved(node));
  }
  for (const el of added) scanContainer(el);
  const styleFields = [...styleRepairFields];
  styleRepairFields.clear();
  for (const field of styleFields) restoreFieldReminder(field, "style");
  if (panelStyleQueued) {
    panelStyleQueued = false;
    restorePanel("style");
  }
}

function onFocus(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !book.hasActive(target)) return;
  const concerns = concernsNow();
  if (
    !shouldOfferStrongWarning({
      enabled: running,
      acknowledged,
      focusAlreadyShown: focusShown,
      trigger: "focus",
      fieldWarned: true,
      concernCount: concerns.length,
    })
  ) {
    return;
  }
  focusShown = true;
  showPanel(concerns);
}

function onSubmit(event: Event): void {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const formHasWarnedField = book.activeItems().some((field) => isFieldElement(field) && field.form === form);
  const concerns = concernsNow();
  if (
    !shouldPauseSubmit({
      enabled: running,
      acknowledged,
      formHasWarnedField,
      concernCount: concerns.length,
    })
  ) {
    return;
  }
  if (event.cancelable) event.preventDefault();
  pausedForm = form;
  showPanel(concerns);
}

function stopScanning(): void {
  running = false;
  rootObserver?.disconnect();
  rootObserver = null;
  for (const observer of shadowObservers) observer.disconnect();
  shadowObservers.length = 0;
  panelWatcher?.disconnect();
  panelWatcher = null;
  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = 0;
  queued = [];
  styleRepairFields.clear();
  panelStyleQueued = false;
  document.removeEventListener("focusin", onFocus, true);
  document.removeEventListener("submit", onSubmit, true);
  for (const field of book.activeItems()) clearUi(field);
  book.clearActive();
  hidePanel();
  pausedForm = null;
}

function startScanning(): void {
  if (running) return;
  running = true;
  scanContainer(document);
  rootObserver = new MutationObserver((records) => queue(records));
  rootObserver.observe(document.documentElement, OBSERVE);
  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("submit", onSubmit, true);
}

function applyEnabled(on: boolean): void {
  if (on) startScanning();
  else if (running) stopScanning();
}

async function requestEnabled(): Promise<void> {
  const response = await send({ type: "sw/getEnabled" });
  const state = parseEnabledState(response);
  applyEnabled(state ? state.enabled : true);
}

function listen(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false;
    const parsed = parseIncoming(message);
    if (!parsed) return false;
    if (parsed.type === "sw/enabledChanged") {
      applyEnabled(parsed.enabled);
      return false;
    }
    if (parsed.type === "page/getSummary") {
      sendResponse(buildSummary());
      return false;
    }
    return false;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !Object.prototype.hasOwnProperty.call(changes, PROTECTION_STORAGE_KEY)) return;
    applyEnabled(protectionFromStored(changes[PROTECTION_STORAGE_KEY]?.newValue));
  });
}

export function boot(): void {
  const marker = globalThis as { __shouldntWouldnt?: boolean };
  if (booted || marker.__shouldntWouldnt) return;
  booted = true;
  marker.__shouldntWouldnt = true;
  listen();
  void requestEnabled();
}
