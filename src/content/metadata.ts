import type { FieldSnapshot } from "../shared/types.js";

const SKIP_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
  "file",
  "checkbox",
  "radio",
  "range",
  "color",
]);

export function isSkippableType(type: string): boolean {
  return SKIP_TYPES.has(type.toLowerCase());
}

function clip(text: string | null, max: number): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Pure adapter. Callers pass attributes and visible labels, never field contents. */
export function buildSnapshot(input: {
  tag: string;
  type: string | null;
  name: string | null;
  id: string | null;
  autocomplete: string | null;
  placeholder: string | null;
  ariaLabel: string | null;
  labelText: string | null;
  nearbyText: string | null;
}): FieldSnapshot | null {
  const tag = input.tag.toLowerCase();
  if (tag !== "input" && tag !== "textarea" && tag !== "select") return null;
  const type = tag === "input" ? (input.type ?? "text").toLowerCase() : tag;
  if (tag === "input" && isSkippableType(type)) return null;
  return {
    tag,
    type,
    name: clip(input.name, 80),
    id: clip(input.id, 80),
    autocomplete: clip(input.autocomplete, 120),
    placeholder: clip(input.placeholder, 180),
    ariaLabel: clip(input.ariaLabel, 180),
    labelText: clip(input.labelText, 180),
    nearbyText: clip(input.nearbyText, 160),
  };
}

const SKIP_TEXT_IN = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "OPTGROUP", "DATALIST", "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

/** Text a person typed into an editable region. Checked by attribute so it never forces a style pass. */
function insideEditable(el: Element): boolean {
  const owner = el.closest("[contenteditable]");
  return owner !== null && owner.getAttribute("contenteditable")?.toLowerCase() !== "false";
}

/** Page text near a field, never the text of a form control or an editable region. */
function textWithoutControls(el: Element): string {
  if (insideEditable(el)) return "";
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TEXT_IN.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent !== el && insideEditable(parent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let out = "";
  while (walker.nextNode()) {
    out += ` ${walker.currentNode.textContent ?? ""}`;
    if (out.length > 240) break;
  }
  return out.replace(/\s+/g, " ").trim();
}

function rootOf(el: Element): ParentNode {
  const root = el.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot ? root : document;
}

/**
 * label[for] lookups for one batch of fields, built with one query per document or shadow root.
 * Without it every field would run its own document-wide query. (The element's own `labels` list is
 * slower still in Chrome, and it leaves live lists that every later page change must update.)
 */
let forIndex: Map<ParentNode, Map<string, Element>> | null = null;

export function withLabelIndex<T>(work: () => T): T {
  const outer = forIndex;
  forIndex = outer ?? new Map();
  try {
    return work();
  } finally {
    forIndex = outer;
  }
}

function labelForId(root: ParentNode, id: string): Element | null {
  if (!forIndex) return root.querySelector(`label[for="${CSS.escape(id)}"]`);
  let index = forIndex.get(root);
  if (!index) {
    index = new Map();
    for (const label of root.querySelectorAll("label[for]")) {
      const target = label.getAttribute("for");
      if (target && !index.has(target)) index.set(target, label);
    }
    forIndex.set(root, index);
  }
  return index.get(id) ?? null;
}

function labelText(el: Element): string {
  if (el.id) {
    const label = labelForId(rootOf(el), el.id);
    if (label) return textWithoutControls(label);
  }
  const wrapped = el.closest("label");
  return wrapped ? textWithoutControls(wrapped) : "";
}

function labelledByText(el: Element): string {
  const raw = el.getAttribute("aria-labelledby");
  if (!raw) return "";
  const root = rootOf(el);
  const parts: string[] = [];
  for (const id of raw.split(/\s+/)) {
    if (!id || !("getElementById" in root)) continue;
    const node = (root as Document | ShadowRoot).getElementById(id);
    if (node) parts.push(textWithoutControls(node));
  }
  return parts.join(" ");
}

function nearbyText(el: Element): string {
  const parts: string[] = [];
  const described = el.getAttribute("aria-describedby");
  if (described) {
    const root = rootOf(el);
    for (const id of described.split(/\s+/)) {
      if (!id || !("getElementById" in root)) continue;
      const node = (root as Document | ShadowRoot).getElementById(id);
      if (node) parts.push(textWithoutControls(node));
    }
  }
  const previous = el.previousElementSibling;
  if (previous && previous.tagName !== "INPUT" && previous.tagName !== "TEXTAREA" && previous.tagName !== "SELECT") {
    parts.push(textWithoutControls(previous));
  }
  const fieldset = el.closest("fieldset");
  const legend = fieldset?.querySelector("legend");
  if (legend) parts.push(textWithoutControls(legend));
  return parts.join(" ");
}

export function isFieldElement(el: Element): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

export function extractField(el: Element): FieldSnapshot | null {
  if (!isFieldElement(el)) return null;
  const aria = [el.getAttribute("aria-label") ?? "", labelledByText(el)].filter(Boolean).join(" ");
  return buildSnapshot({
    tag: el.tagName,
    type: el instanceof HTMLInputElement ? el.getAttribute("type") : el.tagName,
    name: el.getAttribute("name"),
    id: el.getAttribute("id"),
    autocomplete: el.getAttribute("autocomplete"),
    placeholder: el.getAttribute("placeholder"),
    ariaLabel: aria,
    labelText: labelText(el),
    nearbyText: nearbyText(el),
  });
}
