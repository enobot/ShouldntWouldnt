import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FIELD_COPY, HTTP_HEADLINE, whyText } from "../src/shared/copy.js";

describe("reminder copy", () => {
  test("the Social Security sentence is exact", () => {
    assert.equal(
      FIELD_COPY.ssn,
      "Sensitive Information: This website is requesting your Social Security number. Only share this information with organizations you trust.",
    );
  });

  test("explanations say typing is not read", () => {
    assert.match(whyText("password", []), /We do not read what you type\./);
    assert.match(whyText("password", ["http-page"]), new RegExp(HTTP_HEADLINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
