import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyField } from "../src/shared/detect.js";
import { field } from "./helpers.js";

describe("field detection", () => {
  test("a license key is not a driver's license", () => {
    assert.equal(classifyField(field({ labelText: "License key" })).warn, false);
    assert.equal(classifyField(field({ labelText: "Driver's license number" })).category, "drivers-license");
  });

  test("nearby text alone stays under the warning line", () => {
    const result = classifyField(field({ nearbyText: "Enter your Social Security number" }));
    assert.equal(result.warn, false);
    assert.equal(result.confidence < 0.7, true);
  });

  test("sign-in codes are not card security codes", () => {
    assert.equal(classifyField(field({ labelText: "Security code", autocomplete: "one-time-code" })).warn, false);
    assert.equal(classifyField(field({ labelText: "Enter the security code we sent to your phone" })).warn, false);
    assert.equal(classifyField(field({ labelText: "Security code", autocomplete: "cc-csc" })).category, "cvv");
  });

  test("a site that already hides an SSN in a password box still gets the SSN wording", () => {
    assert.equal(classifyField(field({ type: "password", labelText: "Social Security number" })).category, "ssn");
    assert.equal(classifyField(field({ type: "password", labelText: "Password" })).category, "password");
    assert.equal(classifyField(field({ type: "password", placeholder: "SSN" })).category, "password");
  });

  test("drop-down lists and search boxes do not get number warnings", () => {
    assert.equal(classifyField(field({ tag: "select", type: "select", labelText: "Do you receive Social Security benefits?" })).warn, false);
    assert.equal(classifyField(field({ type: "search", placeholder: "Search by SSN or card number" })).warn, false);
    assert.equal(classifyField(field({ tag: "select", type: "select", labelText: "Health plan" })).category, "health");
  });

  test("everyday labels for an address are recognized", () => {
    for (const labelText of ["Home address", "Billing address", "Shipping address", "Mailing address"]) {
      assert.equal(classifyField(field({ labelText })).category, "address", labelText);
    }
    for (const labelText of ["Email address", "IP address", "Wallet address", "Website address"]) {
      assert.equal(classifyField(field({ labelText })).category === "address", false, labelText);
    }
  });
});
