// Captures the Chrome Web Store screenshots (1280×800) and small promo tile (440×280) into store/assets/.
// Run `npm run build` first. Every screenshot is the built extension running in Playwright's Chromium on a
// sample page from store/assets/pages/ (made-up sites under the reserved .example domain, synthetic values
// only). Pages are served through request routing, so nothing reaches the network.
// The images are written as 24-bit PNGs (no alpha channel), which the store dashboard asks for.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { clickNode, currentWorker, inspectNotes, launch, ROOT, SYNTHETIC } from "../tests/browser/harness.mjs";

const PAGES = join(ROOT, "store", "assets", "pages");
const OUT = join(ROOT, "store", "assets");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png" };

// 800×500 CSS pixels at a device scale of 1.6 is 1280×800, and the text stays readable when the store
// shows the screenshot smaller.
const SHOT = { viewport: { width: 800, height: 500 }, deviceScaleFactor: 1.6 };

/** In-memory captures that the popup composite page loads from /capture/. */
const captures = new Map();

async function serve(ctx) {
  const outside = [];
  await ctx.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol !== "http:" && url.protocol !== "https:") return route.continue();
    const name = url.pathname.slice(1);
    let body = null;
    if (captures.has(name)) body = captures.get(name);
    else if (/^icons\/icon\d+\.png$/.test(name)) body = readFileSync(join(ROOT, name));
    else if (/^[a-z-]+\.(html|css)$/.test(name)) body = readFileSync(join(PAGES, name));
    if (body) return route.fulfill({ status: 200, contentType: TYPES[extname(name)], body });
    if (url.pathname === "/favicon.ico") return route.fulfill({ status: 204, body: "" });
    outside.push(url.href);
    return route.abort();
  });
  return outside;
}

/** Re-encodes a PNG as 8-bit RGB without an alpha channel, composited over white. */
function toRgbPng(png) {
  let at = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (at < png.length) {
    const length = png.readUInt32BE(at);
    const type = png.toString("ascii", at + 4, at + 8);
    const data = png.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || (data[9] !== 6 && data[9] !== 2) || data[12] !== 0) throw new Error("unexpected PNG format");
      if (data[9] === 2) return png;
    }
    if (type === "IDAT") idat.push(data);
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? rgba[y * stride + x - bpp] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upLeft = x >= bpp && y > 0 ? rgba[(y - 1) * stride + x - bpp] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      rgba[y * stride + x] = value & 0xff;
    }
  }
  const rgb = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = y * stride + x * 4;
      const to = y * (width * 3 + 1) + 1 + x * 3;
      const alpha = rgba[from + 3] / 255;
      for (let c = 0; c < 3; c += 1) rgb[to + c] = Math.round(rgba[from + c] * alpha + 255 * (1 - alpha));
    }
  }
  const crcTable = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
  });
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    let crc = -1;
    for (const byte of Buffer.concat([head.subarray(4), data])) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE((crc ^ -1) >>> 0, 0);
    return Buffer.concat([head, data, tail]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rgb, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function save(name, png, width, height) {
  const rgb = toRgbPng(png);
  if (rgb.readUInt32BE(16) !== width || rgb.readUInt32BE(20) !== height) {
    throw new Error(`${name} is ${rgb.readUInt32BE(16)}×${rgb.readUInt32BE(20)}, expected ${width}×${height}`);
  }
  writeFileSync(join(OUT, name), rgb);
  console.log(`  ${name} ${width}×${height}`);
}

async function marked(page, url) {
  await page.goto(url);
  await page.waitForSelector("[data-shouldnt-wouldnt=marked]");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function button(page, pattern, index = 0) {
  const notes = await inspectNotes(page);
  const found = notes[index]?.buttonInfo.find((info) => pattern.test(info.name));
  if (!found) throw new Error(`No button matching ${pattern}`);
  return found;
}

mkdirSync(OUT, { recursive: true });
console.log("Store screenshots:");
const browser = await launch(ROOT, SHOT);
const outside = await serve(browser.ctx);
try {
  const reminder = await browser.ctx.newPage();
  await marked(reminder, "https://benefits.example/reminder.html");
  save("screenshot-1-reminder.png", await reminder.screenshot(), 1280, 800);

  const masking = await browser.ctx.newPage();
  await marked(masking, "https://creditunion.example/masking.html");
  await masking.fill("#bank", SYNTHETIC.bank);
  await masking.fill("#ssn", SYNTHETIC.ssn);
  await masking.locator("h2").click();
  await masking.waitForTimeout(200);
  save("screenshot-2-masking.png", await masking.screenshot(), 1280, 800);

  const why = await browser.ctx.newPage();
  await marked(why, "https://clinic.example/why.html");
  await clickNode(why, (await button(why, /^Why am I seeing this\?$/)).backendNodeId);
  await why.waitForTimeout(200);
  save("screenshot-3-why.png", await why.screenshot(), 1280, 800);

  const site = await browser.ctx.newPage();
  await marked(site, "http://bookshop.example/site-note.html");
  await site.fill("#card", SYNTHETIC.card);
  await site.click("#pay");
  await site.waitForTimeout(300);
  if (site.url().includes("#paid")) throw new Error("the http checkout was not paused");
  save("screenshot-4-site-note.png", await site.screenshot(), 1280, 800);

  // The toolbar popup cannot be captured in headless Chromium, so popup.html is opened in a tab of the
  // same window and the sample page is made the active tab before it loads. The popup's own code then asks
  // that page for its summary, exactly as it does when opened from the toolbar.
  const popup = await browser.ctx.newPage();
  await popup.goto(`chrome-extension://${browser.extensionId}/popup.html`);
  const worker = await currentWorker(browser.ctx);
  await worker.evaluate(async () => {
    const [target] = await chrome.tabs.query({ url: "https://benefits.example/reminder.html" });
    const [self] = await chrome.tabs.query({ url: `chrome-extension://${chrome.runtime.id}/popup.html` });
    if (self.windowId !== target.windowId) await chrome.tabs.move(self.id, { windowId: target.windowId, index: -1 });
    await chrome.tabs.update(target.id, { active: true });
  });
  await popup.reload();
  await popup.waitForFunction(() => document.body.innerText.includes("benefits.example"));
  const popupHeight = await popup.evaluate(() => {
    // Cut before the privacy section, which the person scrolls to in the real popup.
    let bottom = 0;
    for (const child of document.querySelector("#app").children) {
      if (child.tagName === "H2") break;
      bottom = child.getBoundingClientRect().bottom;
    }
    return Math.ceil(bottom + 14);
  });
  captures.set("capture/popup.png", await popup.screenshot({ clip: { x: 0, y: 0, width: 320, height: popupHeight } }));
  captures.set("capture/page.png", await reminder.locator("main.site").screenshot());
  const composite = await browser.ctx.newPage();
  await composite.goto("https://benefits.example/popup.html");
  await composite.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
  save("screenshot-5-popup.png", await composite.screenshot(), 1280, 800);
} finally {
  await browser.close();
}

console.log("Small promo tile:");
const plain = await launch(null, { viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
outside.push(...(await serve(plain.ctx)));
try {
  const tile = await plain.ctx.newPage();
  await tile.goto("https://shouldnt-wouldnt.example/promo-tile.html");
  await tile.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]));
  save("small-promo-tile.png", await tile.screenshot(), 440, 280);
} finally {
  await plain.close();
}

if (outside.length) throw new Error(`Unexpected requests: ${outside.join(", ")}`);
console.log("STORE_ASSETS_OK");
