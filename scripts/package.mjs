// Builds the Chrome Web Store upload: release/shouldnt-wouldnt-<version>.zip
// Run `npm run build` first. Only the files the extension loads go in the zip: no tests, no
// TypeScript sources, no source maps, no store drafts, no node_modules.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.version !== pkg.version) {
  throw new Error(`manifest.json version ${manifest.version} does not match package.json ${pkg.version}`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/**
 * The service worker and popup are ES modules. Follows their relative imports so only modules they
 * load are packaged; the shared modules the content script uses are already bundled into dist/content.js.
 */
function modulesFrom(entry, found) {
  const path = join(root, entry);
  if (found.has(path)) return;
  if (!existsSync(path)) throw new Error(`Missing ${entry}. Run npm run build first.`);
  found.add(path);
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(/\b(?:import|export)\b[^"';]*?\bfrom\s*["'](\.{1,2}\/[^"']+)["']|\bimport\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    modulesFrom(relative(root, join(dirname(path), match[1] ?? match[2])), found);
  }
}

// The extension pages: the toolbar popup, and the welcome page that asks for a language after install.
const PAGES = ["popup.html", "welcome.html"];
const pageScripts = PAGES.flatMap((page) =>
  [...readFileSync(join(root, page), "utf8").matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]),
);
const modules = new Set();
for (const entry of [manifest.background.service_worker, ...pageScripts]) modulesFrom(entry, modules);

const files = [
  "manifest.json",
  ...PAGES,
  "popup.css",
  "welcome.css",
  "content.css",
  "dist/content.js",
  ...walk(join(root, "icons")).map((path) => relative(root, path)),
  ...[...modules].map((path) => relative(root, path)),
].map((path) => path.replaceAll("\\", "/"));

for (const path of files) {
  if (!existsSync(join(root, path))) throw new Error(`Missing ${path}. Run npm run build first.`);
  if (/\.(map|ts)$/.test(path) || path.includes("/tests/")) throw new Error(`Refusing to package ${path}`);
}
for (const icon of Object.values(manifest.icons ?? {})) {
  if (!files.includes(icon)) throw new Error(`Manifest icon ${icon} is not packaged`);
}
for (const script of manifest.content_scripts.flatMap((entry) => [...(entry.js ?? []), ...(entry.css ?? [])])) {
  if (!files.includes(script)) throw new Error(`Content script file ${script} is not packaged`);
}
if (!files.includes(manifest.background.service_worker)) throw new Error("Service worker is not packaged");

// A fixed timestamp keeps the zip byte-for-byte reproducible.
const DOS_TIME = 0;
const DOS_DATE = (2026 - 1980) << 9 | 1 << 5 | 1;
const locals = [];
const centrals = [];
let offset = 0;
for (const path of files.sort()) {
  const data = readFileSync(join(root, path));
  const packed = deflateRawSync(data, { level: 9 });
  const name = Buffer.from(path, "utf8");
  const checksum = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, name, packed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);
  offset += local.length + name.length + packed.length;
}
const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...locals, ...centrals, end]);

const outDir = join(root, "release");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `shouldnt-wouldnt-${manifest.version}.zip`);
writeFileSync(out, zip);
console.log(`Packaged ${files.length} files, ${zip.length} bytes`);
console.log(`sha256 ${createHash("sha256").update(zip).digest("hex")}`);
for (const path of files) console.log(`  ${path}`);
console.log(`PACKAGE_OK ${relative(root, out)}`);
