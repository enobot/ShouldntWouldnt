import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyField, needsSiteConcern } from "../src/shared/detect.js";
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
    expectWarn(field({ labelText: "Account number" }), "bank");
  });

  test("account recovery and vehicle fields", () => {
    expectWarn(field({ name: "maiden", labelText: "Mother's maiden name" }), "maiden-name");
    expectWarn(field({ labelText: "What was the make of your first car?" }), "security-answer");
    expectWarn(field({ type: "password", labelText: "Security answer" }), "security-answer");
    expectWarn(field({ labelText: "License plate" }), "license-plate");
    expectQuiet(field({ tag: "select", type: "select-one", labelText: "Choose a security question" }));
    expectWarn(field({ labelText: "Driver's license number" }), "drivers-license");
  });

  test("drop-downs never get number, answer, password, email, or phone reminders", () => {
    expectQuiet(field({ tag: "select", type: "select-one", labelText: "Country code", autocomplete: "tel-country-code" }));
    expectQuiet(field({ tag: "select", type: "select-one", labelText: "Phone type" }));
    expectQuiet(field({ tag: "select", type: "select-one", labelText: "Mobile phone carrier", name: "phone" }));
  });

  test("email, password, and phone wait for a site concern; the rest do not", () => {
    for (const category of ["email", "password", "phone"] as const) assert.equal(needsSiteConcern(category), true, category);
    for (const category of ["ssn", "card", "bank", "maiden-name", "security-answer", "license-plate", "dob", "address", "health", "none"] as const) {
      assert.equal(needsSiteConcern(category), false, category);
    }
  });
});
