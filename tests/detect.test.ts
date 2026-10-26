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
});
