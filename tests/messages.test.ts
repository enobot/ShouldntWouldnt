import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isExtensionPageSender,
  isWebPageSender,
  parseEnabledState,
  parseIncoming,
  parseLanguageState,
  parsePageSummary,
} from "../src/shared/messages.js";

const SUMMARY = {
  ok: true,
  protection: true,
  hostname: "example.com",
  scheme: "https",
  sensitiveCount: 0,
  concernCount: 0,
  status: "no_obvious_risks",
  reminderHidden: false,
};

describe("messages", () => {
  test("language messages carry only a known language choice", () => {
    assert.deepEqual(parseIncoming({ type: "sw/getLanguage" }), { type: "sw/getLanguage" });
    assert.deepEqual(parseIncoming({ type: "sw/setLanguage", language: "es" }), { type: "sw/setLanguage", language: "es" });
    assert.deepEqual(parseIncoming({ type: "sw/setLanguage", language: "auto" }), { type: "sw/setLanguage", language: "auto" });
    assert.equal(parseIncoming({ type: "sw/setLanguage", language: "xx" }), null);
    assert.equal(parseIncoming({ type: "sw/setLanguage", language: "es", value: "secret" }), null);
    assert.equal(parseIncoming({ type: "sw/getLanguage", language: "es" }), null);
    assert.deepEqual(parseLanguageState({ ok: true, type: "sw/languageState", language: "ar" }), {
      ok: true,
      type: "sw/languageState",
      language: "ar",
    });
    assert.equal(parseLanguageState({ ok: true, type: "sw/languageState", language: "ar", extra: 1 }), null);
  });

  test("only plain checked messages are accepted", () => {
    assert.deepEqual(parseIncoming({ type: "sw/getEnabled" }), { type: "sw/getEnabled" });
    assert.deepEqual(parseIncoming({ type: "sw/setEnabled", enabled: false }), {
      type: "sw/setEnabled",
      enabled: false,
    });
    assert.equal(parseIncoming({ type: "sw/setEnabled", enabled: false, value: "secret" }), null);
    assert.equal(parseIncoming({ type: "sw/setEnabled", enabled: "false" }), null);
    assert.equal(parseIncoming(Object.create({ type: "sw/getEnabled" })), null);
    assert.equal(parseIncoming({ type: "sw/getEnabled", extra: true }), null);
    assert.equal(parseIncoming(["sw/getEnabled"]), null);
    assert.equal(parseIncoming("sw/getEnabled"), null);
    assert.deepEqual(parseEnabledState({ ok: true, type: "sw/enabledState", enabled: true }), {
      ok: true,
      type: "sw/enabledState",
      enabled: true,
    });
    assert.equal(isExtensionPageSender("chrome-extension://abc/popup.html", "chrome-extension://abc/popup.html"), true);
    assert.equal(isExtensionPageSender("chrome-extension://abc/popup.html#x", "chrome-extension://abc/popup.html"), true);
    assert.equal(isExtensionPageSender("chrome-extension://abc/other.html", "chrome-extension://abc/popup.html"), false);
    assert.equal(isExtensionPageSender("chrome-extension://abc/popup.html.evil", "chrome-extension://abc/popup.html"), false);
    assert.equal(isExtensionPageSender("https://example.com/", "chrome-extension://abc/popup.html"), false);
    assert.equal(isExtensionPageSender(undefined, "chrome-extension://abc/popup.html"), false);
  });

  test("hidden-reminder notices carry nothing but their type", () => {
    assert.deepEqual(parseIncoming({ type: "page/reminderHidden" }), { type: "page/reminderHidden" });
    assert.deepEqual(parseIncoming({ type: "page/left" }), { type: "page/left" });
    assert.equal(parseIncoming({ type: "page/reminderHidden", url: "https://example.com/" }), null);
    assert.equal(parseIncoming({ type: "page/reminderHidden", text: "anything" }), null);
    assert.equal(isWebPageSender("https://example.com/a", 4), true);
    assert.equal(isWebPageSender("chrome-extension://abc/popup.html", 4), false);
    assert.equal(isWebPageSender("https://example.com/a", undefined), false);
    assert.equal(isWebPageSender("https://example.com/a", -1), false);
  });

  test("page summaries are exact and small", () => {
    assert.deepEqual(parsePageSummary(SUMMARY), SUMMARY);
    assert.equal(parsePageSummary({ ...SUMMARY, url: "https://example.com" }), null);
    assert.equal(parsePageSummary({ ...SUMMARY, reminderHidden: "no" }), null);
    const { reminderHidden: _dropped, ...withoutFlag } = SUMMARY;
    void _dropped;
    assert.equal(parsePageSummary(withoutFlag), null);
    assert.equal(parsePageSummary({ ...SUMMARY, sensitiveCount: -1 }), null);
    assert.equal(parsePageSummary({ ...SUMMARY, hostname: "a".repeat(254) }), null);
  });
});
