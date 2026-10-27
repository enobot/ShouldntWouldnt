import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { shouldMask } from "../src/shared/masking.js";

describe("visual masking choice", () => {
  test("high-sensitivity numbers in single-line text inputs are masked", () => {
    for (const category of ["ssn", "card", "bank", "routing", "government-id", "passport", "drivers-license"] as const) {
      assert.equal(shouldMask(category, "INPUT", "text"), true, category);
    }
    assert.equal(shouldMask("ssn", "input", "tel"), true);
    assert.equal(shouldMask("card", "input", "number"), true);
  });

  test("passwords, card security codes, and milder categories are left alone", () => {
    assert.equal(shouldMask("password", "input", "password"), false);
    assert.equal(shouldMask("password", "input", "text"), false);
    assert.equal(shouldMask("cvv", "input", "text"), false);
    for (const category of ["email", "phone", "address", "dob", "health"] as const) {
      assert.equal(shouldMask(category, "input", "text"), false, category);
    }
  });

  test("controls where the CSS mask is unsupported or unpredictable are not modified", () => {
    assert.equal(shouldMask("ssn", "textarea", "textarea"), false);
    assert.equal(shouldMask("ssn", "select", "select"), false);
    assert.equal(shouldMask("ssn", "input", "email"), false);
    assert.equal(shouldMask("ssn", "input", "search"), false);
    assert.equal(shouldMask("ssn", "input", "password"), false);
  });
});
