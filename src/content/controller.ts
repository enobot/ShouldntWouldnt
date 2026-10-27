import { concernLines, fieldCopy, fieldDescription, moreInformation, whyText } from "../shared/copy.js";
import { responseToWarning, shouldOfferStrongWarning, shouldPauseSubmit } from "../shared/decisions.js";
import { classifyField, needsSiteConcern } from "../shared/detect.js";
import { stringsFor } from "../shared/i18n/index.js";
import { LANGUAGE_STORAGE_KEY, languageInfo, resolveLanguage, type LanguageInfo, type UiStrings } from "../shared/i18n/strings.js";
import { FieldBook } from "../shared/ledger.js";
import { shouldMask } from "../shared/masking.js";
import { parseIncoming } from "../shared/messages.js";
import { PROTECTION_STORAGE_KEY, protectionFromStored } from "../shared/protection.js";
import { consumeRepair, freshRepairBudget, type RepairBudget } from "../shared/reminder-guard.js";
import { collectConcerns, resolvesToHttp } from "../shared/signals.js";
import { statusFor } from "../shared/status.js";
import type { PageSummary } from "../shared/messages.js";
import type { ConcernKind, WarnCategory } from "../shared/types.js";
import { extractField, isFieldElement, withLabelIndex } from "./metadata.js";
import {
  hostMutationIsOurs,
  labelPanel,
  labelWarning,
  mountPanel,
  mountWarning,
  paintHost,
  setRevealState,
  type PanelNodes,
  type WarningNodes,
} from "./warning-view.js";

const MARK = "data-shouldnt-wouldnt";
const MASK = "data-shouldnt-wouldnt-mask";
const MARK_SHADOW = "inset 0 0 0 1px #9f1239, 0 0 0 1px #9f1239";
const TEXT_SECURITY = "-webkit-text-security";
const FLOW_DISPLAYS = new Set(["block", "flow-root", "list-item", "table-cell"]);
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

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface FieldView extends WarningNodes {
  host: HTMLElement;
  anchor: Element;
  category: WarnCategory;
  maskable: boolean;
  revealed: boolean;
  shownReveal: boolean | null;
  repairs: RepairBudget;
  watcher: MutationObserver | null;
}

interface SavedStyle {
  text: string;
  priority: string;
}

interface SavedField {
  shadow: SavedStyle | null;
  security: SavedStyle | null;
  description: string | null;
}

const book = new FieldBook<HTMLElement>();
const views = new Map<HTMLElement, FieldView>();
const saved = new WeakMap<HTMLElement, SavedField>();
const ours = new WeakSet<Node>();
const selfMoved = new WeakSet<Node>();
const watchedShadows = new WeakSet<ShadowRoot>();
const shadowObservers: MutationObserver[] = [];
const styleRepairFields = new Set<HTMLElement>();

let running = false;
let acknowledged = false;
let focusShown = false;
let pausedForm: HTMLFormElement | null = null;
let pausedSubmitter: HTMLElement | null = null;
let panelHost: HTMLElement | null = null;
let panelNode: HTMLDivElement | null = null;
let panelLines: HTMLDivElement | null = null;
let panelMore: HTMLParagraphElement | null = null;
let panelNodes: PanelNodes | null = null;
let panelConcerns: ConcernKind[] = [];
// The language of the extension's own notes. The page itself is never translated.
let language: LanguageInfo = languageInfo("en");
let strings: UiStrings = stringsFor("en");
let panelAfter: Element | null = null;
let panelRepairs: RepairBudget = freshRepairBudget();
let panelWatcher: MutationObserver | null = null;
let panelStyleQueued = false;
let queued: MutationRecord[] = [];
let flushTimer = 0;
let rootObserver: MutationObserver | null = null;
let booted = false;
let concernCache: ConcernKind[] | null = null;
let concernKey = "";
let reminderHidden = false;

function send(message: unknown): void {
  try {
    chrome.runtime.sendMessage(message, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    // The extension was reloaded or removed while this page stayed open.
  }
}

interface Settings {
  enabled: boolean;
  language: unknown;
}

/** The two saved settings: whether protection is on, and the language for the notes. */
function readSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([PROTECTION_STORAGE_KEY, LANGUAGE_STORAGE_KEY], (items) => {
        void chrome.runtime.lastError;
        resolve({ enabled: protectionFromStored(items?.[PROTECTION_STORAGE_KEY]), language: items?.[LANGUAGE_STORAGE_KEY] });
      });
    } catch {
      resolve({ enabled: protectionFromStored(undefined), language: undefined });
    }
  });
}

function browserLanguage(): string {
  try {
    return chrome.i18n?.getUILanguage() ?? navigator.language;
  } catch {
    return navigator.language;
  }
}

function revealLabels(): { show: string; hide: string; showName: string; hideName: string } {
  return { show: strings.show, hide: strings.hide, showName: strings.showName, hideName: strings.hideName };
}

/** Puts every note and the site panel into the chosen language. Only the extension's own words change. */
function applyLanguage(stored: unknown): void {
  const code = resolveLanguage(stored, browserLanguage());
  if (code === language.code) return;
  language = languageInfo(code);
  strings = stringsFor(code);
  concernCache = null;
  for (const [field, view] of views) {
    labelWarning(view, strings, language);
    view.shownReveal = null;
    refreshView(field, view);
  }
  if (panelNodes) {
    labelPanel(panelNodes, strings, language);
    fillPanel(panelConcerns);
  }
  concernCache = null;
}

function schemeOf(protocol: string): "http" | "https" | "other" {
  if (protocol === "http:") return "http";
  if (protocol === "https:") return "https";
  return "other";
}

function computeConcerns(): ConcernKind[] {
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

/** Site concerns for this batch. Cleared when a batch of fields has been handled. */
function concernsNow(): ConcernKind[] {
  concernCache ??= computeConcerns();
  return concernCache;
}

function freshConcerns(): ConcernKind[] {
  concernCache = null;
  const concerns = concernsNow();
  concernCache = null;
  return concerns;
}

function buildSummary(): PageSummary {
  const base = {
    ok: true as const,
    hostname: location.hostname,
    scheme: schemeOf(location.protocol),
  };
  if (!running) {
    return { ...base, protection: false, sensitiveCount: null, concernCount: null, status: "unable", reminderHidden: false };
  }
  const sensitiveCount = book.activeItems().filter((field) => field.isConnected).length;
  const concernCount = freshConcerns().length;
  return {
    ...base,
    protection: true,
    sensitiveCount,
    concernCount,
    status: statusFor({ protectionOn: true, scannable: true, sensitiveCount, concernCount }),
    reminderHidden,
  };
}

function readInline(field: HTMLElement, name: string): SavedStyle | null {
  const text = field.style.getPropertyValue(name);
  return text ? { text, priority: field.style.getPropertyPriority(name) } : null;
}

function restoreInline(field: HTMLElement, name: string, previous: SavedStyle | null): void {
  if (previous) field.style.setProperty(name, previous.text, previous.priority);
  else field.style.removeProperty(name);
}

function setInline(field: HTMLElement, name: string, value: string): void {
  if (field.style.getPropertyValue(name) === value && field.style.getPropertyPriority(name) === "important") return;
  field.style.setProperty(name, value, "important");
}

function setAttr(field: HTMLElement, name: string, value: string): void {
  if (field.getAttribute(name) !== value) field.setAttribute(name, value);
}

function savedFor(field: HTMLElement): SavedField {
  let entry = saved.get(field);
  if (!entry) {
    entry = {
      shadow: readInline(field, "box-shadow"),
      security: readInline(field, TEXT_SECURITY),
      description: field.getAttribute("aria-description"),
    };
    saved.set(field, entry);
  }
  return entry;
}

function markField(field: HTMLElement, description: string): void {
  savedFor(field);
  setAttr(field, MARK, "marked");
  setInline(field, "box-shadow", MARK_SHADOW);
  setAttr(field, "aria-description", description);
}

/** Visual masking only: a CSS property on the field. The value is never read or copied. */
function applyMask(field: HTMLElement, on: boolean): void {
  const entry = savedFor(field);
  if (on) {
    setAttr(field, MASK, "on");
    setInline(field, TEXT_SECURITY, "disc");
    return;
  }
  field.removeAttribute(MASK);
  restoreInline(field, TEXT_SECURITY, entry.security);
}

function unmarkField(field: HTMLElement): void {
  field.removeAttribute(MARK);
  field.removeAttribute(MASK);
  const entry = saved.get(field);
  if (!entry) return;
  restoreInline(field, "box-shadow", entry.shadow);
  restoreInline(field, TEXT_SECURITY, entry.security);
  if (entry.description === null) field.removeAttribute("aria-description");
  else field.setAttribute("aria-description", entry.description);
  saved.delete(field);
}

function noteSelfMove(host: HTMLElement): void {
  if (host.isConnected) selfMoved.add(host);
}

/** Puts a note after its anchor, after any of our notes already there, so notes that share an anchor keep their order. */
function placeAfter(anchor: Element, host: HTMLElement): void {
  const parent = anchor.parentNode;
  if (!parent) return;
  let before = anchor.nextSibling;
  while (before && before !== host && ours.has(before)) before = before.nextSibling;
  noteSelfMove(host);
  parent.insertBefore(host, before);
}

/** True when a note sits after its anchor with nothing but our other notes in between. */
function sitsAfter(anchor: Element, host: Element): boolean {
  let node = anchor.nextElementSibling;
  while (node && node !== host && ours.has(node)) node = node.nextElementSibling;
  return node === host;
}

/** True when a block placed among this element's children lands on its own line below them. */
function stacksChildren(el: Element): boolean {
  const style = getComputedStyle(el);
  if (FLOW_DISPLAYS.has(style.display)) return true;
  if (style.display === "flex" || style.display === "inline-flex") return style.flexDirection.startsWith("column");
  if (style.display === "grid" || style.display === "inline-grid") return style.gridTemplateColumns.trim().split(/\s+/).length <= 1;
  return false;
}

/** Stops climbing at the form or the page itself, so a note never ends up far from its field. */
function climbLimit(el: Element | null): boolean {
  return !el || el instanceof HTMLFormElement || el === document.body || el === document.documentElement;
}

/**
 * Where a note goes: on its own line below the field. It never goes inside the field's label, where a
 * screen reader would read it as part of the field's name, and never into a box that lays its children
 * side by side (a flex row, a multi-column grid, an inline wrapper), where it would squeeze the field.
 * From the field, it moves out of those boxes until it reaches one that stacks its children.
 */
function anchorFor(field: HTMLElement): Element {
  let anchor: Element = field;
  for (let depth = 0; depth < 8; depth += 1) {
    const parent = anchor.parentElement;
    if (climbLimit(parent) || !parent) break;
    if (!(parent instanceof HTMLLabelElement) && stacksChildren(parent)) break;
    anchor = parent;
  }
  return anchor;
}

/**
 * Some pages draw a field inside a box of fixed height. A note placed there spills over whatever comes
 * next, such as the submit button. After a batch is placed, a note that spills out of its box moves
 * after that box, at most three levels. Boxes that scroll their content are left alone.
 */
function settlePlacement(placed: FieldView[]): void {
  let pending = placed;
  for (let round = 0; round < 3 && pending.length > 0; round += 1) {
    const spilled = pending.filter((view) => {
      const parent = view.host.parentElement;
      if (!view.host.isConnected || climbLimit(parent) || !parent) return false;
      const style = getComputedStyle(parent);
      if (style.display === "contents" || /auto|scroll/.test(style.overflowY)) return false;
      const box = parent.getBoundingClientRect();
      const note = view.host.getBoundingClientRect();
      return note.height > 0 && note.bottom > box.bottom + 1;
    });
    for (const view of spilled) {
      const parent = view.host.parentElement;
      if (!parent) continue;
      view.anchor = parent;
      placeAfter(parent, view.host);
    }
    pending = spilled;
  }
}

function anchorStillFits(view: FieldView, field: HTMLElement): boolean {
  return view.anchor.isConnected && (view.anchor === field || view.anchor.contains(field));
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

function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

function refreshView(field: HTMLElement, view: FieldView): void {
  const concerns = concernsNow();
  const masked = view.maskable && !view.revealed;
  setText(view.message, fieldCopy(view.category, strings));
  setText(view.why, whyText(view.category, concerns, view.maskable, strings));
  markField(field, fieldDescription(view.category, concerns, strings));
  applyMask(field, masked);
  if (view.revealButton.hidden === view.maskable) view.revealButton.hidden = !view.maskable;
  if (view.maskable && view.shownReveal !== view.revealed) {
    setRevealState(view.revealButton, view.revealed, revealLabels());
    view.shownReveal = view.revealed;
  }
}

function showFieldWarning(field: Field, category: WarnCategory, anchor: Element): void {
  const maskable = shouldMask(category, field.tagName, field instanceof HTMLInputElement ? field.type : field.tagName);
  let view = views.get(field);
  if (!view) {
    const host = document.createElement("div");
    paintHost(host);
    ours.add(host);
    const shadow = host.attachShadow({ mode: "closed" });
    const nodes = mountWarning(shadow, fieldCopy(category, strings), whyText(category, concernsNow(), maskable, strings), strings, language);
    const created: FieldView = {
      host,
      anchor,
      category,
      maskable,
      revealed: false,
      shownReveal: null,
      repairs: freshRepairBudget(),
      watcher: null,
      ...nodes,
    };
    nodes.dismissButton.addEventListener("click", () => {
      clearUi(field);
      book.dismiss(field);
    });
    nodes.revealButton.addEventListener("click", () => {
      created.revealed = !created.revealed;
      concernCache = null;
      refreshView(field, created);
      concernCache = null;
    });
    view = created;
    views.set(field, view);
    placeAfter(anchor, host);
    armFieldWatcher(field, view);
  } else {
    if (view.category !== category) view.revealed = false;
    view.category = category;
    view.maskable = maskable;
    if (!anchorStillFits(view, field)) view.anchor = anchor;
    if (!view.host.isConnected || !sitsAfter(view.anchor, view.host)) restoreFieldReminder(field, "move");
  }
  refreshView(field, view);
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
  panelNode = null;
  panelLines = null;
  panelMore = null;
  panelNodes = null;
  panelAfter = null;
}

function fillPanel(concerns: ConcernKind[]): void {
  if (!panelNodes) return;
  panelNodes.linesHost.replaceChildren();
  for (const line of concernLines(concerns, strings)) {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    panelNodes.linesHost.append(paragraph);
  }
  panelNodes.more.textContent = moreInformation(concerns, strings);
}

/** The panel goes right after the warned field's note, so it shows up where the person is looking. */
function panelSpot(field: HTMLElement): Element {
  const view = views.get(field);
  if (view?.host.isConnected) return view.host;
  return view?.anchor.isConnected ? view.anchor : field;
}

function panelMisplaced(): boolean {
  if (!panelHost) return false;
  if (!panelHost.isConnected) return true;
  return !!panelAfter && panelAfter.isConnected && !sitsAfter(panelAfter, panelHost);
}

function showPanel(concerns: ConcernKind[], near: HTMLElement): void {
  if (concerns.length === 0) return;
  panelConcerns = concerns;
  const lines = concernLines(concerns, strings);
  const more = moreInformation(concerns, strings);
  panelAfter = panelSpot(near);
  if (!panelHost || !panelLines || !panelMore) {
    panelHost = document.createElement("div");
    paintHost(panelHost);
    ours.add(panelHost);
    const shadow = panelHost.attachShadow({ mode: "closed" });
    const mounted = mountPanel(
      shadow,
      lines,
      more,
      {
        goBack: () => respond("go-back"),
        continueAnyway: () => respond("continue"),
        more: () => undefined,
      },
      strings,
      language,
    );
    panelNodes = mounted;
    panelNode = mounted.panel;
    panelLines = mounted.linesHost;
    panelMore = mounted.more;
    panelRepairs = freshRepairBudget();
    placeAfter(panelAfter, panelHost);
    armPanelWatcher(panelHost);
    return;
  }
  if (panelMisplaced()) restorePanel("move");
  fillPanel(concerns);
}

function respond(action: "go-back" | "continue" | "more"): void {
  const decision = responseToWarning(action);
  if (decision.acknowledge) acknowledged = true;
  const form = pausedForm;
  const submitter = pausedSubmitter;
  const returnTo = panelAfter;
  if (!decision.resumeSubmit) {
    pausedForm = null;
    pausedSubmitter = null;
  }
  hidePanel();
  if (action === "go-back" && form) {
    const target = submitter?.isConnected ? submitter : returnTo instanceof HTMLElement ? returnTo : null;
    target?.focus({ preventScroll: true });
  }
  if (decision.resumeSubmit && form && form.isConnected) {
    pausedForm = null;
    pausedSubmitter = null;
    resumeSubmit(form, submitter);
  }
}

/** Continues the form with the button the person pressed, so forms with several submit buttons keep working. */
function resumeSubmit(form: HTMLFormElement, submitter: HTMLElement | null): void {
  const usable =
    submitter && submitter.isConnected && (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) && submitter.form === form;
  try {
    form.requestSubmit(usable ? submitter : undefined);
  } catch {
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

interface Pending {
  field: Field;
  category: WarnCategory;
  anchor: Element;
}

/**
 * Classifies a set of fields, then changes the page. Reads come first and writes second, so
 * a batch costs at most one style pass for placement instead of one per field.
 */
function considerAll(fields: Iterable<HTMLElement>): void {
  if (!running) return;
  const pending: Pending[] = [];
  let pageConcern: boolean | null = null;
  // Email, password, and phone fields are on nearly every page. They warn only where the page gives a
  // reason: it loaded over HTTP, the field's form submits over HTTP, or the address is a lookalike.
  const siteGivesReason = (field: Field): boolean => {
    pageConcern ??= collectConcerns({ pageUrl: location.href, hostname: location.hostname, sensitiveFormActions: [] }).length > 0;
    return pageConcern || resolvesToHttp(field.form?.getAttribute("action") ?? null, location.href);
  };
  withLabelIndex(() => {
    for (const field of fields) {
      if (!isFieldElement(field) || !field.isConnected || insideOurs(field)) continue;
      const snapshot = extractField(field);
      const detection = snapshot ? classifyField(snapshot) : null;
      const quiet = !!detection && needsSiteConcern(detection.category) && !siteGivesReason(field);
      if (!snapshot || !detection?.warn || detection.category === "none" || quiet) {
        clearUi(field);
        book.release(field);
        continue;
      }
      if (book.claim(field) === "dismissed") continue;
      const view = views.get(field);
      const anchor = view && anchorStillFits(view, field) ? view.anchor : anchorFor(field);
      pending.push({ field, category: detection.category, anchor });
    }
  });
  concernCache = null;
  for (const item of pending) showFieldWarning(item.field, item.category, item.anchor);
  settlePlacement(pending.flatMap((item) => views.get(item.field) ?? []));
  const key = concernsNow().join(",");
  if (key !== concernKey) {
    concernKey = key;
    for (const [field, view] of views) refreshView(field, view);
  }
  concernCache = null;
}

function closedShadow(el: Element): ShadowRoot | null {
  if (!chrome.dom?.openOrClosedShadowRoot) return null;
  try {
    const root = chrome.dom.openOrClosedShadowRoot(el as HTMLElement);
    return root instanceof ShadowRoot ? root : null;
  } catch {
    return null;
  }
}

/**
 * Open shadow roots are visible on every element. Closed ones are looked up only on custom
 * elements, where component libraries put them, because asking for every element is slow on large
 * pages. A closed root attached to a plain built-in element is therefore not scanned.
 */
function shadowOf(el: Element): ShadowRoot | null {
  if (ours.has(el)) return null;
  if (el.shadowRoot) return el.shadowRoot;
  return el.localName.includes("-") ? closedShadow(el) : null;
}

function watchShadow(shadow: ShadowRoot, found: HTMLElement[]): void {
  if (watchedShadows.has(shadow)) return;
  watchedShadows.add(shadow);
  const observer = new MutationObserver((records) => queue(records));
  observer.observe(shadow, OBSERVE);
  shadowObservers.push(observer);
  collect(shadow, found);
}

/** One walk over a subtree: fields to classify, and shadow roots to watch. */
function collect(container: ParentNode, found: HTMLElement[]): void {
  if (container instanceof Element) {
    if (insideOurs(container)) return;
    if (isFieldElement(container)) found.push(container);
    const own = shadowOf(container);
    if (own) watchShadow(own, found);
  }
  const walker = document.createTreeWalker(container as Node, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return ours.has(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    if (isFieldElement(el)) found.push(el);
    const shadow = shadowOf(el);
    if (shadow) watchShadow(shadow, found);
  }
}

function scanContainers(containers: Iterable<ParentNode>): void {
  const found: HTMLElement[] = [];
  for (const container of containers) collect(container, found);
  considerAll(found);
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

/**
 * Tells the toolbar button that this page removed or covered a reminder, once per page. The badge
 * lives outside the page, so the page cannot remove it. It clears when the page goes away.
 */
function noteReminderHidden(): void {
  if (reminderHidden) return;
  reminderHidden = true;
  send({ type: "page/reminderHidden" });
  window.addEventListener(
    "pagehide",
    () => {
      send({ type: "page/left" });
    },
    { once: true },
  );
}

function restoreFieldReminder(field: HTMLElement, reason: "move" | "style"): void {
  if (!running) return;
  const view = views.get(field);
  if (!view || !book.hasActive(field) || !field.isConnected) return;
  if (!anchorStillFits(view, field)) view.anchor = anchorFor(field);
  const misplaced = !view.host.isConnected || !sitsAfter(view.anchor, view.host);
  if (reason === "move" && !misplaced) return;
  const decision = consumeRepair(view.repairs, Date.now());
  view.repairs = decision.budget;
  if (!decision.allow) {
    view.watcher?.disconnect();
    view.watcher = null;
    noteReminderHidden();
    return;
  }
  if (misplaced) placeAfter(view.anchor, view.host);
  paintHost(view.host);
  if (!view.watcher) armFieldWatcher(field, view);
}

function restorePanel(reason: "move" | "style"): void {
  if (!running || !panelHost) return;
  const misplaced = panelMisplaced();
  if (reason === "move" && !misplaced) return;
  const decision = consumeRepair(panelRepairs, Date.now());
  panelRepairs = decision.budget;
  if (!decision.allow) {
    panelWatcher?.disconnect();
    panelWatcher = null;
    noteReminderHidden();
    return;
  }
  if (misplaced && panelAfter?.isConnected) placeAfter(panelAfter, panelHost);
  else if (misplaced) {
    const parent = document.body ?? document.documentElement;
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
  const changedFields = new Set<HTMLElement>();
  const added = new Set<Element>();
  for (const record of records) {
    if (record.type === "attributes") {
      const target = record.target;
      if (target instanceof HTMLElement && isFieldElement(target)) changedFields.add(target);
      continue;
    }
    record.addedNodes.forEach((node) => {
      if (node instanceof Element && !ours.has(node)) added.add(node);
    });
    record.removedNodes.forEach((node) => handleRemoved(node));
  }
  const found: HTMLElement[] = [...changedFields];
  for (const el of added) {
    if (el.isConnected) collect(el, found);
  }
  considerAll(new Set(found));
  const styleFields = [...styleRepairFields];
  styleRepairFields.clear();
  for (const field of styleFields) restoreFieldReminder(field, "style");
  if (panelStyleQueued) {
    panelStyleQueued = false;
    restorePanel("style");
  }
}

/**
 * When a warned field gets focus, checks once whether something on the page sits on top of its
 * note. One hit test on focus, never in a loop. A cover that lets clicks pass through is missed.
 */
function checkCovered(field: HTMLElement): void {
  const view = views.get(field);
  if (!view?.host.isConnected || reminderHidden) return;
  const rect = view.host.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    noteReminderHidden();
    return;
  }
  // Only judge a note that is fully on screen, and only call it covered when two points agree.
  if (rect.top < 0 || rect.left < 0 || rect.bottom > innerHeight || rect.right > innerWidth) return;
  const y = rect.top + rect.height / 2;
  const points = [rect.left + Math.min(20, rect.width / 4), rect.left + rect.width / 2];
  const covered = points.every((x) => {
    const top = document.elementFromPoint(x, y);
    return !!top && top !== view.host && !view.host.contains(top);
  });
  if (covered) noteReminderHidden();
}

function onFocus(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !book.hasActive(target)) return;
  checkCovered(target);
  const concerns = freshConcerns();
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
  showPanel(concerns, target);
}

function onSubmit(event: Event): void {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const warned = book.activeItems().find((field) => isFieldElement(field) && field.form === form);
  const concerns = freshConcerns();
  if (
    !shouldPauseSubmit({
      enabled: running,
      acknowledged,
      formHasWarnedField: !!warned,
      concernCount: concerns.length,
    })
  ) {
    return;
  }
  if (event.cancelable) event.preventDefault();
  pausedForm = form;
  pausedSubmitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement ? event.submitter : null;
  showPanel(concerns, warned ?? form);
  // The person pressed submit and nothing was sent, so bring the reason into view and move focus to it.
  panelHost?.scrollIntoView({ block: "nearest" });
  panelNode?.focus({ preventScroll: true });
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
  for (const field of [...views.keys()]) clearUi(field);
  book.clearActive();
  hidePanel();
  pausedForm = null;
  pausedSubmitter = null;
  concernCache = null;
  concernKey = "";
}

function startScanning(): void {
  if (running) return;
  running = true;
  scanContainers([document]);
  rootObserver = new MutationObserver((records) => queue(records));
  rootObserver.observe(document.documentElement, OBSERVE);
  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("submit", onSubmit, true);
}

function applyEnabled(on: boolean): void {
  if (on) startScanning();
  else if (running) stopScanning();
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
      // Read the saved choice first, so a summary asked for right after a toggle is never stale.
      void readSettings().then((settings) => {
        applyLanguage(settings.language);
        applyEnabled(settings.enabled);
        sendResponse(buildSummary());
      });
      return true;
    }
    return false;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (Object.prototype.hasOwnProperty.call(changes, LANGUAGE_STORAGE_KEY)) applyLanguage(changes[LANGUAGE_STORAGE_KEY]?.newValue);
    if (Object.prototype.hasOwnProperty.call(changes, PROTECTION_STORAGE_KEY)) {
      applyEnabled(protectionFromStored(changes[PROTECTION_STORAGE_KEY]?.newValue));
    }
  });
}

export function boot(): void {
  const marker = globalThis as { __shouldntWouldnt?: boolean };
  if (booted || marker.__shouldntWouldnt) return;
  booted = true;
  marker.__shouldntWouldnt = true;
  listen();
  void readSettings().then((settings) => {
    applyLanguage(settings.language);
    applyEnabled(settings.enabled);
  });
}
