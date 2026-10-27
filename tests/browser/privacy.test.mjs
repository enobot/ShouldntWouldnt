// Real-browser privacy check. Loads the built extension with a test-only probe in front of the
// content script (see probe-prelude.js), types synthetic values into every kind of field, and then
// confirms that the extension's isolated world never touched a value-reading API, never sent a
// typed value in a message, never wrote anything but the on/off setting, and never made a request.
//
// EXT_DIR=<dir> runs the same checks against another build, for before/after comparisons.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { buildProbeExtension, launch, readProbe, ROOT, routeLocally, SYNTHETIC } from "./harness.mjs";

const SOURCE = process.env.EXT_DIR ?? ROOT;
const SECRETS = Object.values(SYNTHETIC).concat(["900-00-0002", "synthetic-hidden-value", "synthetic default comment"]);

let browser;
let routes;

before(async () => {
  const dir = buildProbeExtension(SOURCE, "privacy");
  browser = await launch(dir);
  routes = await routeLocally(browser.ctx);
});

after(async () => {
  await browser?.close();
});

async function fillEverything(page) {
  await page.click("#ssn", { clickCount: 3 });
  await page.keyboard.type(SYNTHETIC.ssn);
  await page.click("#card");
  await page.keyboard.type(SYNTHETIC.card);
  await page.click("#cvv");
  await page.keyboard.type(SYNTHETIC.cvv);
  await page.click("#password");
  await page.keyboard.type(SYNTHETIC.password);
  await page.click("#routing");
  await page.keyboard.insertText(SYNTHETIC.routing);
  await page.click("#comments");
  await page.keyboard.type(SYNTHETIC.comment);
  await page.click("#editor");
  await page.keyboard.type(` ${SYNTHETIC.editable}`);
  await page.click("#label-editor");
  await page.keyboard.type(` ${SYNTHETIC.editable}`);
  await page.click("#after-editor");
  await page.keyboard.type(SYNTHETIC.ssn);
  await page.selectOption("#state", { index: 0 });
  await page.click("#bank");
  await page.keyboard.type(SYNTHETIC.bank);
}

function assertClean(stats) {
  assert.deepEqual(stats.violations, [], "the extension touched a value-reading or network API");
  for (const message of stats.messages) {
    for (const secret of SECRETS) assert.equal(message.includes(secret), false, `a message carried ${secret}`);
  }
  assert.deepEqual(stats.storageWrites, [], "a content script wrote to extension storage");
}

describe("privacy in a real browser", () => {
  test("the probe is live in the extension's world", async () => {
    const page = await browser.ctx.newPage();
    await page.goto("https://shop.test/fixtures/privacy-probe.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const stats = await readProbe(page, "canary");
    assert.equal(stats.violations.some((line) => line.startsWith("HTMLInputElement.value")), true, "the canary read was not caught");
    await page.close();
  });

  test("typing, pasting, focusing, revealing, and submitting never expose a value to the extension", async () => {
    const page = await browser.ctx.newPage();
    await page.goto("https://shop.test/fixtures/privacy-probe.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await fillEverything(page);
    // A later change that makes the extension look at the fields again.
    await page.evaluate(() => {
      for (const id of ["ssn", "card", "bank", "after-editor", "in-editable-label"]) {
        document.getElementById(id).setAttribute("placeholder", "changed");
      }
    });
    await page.waitForTimeout(400);
    const stats = await readProbe(page);
    assertClean(stats);
    await page.click("#submit");
    await page.waitForURL(/#sent/);
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    assertClean(await readProbe(page));
    await page.close();
  });

  test("the insecure-page path (panel, pause, continue) never exposes a value either", async () => {
    const page = await browser.ctx.newPage();
    await page.goto("http://shop.test/fixtures/privacy-probe.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await fillEverything(page);
    await page.click("#submit");
    await page.waitForTimeout(300);
    assert.equal(page.url().includes("#sent"), false, "submit should pause on an http page");
    assertClean(await readProbe(page));
    await page.close();
  });

  test("text inside editable regions and drop-down options is not used as a label", async () => {
    const page = await browser.ctx.newPage();
    await page.goto("https://shop.test/fixtures/privacy-probe.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const marked = await page.evaluate(() => ({
      afterEditor: document.getElementById("after-editor").hasAttribute("data-shouldnt-wouldnt"),
      inEditableLabel: document.getElementById("in-editable-label").hasAttribute("data-shouldnt-wouldnt"),
      state: document.getElementById("state").hasAttribute("data-shouldnt-wouldnt"),
    }));
    assert.deepEqual(marked, { afterEditor: false, inEditableLabel: false, state: false });
    await page.close();
  });

  test("extension storage holds nothing but the on/off setting", async () => {
    const stored = await browser.worker.evaluate(() => chrome.storage.local.get(null));
    for (const key of Object.keys(stored)) assert.equal(key, "protectionEnabled");
    for (const value of Object.values(stored)) assert.equal(typeof value, "boolean");
    const session = await browser.worker.evaluate(() => chrome.storage.session.get(null));
    assert.deepEqual(session, {});
  });

  test("no request left the local fixtures", () => {
    assert.deepEqual(routes.outside, []);
  });
});
