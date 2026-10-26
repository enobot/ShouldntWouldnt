import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { domainToUnicode } from "node:url";
import { collectConcerns, unicodeHostname } from "../src/shared/signals.js";

function concerns(pageUrl: string, hostname: string, actions: Array<string | null> = []): string[] {
  return collectConcerns({ pageUrl, hostname, sensitiveFormActions: actions });
}

describe("local site signals", () => {
  test("http page and http form action", () => {
    assert.deepEqual(concerns("http://example.com/pay", "example.com"), ["http-page"]);
    assert.deepEqual(concerns("https://example.com/pay", "example.com", ["http://example.com/post"]), ["http-form"]);
    assert.deepEqual(concerns("https://example.com/pay", "example.com", ["#done"]), []);
  });

  test("lookalikes are narrow", () => {
    assert.deepEqual(concerns("https://paypal.com/", "paypal.com"), []);
    assert.deepEqual(concerns("https://www.google.com/", "www.google.com"), []);
    assert.deepEqual(concerns("https://notpaypal.example/", "notpaypal.example"), []);
    assert.deepEqual(concerns("https://paypal-login.com/", "paypal-login.com"), ["lookalike"]);
    assert.deepEqual(concerns("https://paypa1.com/", "paypa1.com"), ["lookalike"]);
    assert.deepEqual(concerns("https://paypal.com.evil.example/", "paypal.com.evil.example"), ["lookalike"]);
    const mixed = `p${String.fromCodePoint(0x0430)}ypal.com`;
    assert.deepEqual(concerns(`https://${mixed}/`, mixed), ["lookalike"]);
  });

  test("punycode matches Node for the labels we decode", () => {
    for (const host of ["xn--e1afmkfd.xn--p1ai", "paypal.com", "xn--80ak6aa92e.com"]) {
      assert.equal(unicodeHostname(host), domainToUnicode(host).toLowerCase());
    }
  });
});
