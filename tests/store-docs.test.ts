import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SHORT =
  "Think Twice Before You Share. Free local reminders when a page asks for sensitive information. Nothing you type leaves the browser.";

function read(name: string): string {
  return readFileSync(join(root, name), "utf8");
}

describe("store documents", () => {
  test("the policy, terms, and listing match this version", () => {
    const privacy = read("store/privacy-policy.md");
    const terms = read("store/terms.md");
    const support = read("store/support.md");
    const detailed = read("store/listing-detailed.md");
    const short = read("store/listing-short.md");
    const checklist = read("store/submission-checklist.md");
    for (const text of [privacy, terms, support]) {
      assert.match(text, /support@shouldntwouldnt\.com/);
    }
    assert.match(privacy, /protectionEnabled/);
    assert.match(privacy, /chrome\.storage\.local/);
    assert.match(privacy, /does not read field values/);
    assert.match(privacy, /Social Security number/);
    assert.match(privacy, /cannot guarantee that every website is safe/);
    assert.match(privacy, /cannot stop a site that is trying to do that/);
    assert.match(privacy, /storage` permission is used only to remember the on\/off setting/);
    assert.match(terms, /does not promise that a website is safe/);
    assert.match(terms, /hide, cover, or remove a reminder/);
    assert.equal(SHORT.length <= 132, true);
    assert.equal(short.includes(SHORT), true);
    assert.match(detailed, /does not read what you type/);
    assert.match(detailed, /saved in this browser profile/);
    assert.match(checklist, /1280×800/);
    const published = `${privacy}\n${terms}\n${detailed}\n${support}`;
    assert.equal(/turns back on by itself/i.test(published), false);
    assert.equal(/no support email/i.test(published), false);
    assert.equal(/completely secure/i.test(published), false);
  });
});
