const HOST_CLASS = "shouldnt-wouldnt-host";
const SVG_NS = "http://www.w3.org/2000/svg";

const SHADOW_CSS = `
:host {
  all: initial;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: static !important;
  inset: auto !important;
  transform: none !important;
  filter: none !important;
  clip-path: none !important;
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
  width: auto !important;
  pointer-events: auto !important;
  float: none !important;
  z-index: auto !important;
  margin: 4px 0 8px !important;
  max-width: 36rem !important;
  clear: both !important;
  color: #3f1d24;
  font: 14px/1.45 Georgia, "Times New Roman", serif;
}
.note, .panel {
  display: block;
  box-sizing: border-box;
  margin: 0;
  border: 1px solid #9f1239;
  border-radius: 6px;
  background: #fff7f7;
  padding: 8px 10px;
}
.panel:focus { outline: 2px solid #1e3a5f; outline-offset: 2px; }
p { margin: 0 0 8px; }
[hidden] { display: none !important; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
button {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #7a2430;
  background: #fff;
  color: #3f1d24;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
button:focus-visible { outline: 2px solid #1e3a5f; outline-offset: 2px; }
button.quiet { border-color: transparent; background: transparent; text-decoration: underline; }
svg { width: 1.1em; height: 1.1em; flex: none; }
@media (forced-colors: active) {
  .note, .panel, button { border: 1px solid CanvasText; }
}
`;

const HOST_STYLES: Array<[string, string]> = [
  ["display", "block"],
  ["visibility", "visible"],
  ["opacity", "1"],
  ["position", "static"],
  ["inset", "auto"],
  ["transform", "none"],
  ["filter", "none"],
  ["clip-path", "none"],
  ["overflow", "visible"],
  ["max-height", "none"],
  ["height", "auto"],
  ["width", "auto"],
  ["pointer-events", "auto"],
  ["float", "none"],
  ["z-index", "auto"],
  ["margin", "4px 0 8px"],
  ["max-width", "36rem"],
  ["clear", "both"],
  ["content-visibility", "visible"],
];

let paintDepth = 0;
let nextId = 0;

export function hostMutationIsOurs(): boolean {
  return paintDepth > 0;
}

export function paintHost(host: HTMLElement): void {
  paintDepth += 1;
  host.className = HOST_CLASS;
  host.removeAttribute("hidden");
  if (host.getAttribute("aria-hidden") === "true") host.removeAttribute("aria-hidden");
  for (const [name, style] of HOST_STYLES) host.style.setProperty(name, style, "important");
  queueMicrotask(() => {
    paintDepth = Math.max(0, paintDepth - 1);
  });
}

function styleNode(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = SHADOW_CSS;
  return style;
}

function button(label: string, onClick: () => void, quiet = false): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  if (quiet) node.className = "quiet";
  node.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return node;
}

const eyeTemplates = new Map<boolean, SVGSVGElement>();

/** The eye is built once per state and cloned, since a page may show many notes. */
function eyeIcon(open: boolean): SVGSVGElement {
  let template = eyeTemplates.get(open);
  if (!template) {
    template = buildEyeIcon(open);
    eyeTemplates.set(open, template);
  }
  return template.cloneNode(true) as SVGSVGElement;
}

function buildEyeIcon(open: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const eye = document.createElementNS(SVG_NS, "path");
  eye.setAttribute("d", "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z");
  const pupil = document.createElementNS(SVG_NS, "circle");
  pupil.setAttribute("cx", "12");
  pupil.setAttribute("cy", "12");
  pupil.setAttribute("r", "3");
  for (const shape of [eye, pupil]) {
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", "currentColor");
    shape.setAttribute("stroke-width", "1.8");
  }
  svg.append(eye, pupil);
  if (!open) {
    const slash = document.createElementNS(SVG_NS, "path");
    slash.setAttribute("d", "M4 4l16 16");
    slash.setAttribute("stroke", "currentColor");
    slash.setAttribute("stroke-width", "1.8");
    svg.append(slash);
  }
  return svg;
}

export interface WarningNodes {
  message: HTMLParagraphElement;
  why: HTMLParagraphElement;
  dismissButton: HTMLButtonElement;
  revealButton: HTMLButtonElement;
}

/** Shows "Show" or "Hide" on the reveal button. The visible word stays inside the accessible name. */
export function setRevealState(node: HTMLButtonElement, revealed: boolean, labels: { show: string; hide: string; showName: string; hideName: string }): void {
  const text = document.createElement("span");
  text.textContent = revealed ? labels.hide : labels.show;
  node.replaceChildren(eyeIcon(!revealed), text);
  node.setAttribute("aria-label", revealed ? labels.hideName : labels.showName);
}

export function mountWarning(shadow: ShadowRoot, copy: string, because: string): WarningNodes {
  const id = `sw-why-${(nextId += 1)}`;
  const message = document.createElement("p");
  message.textContent = copy;
  const why = document.createElement("p");
  why.id = id;
  why.textContent = because;
  why.hidden = true;
  const row = document.createElement("div");
  row.className = "row";
  const revealButton = button("", () => undefined);
  revealButton.hidden = true;
  const whyButton = button(
    "Why am I seeing this?",
    () => {
      why.hidden = !why.hidden;
      whyButton.setAttribute("aria-expanded", why.hidden ? "false" : "true");
    },
    true,
  );
  whyButton.setAttribute("aria-expanded", "false");
  whyButton.setAttribute("aria-controls", id);
  const dismissButton = button("Dismiss", () => undefined);
  dismissButton.setAttribute("aria-label", "Dismiss this reminder");
  row.append(revealButton, whyButton, dismissButton);
  const note = document.createElement("div");
  note.className = "note";
  note.setAttribute("role", "note");
  note.setAttribute("aria-label", "Shouldn't Wouldn't reminder");
  note.append(message, why, row);
  shadow.append(styleNode(), note);
  return { message, why, dismissButton, revealButton };
}

export interface PanelNodes {
  panel: HTMLDivElement;
  linesHost: HTMLDivElement;
  more: HTMLParagraphElement;
}

export function mountPanel(
  shadow: ShadowRoot,
  lines: string[],
  moreText: string,
  handlers: { goBack: () => void; continueAnyway: () => void; more: () => void },
): PanelNodes {
  const linesHost = document.createElement("div");
  for (const line of lines) {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    linesHost.append(paragraph);
  }
  const more = document.createElement("p");
  more.textContent = moreText;
  more.hidden = true;
  const actions = document.createElement("div");
  actions.className = "row";
  const moreButton = button(
    "More Information",
    () => {
      more.hidden = false;
      moreButton.setAttribute("aria-expanded", "true");
      handlers.more();
    },
    true,
  );
  moreButton.setAttribute("aria-expanded", "false");
  actions.append(button("Go Back", () => handlers.goBack()), button("Continue Anyway", () => handlers.continueAnyway()), moreButton);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Shouldn't Wouldn't site reminder");
  panel.tabIndex = -1;
  panel.append(linesHost, more, actions);
  shadow.append(styleNode(), panel);
  return { panel, linesHost, more };
}
