import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { responseToWarning, shouldOfferStrongWarning, shouldPauseSubmit } from "../src/shared/decisions.js";
import { PRIVACY_BODY, PRIVACY_LIMIT, PRIVACY_TITLE, TAGLINE } from "../src/shared/disclaimer.js";
import { FieldBook } from "../src/shared/ledger.js";
import { initialProtectionEnabled, PROTECTION_STORAGE_KEY, protectionFromStored } from "../src/shared/protection.js";
import { statusFor } from "../src/shared/status.js";
import { PAGE_STATUS_LABEL } from "../src/shared/types.js";

describe("protection setting", () => {
  test("protection defaults to on and only a boolean setting is recognized", () => {
    assert.equal(initialProtectionEnabled(), true);
    assert.equal(protectionFromStored(undefined), true);
    assert.equal(protectionFromStored(null), true);
    assert.equal(protectionFromStored("false"), true);
    assert.equal(protectionFromStored(0), true);
    assert.equal(protectionFromStored({}), true);
    assert.equal(protectionFromStored(false), false);
    assert.equal(protectionFromStored(true), true);
    assert.equal(PROTECTION_STORAGE_KEY, "protectionEnabled");
    assert.equal(TAGLINE, "Think Twice Before You Share.");
    assert.equal(PRIVACY_TITLE, "Your Privacy Matters");
    assert.match(PRIVACY_BODY, /We don't read what you type into forms\./);
    assert.match(PRIVACY_LIMIT, /cannot guarantee/);
    assert.match(PRIVACY_LIMIT, /cannot stop a site that is trying to do that/);
  });
});

describe("field book", () => {
  test("claim, duplicate, dismiss, and clearActive", () => {
    const book = new FieldBook<object>();
    const field = {};
    assert.equal(book.claim(field), "new");
    assert.equal(book.claim(field), "duplicate");
    assert.equal(book.hasActive(field), true);
    book.dismiss(field);
    assert.equal(book.hasActive(field), false);
    book.clearActive();
    assert.equal(book.claim(field), "dismissed");
    assert.deepEqual(book.activeItems(), []);
  });
});

describe("submit and focus decisions", () => {
  test("pause only when a warned field meets an extra concern", () => {
    assert.equal(
      shouldPauseSubmit({ enabled: true, acknowledged: false, formHasWarnedField: true, concernCount: 1 }),
      true,
    );
    assert.equal(
      shouldPauseSubmit({ enabled: false, acknowledged: false, formHasWarnedField: true, concernCount: 1 }),
      false,
    );
    assert.equal(
      shouldPauseSubmit({ enabled: true, acknowledged: true, formHasWarnedField: true, concernCount: 1 }),
      false,
    );
    assert.equal(
      shouldPauseSubmit({ enabled: true, acknowledged: false, formHasWarnedField: false, concernCount: 1 }),
      false,
    );
    assert.equal(
      shouldPauseSubmit({ enabled: true, acknowledged: false, formHasWarnedField: true, concernCount: 0 }),
      false,
    );
  });

  test("a focus panel is offered once", () => {
    const base = {
      enabled: true,
      acknowledged: false,
      focusAlreadyShown: false,
      trigger: "focus" as const,
      fieldWarned: true,
      concernCount: 1,
    };
    assert.equal(shouldOfferStrongWarning(base), true);
    assert.equal(shouldOfferStrongWarning({ ...base, focusAlreadyShown: true }), false);
    assert.equal(shouldOfferStrongWarning({ ...base, trigger: "submit", focusAlreadyShown: true }), true);
  });

  test("warning responses", () => {
    assert.deepEqual(responseToWarning("go-back"), { acknowledge: true, resumeSubmit: false });
    assert.deepEqual(responseToWarning("continue"), { acknowledge: true, resumeSubmit: true });
    assert.deepEqual(responseToWarning("more"), { acknowledge: false, resumeSubmit: false });
  });
});

describe("page status", () => {
  test("four phrases", () => {
    assert.equal(PAGE_STATUS_LABEL.no_obvious_risks, "No obvious risks");
    assert.equal(PAGE_STATUS_LABEL.caution, "Caution recommended");
    assert.equal(PAGE_STATUS_LABEL.strong_concern, "Strongly indicated concern");
    assert.equal(PAGE_STATUS_LABEL.unable, "Unable to determine");
    assert.equal(statusFor({ protectionOn: false, scannable: true, sensitiveCount: 1, concernCount: 1 }), "unable");
    assert.equal(statusFor({ protectionOn: true, scannable: false, sensitiveCount: 0, concernCount: 0 }), "unable");
    assert.equal(statusFor({ protectionOn: true, scannable: true, sensitiveCount: 0, concernCount: 1 }), "strong_concern");
    assert.equal(statusFor({ protectionOn: true, scannable: true, sensitiveCount: 1, concernCount: 0 }), "caution");
    assert.equal(statusFor({ protectionOn: true, scannable: true, sensitiveCount: 0, concernCount: 0 }), "no_obvious_risks");
  });
});
