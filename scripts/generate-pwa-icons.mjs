// Generates PWA icons (192 / 512 / maskable-512) as solid-indigo PNGs with a
// white "M" glyph. No image lib — raw PNG encoding via Node zlib.
// Re-run: `node scripts/generate-pwa-icons.mjs`. Output → public/.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

const BG = [0x4f, 0x46, 0xe5]; // indigo #4f46e5 (matches favicon)
const FG = [0xff, 0xff, 0xff];

// CRC32 (PNG spec)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// distance from point to segment (for M diagonals)
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function isM(x, y, S) {
  const p = S * 0.26; // padding
  const w = S * 0.13; // stroke width
  const top = p, bot = S - p;
  const left = p, right = S - p;
  const midX = S / 2, midY = S * 0.6;
  // vertical bars
  if (y >= top && y <= bot && x >= left && x <= left + w) return true;
  if (y >= top && y <= bot && x >= right - w && x <= right) return true;
  // two diagonals of the M's V (top-left→mid, mid→top-right)
  const h = w / 2;
  if (distToSeg(x, y, left + w / 2, top, midX, midY) <= h) return true;
  if (distToSeg(x, y, right - w / 2, top, midX, midY) <= h) return true;
  return false;
}

function makePng(S, maskable) {
  // maskable: keep glyph inside ~80% safe zone → shrink glyph by using larger padding (isM already inset)
  const raw = Buffer.alloc((S * 3 + 1) * S);
  let o = 0;
  for (let y = 0; y < S; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < S; x++) {
      const on = isM(x, y, S);
      const c = on ? FG : BG;
      raw[o++] = c[0];
      raw[o++] = c[1];
      raw[o++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  // 10,11,12 = 0 (compression/filter/interlace)
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  ['pwa-192.png', 192, false],
  ['pwa-512.png', 512, false],
  ['pwa-maskable-512.png', 512, true],
];
for (const [name, size, maskable] of targets) {
  writeFileSync(join(OUT, name), makePng(size, maskable));
  console.log(`✓ ${name} (${size}x${size})`);
}
