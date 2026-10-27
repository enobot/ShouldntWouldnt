// Real-browser behavior tests for the built extension in Playwright's Chromium.
// Every page comes from fixtures/ through local routing, so a test can use https://shop.test/ or
// http://shop.test/ and nothing reaches the network. All typed values are synthetic.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import {
  accessibleInfo,
  clickNode,
  currentWorker,
  inspectNotes,
  launch,
  popupUrl,
  ROOT,
  routeLocally,
  stopServiceWorker,
  SYNTHETIC,
} from "./harness.mjs";

const SOURCE = process.env.EXT_DIR ?? ROOT;
const outside = [];
let browser;

before(async () => {
  browser = await launch(SOURCE);
  outside.push((await routeLocally(browser.ctx)).outside);
});

after(async () => {
  await browser?.close();
});

async function open(url) {
  const page = await browser.ctx.newPage();
  await page.goto(url);
  return page;
}

function textSecurity(page, selector) {
  return page.$eval(selector, (el) => getComputedStyle(el).getPropertyValue("-webkit-text-security").trim());
}

function marked(page, selector) {
  return page.$eval(selector, (el) => el.getAttribute("data-shouldnt-wouldnt") === "marked");
}

async function noteFor(page, index = 0) {
  const notes = await inspectNotes(page);
  return notes[index];
}

function buttonNamed(note, pattern) {
  return note.buttonInfo.find((info) => pattern.test(info.name));
}

async function tabIdFor(urlPattern) {
  const worker = await currentWorker(browser.ctx);
  return worker.evaluate(async (pattern) => {
    const tabs = await chrome.tabs.query({ url: pattern });
    return tabs[0]?.id ?? null;
  }, urlPattern);
}

async function summaryFor(urlPattern) {
  const worker = await currentWorker(browser.ctx);
  return worker.evaluate(async (pattern) => {
    const [tab] = await chrome.tabs.query({ url: pattern });
    return new Promise((resolve) => chrome.tabs.sendMessage(tab.id, { type: "page/getSummary" }, { frameId: 0 }, resolve));
  }, urlPattern);
}

async function badgeFor(urlPattern) {
  const tabId = await tabIdFor(urlPattern);
  const worker = await currentWorker(browser.ctx);
  return worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId);
}

describe("detection on real pages", () => {
  test("the Social Security field is marked and the comments box is not", async () => {
    const page = await open("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    assert.equal(await marked(page, "#ssn"), true);
    assert.equal(await page.$eval("textarea", (el) => el.hasAttribute("data-shouldnt-wouldnt")), false);
    await page.close();
  });

  test("page text about Social Security numbers does not mark unrelated boxes", async () => {
    const page = await open("https://shop.test/fixtures/misleading-context.html");
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0);
    assert.equal(await page.locator(".shouldnt-wouldnt-host").count(), 0);
    await page.close();
  });

  test("fields added later and redrawn forms get reminders", async () => {
    const page = await open("https://shop.test/fixtures/dynamic.html");
    await page.waitForTimeout(300);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0);
    await page.click("#add");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt=marked]");
    // Over http, so the password fields in this page get reminders (on https they stay quiet).
    await page.goto("http://shop.test/fixtures/spa.html");
    await page.click("#draw");
    await page.waitForSelector("input[type=password][data-shouldnt-wouldnt=marked]");
    await page.click("#replace");
    await page.waitForSelector("input[type=password][data-shouldnt-wouldnt=marked]");
    assert.equal(await page.locator(".shouldnt-wouldnt-host").count(), 1);
    await page.close();
  });

  test("open and closed shadow roots in custom elements are scanned", async () => {
    // Over http, so every sensitive kind in these sections warns, including email and password.
    const page = await open("http://shop.test/fixtures/perf/lazy-components.html");
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-lazy-done"));
    await page.waitForTimeout(400);
    const inOpenRoot = await page.evaluate(() => {
      const input = document.querySelector("open-card").shadowRoot.querySelector("input");
      return input.getAttribute("data-shouldnt-wouldnt");
    });
    assert.equal(inOpenRoot, "marked");
    const notes = await inspectNotes(page);
    assert.equal(notes.length >= 9, true, `expected a note per sensitive field, got ${notes.length}`);
    await page.close();
  });

  test("on https, email, password, and phone stay quiet; over http they get reminders", async () => {
    const page = await open("https://shop.test/fixtures/email-phone.html");
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0, "email and phone on https");
    await page.goto("https://shop.test/fixtures/password.html");
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0, "password on https");
    await page.goto("http://shop.test/fixtures/email-phone.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await page.goto("http://shop.test/fixtures/password.html");
    await page.waitForSelector("input[type=password][data-shouldnt-wouldnt=marked]");
    await page.close();
  });

  test("maiden names, security answers, and license plates get reminders; the question drop-down does not", async () => {
    const page = await open("https://shop.test/fixtures/account-recovery.html");
    await page.waitForSelector("#plate[data-shouldnt-wouldnt=marked]");
    await page.waitForTimeout(300);
    for (const id of ["maiden", "answer", "plate"]) assert.equal(await marked(page, `#${id}`), true, id);
    for (const id of ["question", "email", "password"]) assert.equal(await marked(page, `#${id}`), false, id);
    await page.close();
  });

  test("a note sits below the field's own box or row, never inside it", async () => {
    const page = await open("https://shop.test/fixtures/wrapped-fields.html");
    await page.waitForSelector("#routing[data-shouldnt-wouldnt=marked]");
    await page.waitForTimeout(400);
    const layout = await page.evaluate(() => {
      const rect = (el) => el.getBoundingClientRect();
      const box = document.getElementById("card-box");
      const pair = document.getElementById("pair");
      const afterBox = box.nextElementSibling;
      return {
        noteAfterBox: !!afterBox?.classList.contains("shouldnt-wouldnt-host"),
        noteInsideBox: !!box.querySelector(".shouldnt-wouldnt-host"),
        cardFillsBox: rect(document.getElementById("card")).width >= rect(box).width - 30,
        noteAboveButton: rect(afterBox).bottom <= rect(document.getElementById("continue")).top + 1,
        notesAfterPair: [pair.nextElementSibling, pair.nextElementSibling?.nextElementSibling].every((el) =>
          el?.classList.contains("shouldnt-wouldnt-host"),
        ),
        noteInsidePair: !!pair.querySelector(".shouldnt-wouldnt-host"),
        pairOnOneRow: Math.abs(rect(document.getElementById("bank")).top - rect(document.getElementById("routing")).top) < 1,
      };
    });
    assert.deepEqual(layout, {
      noteAfterBox: true,
      noteInsideBox: false,
      cardFillsBox: true,
      noteAboveButton: true,
      notesAfterPair: true,
      noteInsidePair: false,
      pairOnOneRow: true,
    });
    const notes = await inspectNotes(page);
    assert.match(notes[1].texts.join(" "), /bank account number/, "notes that share a row keep the fields' order");
    assert.match(notes[2].texts.join(" "), /routing number/);
    await page.waitForTimeout(1500);
    const summary = await summaryFor("https://shop.test/fixtures/wrapped-fields.html*");
    assert.equal(summary.reminderHidden, false, "notes that share a row are not mistaken for notes the page removed");
    await page.close();
  });
});

describe("masking", () => {
  test("sensitive numbers show as dots, other fields are untouched, and values are unchanged", async () => {
    const page = await open("https://shop.test/fixtures/masking.html");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    assert.equal(await textSecurity(page, "#ssn"), "disc");
    assert.equal(await textSecurity(page, "#card"), "disc");
    assert.equal(await textSecurity(page, "#bank"), "disc");
    assert.equal(await textSecurity(page, "#email"), "none");
    assert.equal(await textSecurity(page, "#comments"), "none");
    assert.equal(await page.$eval("#password", (el) => el.type), "password");
    assert.equal(await page.$eval("#ssn", (el) => el.type), "text");
    await page.click("#ssn");
    await page.keyboard.type(SYNTHETIC.ssn);
    // The test reads the value from the page's own world to prove masking did not change it.
    assert.equal(await page.$eval("#ssn", (el) => el.value), SYNTHETIC.ssn);
    await page.close();
  });

  test("Show reveals and Hide masks again, with names a screen reader can use", async () => {
    const page = await open("https://shop.test/fixtures/masking.html");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    let note = await noteFor(page, 0);
    const show = buttonNamed(note, /^Show what you typed/);
    assert.ok(show, `no Show button among ${note.buttonInfo.map((b) => b.name).join(", ")}`);
    await clickNode(page, show.backendNodeId);
    await page.waitForFunction(() => !document.getElementById("ssn").hasAttribute("data-shouldnt-wouldnt-mask"));
    assert.equal(await textSecurity(page, "#ssn"), "none");
    note = await noteFor(page, 0);
    const hide = buttonNamed(note, /^Hide what you typed/);
    assert.ok(hide);
    await clickNode(page, hide.backendNodeId);
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    assert.equal(await textSecurity(page, "#ssn"), "disc");
    await page.close();
  });

  test("the keyboard reaches Show from the field without a mouse", async () => {
    const page = await open("https://shop.test/fixtures/masking.html");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    await page.focus("#ssn");
    await page.keyboard.press("Tab");
    const onHost = await page.evaluate(() => document.activeElement?.classList.contains("shouldnt-wouldnt-host"));
    assert.equal(onHost, true, "Tab from the field should land on the reminder's first button");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => !document.getElementById("ssn").hasAttribute("data-shouldnt-wouldnt-mask"));
    await page.close();
  });

  test("paste, programmatic fill (as autofill does), and validation work on a masked field", async () => {
    await browser.ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://shop.test" });
    const page = await open("https://shop.test/fixtures/validation.html");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    await page.evaluate((text) => navigator.clipboard.writeText(text), "900-00-00");
    await page.focus("#ssn");
    await page.keyboard.press("Control+V");
    assert.equal(await page.$eval("#ssn", (el) => el.value), "900-00-00");
    assert.equal(await page.$eval("#ssn", (el) => el.checkValidity()), false);
    await page.click("button[value=save]");
    assert.equal(page.url().includes("#sent"), false, "the browser's own validation should still block an invalid value");
    await page.$eval("#ssn", (el, text) => {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, SYNTHETIC.ssn);
    assert.equal(await textSecurity(page, "#ssn"), "disc");
    await page.click("button[value=delete]");
    await page.waitForURL(/#sent/);
    const url = new URL(page.url());
    assert.equal(url.searchParams.get("ssn"), SYNTHETIC.ssn, "the site must receive exactly what was entered");
    assert.equal(url.searchParams.get("action"), "delete");
    await page.close();
  });

  test("a React controlled input keeps working while masked", async () => {
    const page = await open("https://shop.test/fixtures/perf/react-app.html");
    await page.click("#go-signup");
    await page.waitForSelector("input[name=ssn][data-shouldnt-wouldnt-mask=on]");
    await page.click("input[name=ssn]");
    await page.keyboard.type("900000001");
    await page.click("input[name=book]");
    await page.keyboard.type("abc");
    await page.waitForFunction(() => document.body.textContent.includes("Characters typed: 12"));
    assert.equal(await page.$eval("input[name=ssn]", (el) => el.value), "900000001");
    await page.click("button[type=submit]");
    await page.waitForFunction(() => document.getElementById("submitted").textContent === "Submitted: 1");
    await page.click("#go-checkout");
    await page.waitForSelector("input[name=card][data-shouldnt-wouldnt-mask=on]");
    await page.close();
  });

  test("Dismiss removes the note, the mark, and the mask, and they stay away on that page", async () => {
    const page = await open("https://shop.test/fixtures/masking.html");
    await page.waitForSelector("#ssn[data-shouldnt-wouldnt-mask=on]");
    const before = (await inspectNotes(page)).length;
    const note = await noteFor(page, 0);
    await clickNode(page, buttonNamed(note, /^Dismiss/).backendNodeId);
    await page.waitForFunction(() => !document.getElementById("ssn").hasAttribute("data-shouldnt-wouldnt"));
    assert.equal(await textSecurity(page, "#ssn"), "none");
    assert.equal((await inspectNotes(page)).length, before - 1);
    await page.$eval("#ssn", (el) => el.setAttribute("placeholder", "changed"));
    await page.waitForTimeout(400);
    assert.equal(await page.$eval("#ssn", (el) => el.hasAttribute("data-shouldnt-wouldnt")), false);
    await page.close();
  });
});

describe("accessibility", () => {
  test("the note is not read as part of the field's name, and the field carries a description", async () => {
    const page = await open("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const info = await accessibleInfo(page, "#ssn");
    assert.equal(info.name, "Social Security number");
    assert.match(info.description, /appears to be asking for your Social Security number/);
    await page.close();
  });

  test("reminder buttons have clear names and expose expanded state", async () => {
    const page = await open("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const note = await noteFor(page, 0);
    const names = note.buttonInfo.map((b) => b.name);
    assert.deepEqual(names, ["Show what you typed in this field", "Why am I seeing this?", "Dismiss this reminder"]);
    const why = buttonNamed(note, /^Why/);
    assert.equal(why.expanded, false);
    await clickNode(page, why.backendNodeId);
    assert.equal(buttonNamed(await noteFor(page, 0), /^Why/).expanded, true);
    await page.close();
  });

  test("a note for a field that is not masked shows no empty Show button", async () => {
    // Over http, so the password and email fields get (unmasked) reminders.
    const page = await open("http://shop.test/fixtures/masking.html");
    await page.waitForSelector("#email[data-shouldnt-wouldnt=marked]");
    const notes = await inspectNotes(page);
    for (const pattern of [/asking for your password/, /asks for your email address/]) {
      const note = notes.find((candidate) => candidate.texts.some((text) => pattern.test(text)));
      const shown = note.buttonInfo.filter((info) => info.box).map((info) => info.name);
      assert.deepEqual(shown, ["Why am I seeing this?", "Dismiss this reminder"], String(pattern));
    }
    await page.close();
  });

  test("reminders never take focus on their own", async () => {
    const page = await browser.ctx.newPage();
    await page.setContent("<!doctype html><title>x</title>");
    await page.goto("https://shop.test/fixtures/perf/lazy-components.html");
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-lazy-done"));
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    await page.close();
  });
});

describe("site notes and paused submits", () => {
  test("on a long http page the site note appears next to the field and a paused submit brings it into view", async () => {
    const page = await open("http://shop.test/fixtures/long-page.html");
    await page.waitForSelector("#password[data-shouldnt-wouldnt=marked]");
    await page.focus("#password");
    await page.waitForFunction(() => document.querySelectorAll(".shouldnt-wouldnt-host").length === 2);
    const placement = await page.evaluate(() => {
      const label = document.getElementById("password").closest("label");
      const note = label.nextElementSibling;
      const panel = note?.nextElementSibling;
      return {
        noteAfterLabel: !!note?.classList.contains("shouldnt-wouldnt-host"),
        panelAfterNote: !!panel?.classList.contains("shouldnt-wouldnt-host"),
        panelTop: Math.round(panel.getBoundingClientRect().top + scrollY),
        pageTop: Math.round(document.body.firstElementChild.getBoundingClientRect().top + scrollY),
      };
    });
    assert.equal(placement.noteAfterLabel, true);
    assert.equal(placement.panelAfterNote, true, "the site note sits right after the field's note, not at the top of the page");
    assert.equal(placement.panelTop > 1500, true);
    await page.click("#submit");
    await page.waitForTimeout(200);
    assert.equal(page.url().includes("#signed-in"), false);
    const focus = await page.evaluate(() => {
      const active = document.activeElement;
      const rect = active?.getBoundingClientRect();
      return { onHost: !!active?.classList.contains("shouldnt-wouldnt-host"), visible: !!rect && rect.top >= 0 && rect.bottom <= innerHeight };
    });
    assert.deepEqual(focus, { onHost: true, visible: true });
    const notes = await inspectNotes(page);
    const panel = notes.find((note) => note.buttonInfo.some((b) => b.name === "Continue Anyway"));
    await clickNode(page, panel.buttonInfo.find((b) => b.name === "Continue Anyway").backendNodeId);
    await page.waitForURL(/#signed-in/);
    assert.equal(new URL(page.url()).searchParams.get("go"), "sign-in", "the pressed button's value must be submitted");
    await page.close();
  });

  test("country sites of a brand get no lookalike note, and a brand-plus-login host does", async () => {
    // A real country site over https gives no reason to warn about a password at all.
    const quiet = await open("https://www.amazon.com.au/fixtures/password.html");
    await quiet.waitForTimeout(600);
    await quiet.focus("input[type=password]");
    await quiet.waitForTimeout(300);
    assert.equal(await quiet.locator("[data-shouldnt-wouldnt]").count(), 0);
    assert.equal(await quiet.locator(".shouldnt-wouldnt-host").count(), 0);
    await quiet.close();
    const lookalike = await open("https://paypal-login.test/fixtures/password.html");
    await lookalike.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await lookalike.focus("input[type=password]");
    await lookalike.waitForFunction(() => document.querySelectorAll(".shouldnt-wouldnt-host").length === 2);
    await lookalike.close();
  });
});

describe("hostile pages", () => {
  test("a page that deletes the note every frame gets a few repairs, then the toolbar badge", async () => {
    const page = await open("https://shop.test/fixtures/perf/hostile.html?seconds=3");
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-hostile-done"), null, { timeout: 15_000 });
    const removed = Number(await page.evaluate(() => document.documentElement.getAttribute("data-hostile-removed")));
    assert.equal(removed >= 5 && removed <= 7, true, `repairs should stop after five in a burst, page removed ${removed}`);
    assert.equal(await badgeFor("https://shop.test/fixtures/perf/hostile.html*"), "!");
    const summary = await summaryFor("https://shop.test/fixtures/perf/hostile.html*");
    assert.equal(summary.reminderHidden, true);
    await page.goto("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    assert.equal(await badgeFor("https://shop.test/fixtures/ssn.html*"), "", "the badge clears when the page goes away");
    await page.close();
  });

  test("a note covered by another element is noticed when the field gets focus", async () => {
    const page = await open("https://shop.test/fixtures/covered.html");
    await page.waitForSelector("#cover:not([hidden])");
    await page.focus("#ssn");
    await page.waitForTimeout(300);
    assert.equal(await badgeFor("https://shop.test/fixtures/covered.html*"), "!");
    await page.close();
  });

  test("a page stylesheet that tries to hide the note does not hide it", async () => {
    const page = await open("https://shop.test/fixtures/unusual-css.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const style = await page.$eval(".shouldnt-wouldnt-host", (host) => {
      const s = getComputedStyle(host);
      return { display: s.display, visibility: s.visibility, opacity: s.opacity, height: host.getBoundingClientRect().height > 0 };
    });
    assert.deepEqual(style, { display: "block", visibility: "visible", opacity: "1", height: true });
    await page.close();
  });
});

describe("popup and settings", () => {
  test("the popup describes the top page, not an embedded frame", async () => {
    const page = await open("http://shop.test/fixtures/frames.html");
    await page.waitForTimeout(800);
    for (let i = 0; i < 5; i += 1) {
      const summary = await summaryFor("http://shop.test/fixtures/frames.html*");
      assert.equal(summary.hostname, "shop.test");
      assert.equal(summary.sensitiveCount, 1);
    }
    const frameMarks = await page.frameLocator("iframe").locator("[data-shouldnt-wouldnt=marked]").count();
    assert.equal(frameMarks, 2, "the frame gets its own reminders");
    await page.close();
  });

  test("turning protection off survives a service-worker stop, new tabs, and rapid toggling", async () => {
    const page = await open("https://shop.test/fixtures/ssn.html");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    const popup = await browser.ctx.newPage();
    await popup.goto(popupUrl(browser.extensionId));
    const toggle = popup.locator("#protection-toggle");
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute("role"), "switch");
    assert.equal(await toggle.getAttribute("aria-checked"), "true");
    await toggle.focus();
    await toggle.press("Enter");
    await popup.waitForFunction(() => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === "false");
    assert.equal(await popup.evaluate(() => document.activeElement?.id), "protection-toggle", "focus stays on the switch");
    await page.waitForFunction(() => !document.querySelector("[data-shouldnt-wouldnt]"));

    await stopServiceWorker(browser.ctx);
    await page.reload();
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0, "still off after the worker stopped");
    const second = await open("https://shop.test/fixtures/bank.html");
    await second.waitForTimeout(600);
    assert.equal(await second.locator("[data-shouldnt-wouldnt]").count(), 0, "still off in a new tab");
    await popup.reload();
    await popup.waitForFunction(() => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === "false");

    for (let i = 0; i < 5; i += 1) {
      await popup.locator("#protection-toggle").click();
      await popup.waitForFunction(
        (expected) => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === expected,
        i % 2 === 0 ? "true" : "false",
      );
    }
    const worker = await currentWorker(browser.ctx);
    const stored = await worker.evaluate(() => chrome.storage.local.get("protectionEnabled"));
    assert.equal(stored.protectionEnabled, true, "five toggles from off ends on");
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await second.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await Promise.all([page.close(), second.close(), popup.close()]);
  });

  test("the saved choice survives a full browser restart", async () => {
    const popup = await browser.ctx.newPage();
    await popup.goto(popupUrl(browser.extensionId));
    await popup.locator("#protection-toggle[aria-checked=true]").click();
    await popup.waitForFunction(() => document.getElementById("protection-toggle")?.getAttribute("aria-checked") === "false");
    const { profile, extensionId } = browser;
    await browser.ctx.close();
    browser = await launch(SOURCE, { profile, extensionId });
    outside.push((await routeLocally(browser.ctx)).outside);
    const page = await open("https://shop.test/fixtures/ssn.html");
    await page.waitForTimeout(800);
    assert.equal(await page.locator("[data-shouldnt-wouldnt]").count(), 0, "off after restart");
    const reopened = await browser.ctx.newPage();
    await reopened.goto(popupUrl(browser.extensionId));
    await reopened.locator("#protection-toggle[aria-checked=false]").click();
    await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
    await Promise.all([page.close(), reopened.close()]);
  });

  test("no request left the local fixtures", () => {
    assert.deepEqual(outside.flat(), []);
  });
});
