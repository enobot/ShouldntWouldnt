import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyField } from "../src/shared/detect.js";
import type { FieldSnapshot } from "../src/shared/types.js";
import { field } from "./helpers.js";

function expectWarn(snapshot: FieldSnapshot, category: string): void {
  const result = classifyField(snapshot);
  assert.equal(result.warn, true, JSON.stringify(snapshot));
  assert.equal(result.category, category);
}

function expectQuiet(snapshot: FieldSnapshot): void {
  assert.equal(classifyField(snapshot).warn, false, JSON.stringify(snapshot));
}

describe("real-world field roles", () => {
  test("login and registration fields", () => {
    expectWarn(field({ type: "password", autocomplete: "current-password", labelText: "Password" }), "password");
    expectWarn(field({ type: "password", autocomplete: "new-password", labelText: "Create a password" }), "password");
    expectWarn(field({ type: "email", name: "email", labelText: "Email", autocomplete: "email" }), "email");
    expectWarn(field({ type: "tel", name: "phone", labelText: "Mobile phone" }), "phone");
    expectQuiet(field({ name: "username", labelText: "Username", autocomplete: "username" }));
    expectQuiet(field({ name: "full_name", labelText: "Full name", autocomplete: "name" }));
  });

  test("payment, identity, and ordinary text", () => {
    expectWarn(field({ autocomplete: "cc-number", labelText: "Card number" }), "card");
    expectWarn(field({ name: "cvv", labelText: "Security code" }), "cvv");
    expectWarn(field({ name: "ssn", labelText: "Social Security number" }), "ssn");
    expectQuiet(field({ autocomplete: "cc-name", labelText: "Name on card" }));
    expectQuiet(field({ autocomplete: "cc-exp", labelText: "Expiration" }));
    expectQuiet(field({ tag: "textarea", type: "textarea", name: "comment", labelText: "Comments" }));
    expectQuiet(field({ tag: "textarea", type: "textarea", name: "message", labelText: "Leave a comment" }));
    expectQuiet(field({ type: "search", name: "q", labelText: "Search" }));
  });

  test("known misses and a known extra warning", () => {
    expectQuiet(field({ nearbyText: "Social Security number" }));
    expectQuiet(field({ labelText: "Social" }));
    expectQuiet(field({ name: "maiden", labelText: "Mother's maiden name" }));
    expectWarn(field({ labelText: "Account number" }), "bank");
  });
});
