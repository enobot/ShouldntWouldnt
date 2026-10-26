import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isExtensionPageSender, parseEnabledState, parseIncoming, parsePageSummary } from "../src/shared/messages.js";

describe("messages", () => {
  test("only plain checked messages are accepted", () => {
    assert.deepEqual(parseIncoming({ type: "sw/getEnabled" }), { type: "sw/getEnabled" });
    assert.deepEqual(parseIncoming({ type: "sw/setEnabled", enabled: false }), {
      type: "sw/setEnabled",
      enabled: false,
    });
    assert.equal(parseIncoming({ type: "sw/setEnabled", enabled: false, value: "secret" }), null);
    assert.equal(parseIncoming(Object.create({ type: "sw/getEnabled" })), null);
    assert.equal(parseIncoming({ type: "sw/getEnabled", extra: true }), null);
    assert.deepEqual(parseEnabledState({ ok: true, type: "sw/enabledState", enabled: true }), {
      ok: true,
      type: "sw/enabledState",
      enabled: true,
    });
    assert.equal(parsePageSummary({ ok: true, protection: true, hostname: "example.com", scheme: "https", sensitiveCount: 0, concernCount: 0, status: "no_obvious_risks", url: "https://example.com" }), null);
    assert.equal(isExtensionPageSender("chrome-extension://abc/popup.html", "chrome-extension://abc/"), true);
    assert.equal(isExtensionPageSender("https://example.com/", "chrome-extension://abc/"), false);
  });
});
