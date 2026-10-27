import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FIELD_COPY, fieldDescription, HTTP_HEADLINE, MASK_LINE, whyText } from "../src/shared/copy.js";

describe("reminder copy", () => {
  test("the Social Security sentence is exact", () => {
    assert.equal(
      FIELD_COPY.ssn,
      "Sensitive Information: This website appears to be asking for your Social Security number. Only share this information with organizations you trust.",
    );
  });

  test("field sentences describe what the labels suggest, not a certainty about the site", () => {
    for (const sentence of Object.values(FIELD_COPY)) {
      assert.equal(/is requesting/.test(sentence), false, sentence);
      assert.equal(/\b(safe|scam|verified|legitimate|fraud)\b/i.test(sentence), false, sentence);
    }
  });

  test("explanations say typing is not read", () => {
    assert.match(whyText("password", []), /We do not read what you type\./);
    assert.match(whyText("password", ["http-page"]), new RegExp(HTTP_HEADLINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("masked fields explain that only the screen changes", () => {
    assert.match(whyText("ssn", [], true), /The website still receives what you enter\./);
    assert.equal(whyText("ssn", [], false).includes(MASK_LINE), false);
    assert.match(MASK_LINE, /Show/);
  });

  test("the screen-reader description carries the site concern", () => {
    assert.equal(fieldDescription("card", []), FIELD_COPY.card);
    assert.match(fieldDescription("card", ["http-page"]), /insecure connection/);
  });
});
