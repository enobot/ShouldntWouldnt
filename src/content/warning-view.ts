const HOST_CLASS = "shouldnt-wouldnt-host";

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
p { margin: 0 0 8px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
button {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #7a2430;
  background: #fff;
  color: #3f1d24;
  padding: 4px 8px;
}
button.quiet { border-color: transparent; background: transparent; }
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

export interface WarningNodes {
  message: HTMLParagraphElement;
  why: HTMLParagraphElement;
  dismissButton: HTMLButtonElement;
}

export function mountWarning(shadow: ShadowRoot, copy: string, because: string): WarningNodes {
  const message = document.createElement("p");
  message.textContent = copy;
  const why = document.createElement("p");
  why.textContent = because;
  why.hidden = true;
  const row = document.createElement("div");
  row.className = "row";
  const dismissButton = button("Dismiss", () => undefined);
  row.append(
    button("Why am I seeing this?", () => {
      why.hidden = !why.hidden;
    }, true),
    dismissButton,
  );
  const note = document.createElement("div");
  note.className = "note";
  note.append(message, why, row);
  shadow.append(styleNode(), note);
  return { message, why, dismissButton };
}

export function mountPanel(
  shadow: ShadowRoot,
  lines: string[],
  moreText: string,
  handlers: { goBack: () => void; continueAnyway: () => void; more: () => void },
): { linesHost: HTMLDivElement; more: HTMLParagraphElement } {
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
  actions.append(
    button("Go Back", () => handlers.goBack()),
    button("Continue Anyway", () => handlers.continueAnyway()),
    button("More Information", () => {
      more.hidden = false;
      handlers.more();
    }, true),
  );
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.append(linesHost, more, actions);
  shadow.append(styleNode(), panel);
  return { linesHost, more };
}
