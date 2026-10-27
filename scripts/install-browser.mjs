// Downloads Playwright's Chromium into .cache/ms-playwright, where the browser tests look for it.
// Branded Google Chrome ignores --load-extension, so the tests use this Chrome for Testing build.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(root, ".cache", "ms-playwright") };
const cli = join(root, "node_modules", "playwright", "cli.js");
const result = spawnSync(process.execPath, [cli, "install", "chromium"], { stdio: "inherit", env });
process.exit(result.status ?? 1);
