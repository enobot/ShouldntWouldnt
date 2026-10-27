import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const FORBIDDEN: RegExp[] = [
  /\.value\b/,
  /defaultValue/,
  /valueAs(Number|Date)/,
  /selectedOptions|selectedIndex/,
  /getAttribute(Node)?\(\s*["'`]value["'`]/,
  /\.innerText\b|\.outerText\b/,
  /FormData/,
  /keystrokes/,
  /addEventListener\(\s*["'`](input|beforeinput|change|keydown|keyup|keypress|paste|copy|cut|compositionupdate)["'`]/,
  /navigator\.clipboard|clipboardData|getSelection|execCommand/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /navigator\.sendBeacon/,
  /WebSocket/,
  /EventSource/,
  /RTCPeerConnection/,
  /new Image\b|\.src\s*=/,
  /importScripts/,
  /localStorage/,
  /sessionStorage/,
  /indexedDB/,
  /document\.cookie/,
  /analytics/,
  /innerHTML/,
  /outerHTML/,
  /insertAdjacentHTML/,
  /document\.write/,
  /\beval\s*\(/,
  /new Function/,
  /setTimeout\(\s*["'`]/,
  /\.reset\s*\(/,
  /history\.(push|replace)State/,
  /location\.(href|assign|replace)\s*=/,
  /chrome\.(history|cookies|webRequest|scripting|tabs\.executeScript|downloads|identity)/,
  /contentWindow/,
  /contentDocument/,
  /console\./,
  /stripe/i,
  /safebrowsing/i,
  /browser\.storage/,
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function sources(): string[] {
  const files = walk(join(root, "src")).filter((path) => path.endsWith(".ts"));
  files.push(join(root, "manifest.json"), join(root, "popup.html"), join(root, "popup.css"), join(root, "content.css"));
  return files;
}

describe("privacy source scan", () => {
  test("extension source does not read typed values, store form data, or call the network", () => {
    const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as {
      permissions?: string[];
      optional_permissions?: string[];
      content_security_policy?: { extension_pages?: string };
      web_accessible_resources?: unknown;
      externally_connectable?: unknown;
    };
    assert.deepEqual(manifest.permissions, ["storage"]);
    assert.equal(manifest.optional_permissions, undefined);
    assert.equal(manifest.web_accessible_resources, undefined);
    assert.equal(manifest.externally_connectable, undefined);
    const policy = manifest.content_security_policy?.extension_pages ?? "";
    assert.equal(policy.includes("unsafe-eval"), false);
    assert.equal(policy.includes("unsafe-inline"), false);
    assert.equal(/https?:/.test(policy), false);
    assert.equal(JSON.stringify(manifest).includes("unlimitedStorage"), false);
    for (const path of sources()) {
      const text = readFileSync(path, "utf8");
      for (const rule of FORBIDDEN) {
        assert.equal(rule.test(text), false, `${relative(root, path)} matches ${rule}`);
      }
    }
  });

  test("chrome.storage keeps only the on/off setting and the language choice, and only the worker writes them", () => {
    const allowed = new Set(["src/background/service-worker.ts", "src/content/controller.ts"]);
    for (const path of sources()) {
      const text = readFileSync(path, "utf8");
      const rel = relative(root, path).replaceAll("\\", "/");
      if (text.includes("chrome.storage") && !allowed.has(rel)) {
        assert.fail(`${rel} touches chrome.storage`);
      }
      assert.equal(/chrome\.storage\.(sync|session|managed)/.test(text), false, rel);
    }
    const worker = readFileSync(join(root, "src/background/service-worker.ts"), "utf8");
    const controller = readFileSync(join(root, "src/content/controller.ts"), "utf8");
    // One write in the whole extension, and its key can only be one of the two setting names.
    assert.equal((worker.match(/chrome\.storage\.local\.set/g) ?? []).length, 1);
    assert.match(worker, /chrome\.storage\.local\.set\(\{ \[key\]: value \}/);
    assert.match(worker, /key: typeof PROTECTION_STORAGE_KEY \| typeof LANGUAGE_STORAGE_KEY, value: boolean \| LanguageChoice/);
    assert.equal(/chrome\.storage\.local\.set/.test(controller), false);
    assert.equal((controller.match(/chrome\.storage\.local\.get\(/g) ?? []).length, 1);
    assert.match(controller, /chrome\.storage\.local\.get\(\[PROTECTION_STORAGE_KEY, LANGUAGE_STORAGE_KEY\]/);
    assert.match(controller, /chrome\.storage\.onChanged\.addListener/);
  });

  test("masking changes presentation only", () => {
    const controller = readFileSync(join(root, "src/content/controller.ts"), "utf8");
    assert.match(controller, /-webkit-text-security/);
    assert.equal(/\.type\s*=(?!=)|setAttribute\(\s*["'`]type["'`]/.test(controller), false, "masking must not change the field type");
  });
});
