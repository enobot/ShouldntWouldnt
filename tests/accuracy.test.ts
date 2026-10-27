import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyField } from "../src/shared/detect.js";
import { ACCURACY_CASES } from "./accuracy-cases.js";
import { HOLDOUT_CASES } from "./accuracy-holdout.js";
import { measure } from "./accuracy-metrics.js";

describe("detection accuracy on labeled cases", () => {
  test("every labeled tuning case gets the right answer", () => {
    const report = measure(ACCURACY_CASES, classifyField);
    assert.deepEqual(report.misses, []);
  });

  test("held-out cases stay at or above the measured level", () => {
    const report = measure(HOLDOUT_CASES, classifyField);
    assert.equal(report.precision >= 0.95, true, `precision ${report.precision}`);
    assert.equal(report.recall >= 0.9, true, `recall ${report.recall}`);
    assert.equal(report.ambiguousOk, report.ambiguous);
  });

  test("no case id is reused", () => {
    const ids = [...ACCURACY_CASES, ...HOLDOUT_CASES].map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
