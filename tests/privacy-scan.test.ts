import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const FORBIDDEN: RegExp[] = [
  /\.value\b/,
  /FormData/,
  /keystrokes/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /navigator\.sendBeacon/,
  /WebSocket/,
  /EventSource/,
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
  /\.reset\s*\(/,
  /history\.(push|replace)State/,
  /location\.(href|assign|replace)\s*=/,
  /chrome\.history/,
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
      content_security_policy?: { extension_pages?: string };
    };
    assert.deepEqual(manifest.permissions, ["storage"]);
    const policy = manifest.content_security_policy?.extension_pages ?? "";
    assert.equal(policy.includes("unsafe-eval"), false);
    assert.equal(policy.includes("unsafe-inline"), false);
    assert.equal(JSON.stringify(manifest).includes("unlimitedStorage"), false);
    for (const path of sources()) {
      const text = readFileSync(path, "utf8");
      for (const rule of FORBIDDEN) {
        assert.equal(rule.test(text), false, `${relative(root, path)} matches ${rule}`);
      }
    }
  });

  test("chrome.storage keeps only the local on/off setting", () => {
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
    assert.match(worker, /chrome\.storage\.local\.get\(PROTECTION_STORAGE_KEY/);
    assert.match(worker, /chrome\.storage\.local\.set\(\{ \[PROTECTION_STORAGE_KEY\]: next \}/);
    assert.equal(/chrome\.storage\.local\.(get|set)/.test(controller), false);
    assert.match(controller, /chrome\.storage\.onChanged\.addListener/);
  });
});
