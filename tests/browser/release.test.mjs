// Unpacks the release zip with a small reader of its own and loads that folder in Chromium.
// Run `npm run build && npm run package` first.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { inflateRawSync } from "node:zlib";
import { CACHE, launch, ROOT, routeLocally } from "./harness.mjs";

const version = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8")).version;
const zipPath = join(ROOT, "release", `shouldnt-wouldnt-${version}.zip`);
const outDir = join(CACHE, "release-check");

function unzip(buffer, target) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  const names = [];
  for (let i = 0; i < count; i += 1) {
    const method = buffer.readUInt16LE(at + 10);
    const size = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extra = buffer.readUInt16LE(at + 30);
    const comment = buffer.readUInt16LE(at + 32);
    const localAt = buffer.readUInt32LE(at + 42);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);
    const localName = buffer.readUInt16LE(localAt + 26);
    const localExtra = buffer.readUInt16LE(localAt + 28);
    const start = localAt + 30 + localName + localExtra;
    const raw = buffer.subarray(start, start + size);
    const data = method === 8 ? inflateRawSync(raw) : raw;
    const file = join(target, name);
    assert.equal(file.startsWith(target), true, `unsafe path ${name}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, data);
    names.push(name);
    at += 46 + nameLength + extra + comment;
  }
  return names;
}

let names = [];
let browser;

before(async () => {
  assert.equal(existsSync(zipPath), true, "run npm run package first");
  rmSync(outDir, { recursive: true, force: true });
  names = unzip(readFileSync(zipPath), outDir);
  browser = await launch(outDir);
  await routeLocally(browser.ctx);
});

after(async () => {
  await browser?.close();
});

describe("release package", () => {
  test("holds only what the extension loads", () => {
    assert.equal(names.includes("manifest.json"), true);
    assert.equal(names.includes("dist/content.js"), true);
    for (const name of names) {
      assert.equal(/\.(ts|map|md|mjs)$|^tests\/|^dist\/tests\/|^node_modules\/|^store\/|^fixtures\/|^\.cache\//.test(name), false, name);
    }
  });

  test("the unpacked package runs: a reminder appears and the popup renders", async () => {
    const page = await browser.ctx.newPage();
    await page.goto("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const popup = await browser.ctx.newPage();
    const errors = [];
    popup.on("pageerror", (error) => errors.push(error.message));
    await popup.goto(`chrome-extension://${browser.extensionId}/popup.html`);
    await popup.waitForSelector("#protection-toggle");
    assert.equal(await popup.textContent("h1"), "Shouldn't Wouldn't");
    assert.deepEqual(errors, []);
  });

  test("the packaged service worker loads its modules and saves the switch", async () => {
    const popup = await browser.ctx.newPage();
    await popup.goto(`chrome-extension://${browser.extensionId}/popup.html`);
    await popup.locator("#protection-toggle[aria-checked=true]").click();
    await popup.waitForFunction(() => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === "false");
    const saved = await browser.worker.evaluate(() => chrome.storage.local.get(null));
    assert.deepEqual(saved, { protectionEnabled: false });
    await popup.locator("#protection-toggle").click();
    await popup.waitForFunction(() => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === "true");
  });
});
