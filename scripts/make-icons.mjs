import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const iconsDir = join(dirname(dirname(fileURLToPath(import.meta.url))), "icons");

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
}

function png(size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  const radius = size * 0.22;
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const inset = Math.min(x, y, size - 1 - x, size - 1 - y);
      const outside = inset < 0;
      const corner =
        (x < radius && y < radius && (radius - x) ** 2 + (radius - y) ** 2 > radius ** 2) ||
        (x >= size - radius && y < radius && (x - (size - radius)) ** 2 + (radius - y) ** 2 > radius ** 2) ||
        (x < radius && y >= size - radius && (radius - x) ** 2 + (y - (size - radius)) ** 2 > radius ** 2) ||
        (x >= size - radius &&
          y >= size - radius &&
          (x - (size - radius)) ** 2 + (y - (size - radius)) ** 2 > radius ** 2);
      const index = y * stride + 1 + x * 4;
      if (outside || corner) {
        raw[index + 3] = 0;
        continue;
      }
      const band = Math.abs(y - size * 0.62) < Math.max(1, size * 0.06);
      raw[index] = band ? 0xff : 0x7a;
      raw[index + 1] = band ? 0xf7 : 0x24;
      raw[index + 2] = band ? 0xf7 : 0x30;
      raw[index + 3] = 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 32, 48, 128]) writeFileSync(join(iconsDir, `icon${size}.png`), png(size));
