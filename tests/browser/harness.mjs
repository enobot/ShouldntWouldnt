// Shared setup for the real-browser tests and the benchmark.
// Uses Playwright's Chromium (Chrome for Testing) because branded Chrome no longer
// accepts --load-extension. Nothing here reaches the internet: functional tests serve
// every request from local files through page routing and abort anything else.
import { createServer } from "node:http";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CACHE = join(ROOT, ".cache");
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(CACHE, "ms-playwright");
const { chromium } = await import("playwright");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
};

const SERVABLE = [/^\/fixtures\//, /^\/node_modules\/react\/umd\//, /^\/node_modules\/react-dom\/umd\//];

/** Synthetic values only. 9xx area numbers are never issued as Social Security numbers. */
export const SYNTHETIC = {
  ssn: "900-00-0001",
  card: "4111 1111 1111 1111",
  cvv: "737",
  password: "Synthetic-Passw0rd!",
  bank: "000123456789",
  routing: "011000015",
  comment: "synthetic comment text",
  editable: "synthetic rich text",
};

async function localFile(pathname) {
  if (!SERVABLE.some((rule) => rule.test(pathname))) return null;
  const file = join(ROOT, pathname);
  if (!file.startsWith(ROOT)) return null;
  try {
    return { body: await readFile(file), type: TYPES[extname(file)] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/** A plain local server, used by the benchmark so routing overhead does not skew timings. */
export async function serve(extra = {}) {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (extra[pathname]) {
      res.writeHead(200, { "content-type": TYPES[".html"] });
      res.end(extra[pathname]);
      return;
    }
    const found = await localFile(pathname);
    if (!found) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": found.type });
    res.end(found.body);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

/**
 * Answers every page request from local files, whatever the hostname or scheme, so a test can
 * open https://shop.test/ or http://paypal-login.test/ without a certificate or the network.
 * Anything that is not a fixture is aborted and recorded.
 */
export async function routeLocally(ctx, extra = {}) {
  const outside = [];
  const seen = [];
  await ctx.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    seen.push(url.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return route.continue();
    if (extra[url.pathname]) {
      return route.fulfill({ status: 200, contentType: TYPES[".html"], body: extra[url.pathname] });
    }
    const found = await localFile(url.pathname);
    if (found) return route.fulfill({ status: 200, contentType: found.type, body: found.body });
    if (url.pathname === "/favicon.ico") return route.fulfill({ status: 204, body: "" });
    outside.push(url.href);
    return route.abort();
  });
  return { outside, seen };
}

export async function launch(extensionDir, options = {}) {
  mkdirSync(join(CACHE, "profiles"), { recursive: true });
  const profile = options.profile ?? mkdtempSync(join(CACHE, "profiles", "p-"));
  const args = extensionDir ? [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`] : [];
  const ctx = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: options.headless ?? true,
    viewport: options.viewport ?? { width: 1280, height: 800 },
    deviceScaleFactor: options.deviceScaleFactor ?? 1,
    args,
  });
  let worker = null;
  // On a first launch Chrome starts the worker to install the extension. On a relaunch of the same
  // profile it starts the worker only when something needs it, so the caller passes the known id.
  if (extensionDir && !options.extensionId) {
    [worker] = ctx.serviceWorkers();
    if (!worker) worker = await ctx.waitForEvent("serviceworker");
  }
  return {
    ctx,
    worker,
    profile,
    extensionId: options.extensionId ?? (worker ? new URL(worker.url()).host : null),
    async close({ keepProfile = false } = {}) {
      await ctx.close();
      if (!keepProfile) rmSync(profile, { recursive: true, force: true });
    },
  };
}

/** Current extension service worker, waiting for Chrome to start it again if it was stopped. */
export async function currentWorker(ctx) {
  const [worker] = ctx.serviceWorkers();
  return worker ?? ctx.waitForEvent("serviceworker");
}

/** Stops the extension service worker the way chrome://serviceworker-internals does. */
export async function stopServiceWorker(ctx) {
  const page = await ctx.newPage();
  await page.goto("chrome://serviceworker-internals/");
  await page.getByText("Stop", { exact: true }).first().click();
  await page.waitForFunction(() => document.body.innerText.includes("Running Status: STOPPED"), null, { timeout: 10_000 });
  await page.close();
}

/** Builds a copy of an extension directory with the test probe in front of the content script. */
export function buildProbeExtension(sourceDir, label) {
  const out = join(CACHE, "probe-ext", label);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const name of ["manifest.json", "popup.html", "popup.css", "content.css", "icons"]) {
    cpSync(join(sourceDir, name), join(out, name), { recursive: true });
  }
  cpSync(join(sourceDir, "dist", "src"), join(out, "dist", "src"), { recursive: true });
  const prelude = readFileSync(join(ROOT, "tests", "browser", "probe-prelude.js"), "utf8");
  const content = readFileSync(join(sourceDir, "dist", "content.js"), "utf8");
  writeFileSync(join(out, "dist", "content.js"), `${prelude}\n${content}`);
  return out;
}

let probeRequest = 0;

/** Reads the probe counters from the page's top frame. */
export async function readProbe(page, request = "read") {
  probeRequest += 1;
  const token = `${request}-${probeRequest}`;
  await page.evaluate((value) => {
    document.documentElement.removeAttribute("data-sw-probe");
    document.documentElement.setAttribute("data-sw-probe-request", value);
  }, token);
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-sw-probe"), null, { timeout: 5_000 });
  return JSON.parse(await page.evaluate(() => document.documentElement.getAttribute("data-sw-probe")));
}

/**
 * Finds the extension's notes, including their closed shadow roots, through the DevTools
 * protocol. Page scripts cannot do this. Returns each note's text and its buttons.
 */
export async function inspectNotes(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const notes = [];
    const visit = (node, inHost) => {
      const isHost =
        node.nodeName === "DIV" &&
        (node.attributes ?? []).some((value, index, all) => index % 2 === 0 && value === "class" && /shouldnt-wouldnt-host/.test(all[index + 1]));
      if (isHost) {
        const note = { hostId: node.backendNodeId, buttons: [], texts: [] };
        notes.push(note);
        for (const shadow of node.shadowRoots ?? []) visit(shadow, note);
        return;
      }
      if (inHost) {
        if (node.nodeName === "BUTTON") inHost.buttons.push(node.backendNodeId);
        if (node.nodeName === "#text" && node.nodeValue.trim()) inHost.texts.push(node.nodeValue.trim());
      }
      for (const child of node.children ?? []) visit(child, inHost);
      for (const shadow of node.shadowRoots ?? []) visit(shadow, inHost);
      if (node.contentDocument) visit(node.contentDocument, inHost);
    };
    visit(root, null);
    for (const note of notes) {
      note.buttonInfo = [];
      for (const backendNodeId of note.buttons) {
        const ax = await cdp.send("Accessibility.getPartialAXTree", { backendNodeId, fetchRelatives: false });
        const node = ax.nodes[0] ?? {};
        const props = Object.fromEntries((node.properties ?? []).map((p) => [p.name, p.value?.value]));
        let box = null;
        try {
          const model = await cdp.send("DOM.getBoxModel", { backendNodeId });
          const q = model.model.border;
          box = { x: (q[0] + q[4]) / 2, y: (q[1] + q[5]) / 2 };
        } catch {
          box = null;
        }
        note.buttonInfo.push({ backendNodeId, name: node.name?.value ?? "", expanded: props.expanded, pressed: props.pressed, box });
      }
    }
    return notes;
  } finally {
    await cdp.detach();
  }
}

/** Accessible name, description, and value that Chrome exposes for an element in the page. */
export async function accessibleInfo(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    const ax = await cdp.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
    const node = ax.nodes[0] ?? {};
    return { name: node.name?.value ?? "", description: node.description?.value ?? "", role: node.role?.value ?? "" };
  } finally {
    await cdp.detach();
  }
}

/** Clicks a button inside a closed shadow root by its backend node id, the way a person would. */
export async function clickNode(page, backendNodeId) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.getDocument", { depth: 0 });
    await cdp.send("DOM.scrollIntoViewIfNeeded", { backendNodeId });
    const model = await cdp.send("DOM.getBoxModel", { backendNodeId });
    const q = model.model.border;
    await page.mouse.click((q[0] + q[4]) / 2, (q[1] + q[5]) / 2);
  } finally {
    await cdp.detach();
  }
}

export function popupUrl(extensionId) {
  return `chrome-extension://${extensionId}/popup.html`;
}
