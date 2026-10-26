import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  MAX_REPAIR_BURST,
  REPAIR_BURST_MS,
  consumeRepair,
  freshRepairBudget,
} from "../src/shared/reminder-guard.js";

describe("reminder repair budget", () => {
  test("a short burst stops, and a quiet gap allows another repair", () => {
    let budget = freshRepairBudget();
    const start = 1_000;
    for (let i = 0; i < MAX_REPAIR_BURST; i += 1) {
      const result = consumeRepair(budget, start + i);
      assert.equal(result.allow, true);
      budget = result.budget;
    }
    const blocked = consumeRepair(budget, start + 50);
    assert.equal(blocked.allow, false);
    assert.equal(blocked.budget.used, MAX_REPAIR_BURST);
    const during = consumeRepair(blocked.budget, start + REPAIR_BURST_MS - 1);
    assert.equal(during.allow, false);
    const later = consumeRepair(blocked.budget, start + REPAIR_BURST_MS);
    assert.equal(later.allow, true);
    assert.equal(later.budget.used, 1);
  });
});
