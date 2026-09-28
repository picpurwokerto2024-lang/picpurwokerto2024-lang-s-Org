import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      const bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Color palette: Jimpitan Emerald & Royal Indigo / Gold
function jimpitanPainter(isMaskable = false) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;
    const cx = 0.5;
    const cy = 0.5;
    const dx = nx - cx;
    const dy = ny - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Background gradient: Rich Teal to Deep Emerald
    const bgR = Math.round(15 + ny * 10);
    const bgG = Math.round(118 - ny * 30);
    const bgB = Math.round(110 - ny * 30);

    if (!isMaskable && dist > 0.47) {
      // Rounded corner for regular icon
      const cornerDist = Math.max(Math.abs(nx - 0.5), Math.abs(ny - 0.5));
      if (dist > 0.49) return [0, 0, 0, 0];
    }

    // Celengan / Jar / Pouch Body
    // Central jar shape
    const jarY = ny - 0.52;
    const jarX = nx - 0.5;
    const jarDist = Math.sqrt(jarX * jarX * 1.3 + jarY * jarY * 1.1);

    // Gold coin floating at top
    const coinDx = nx - 0.5;
    const coinDy = ny - 0.32;
    const coinDist = Math.sqrt(coinDx * coinDx + coinDy * coinDy);

    // Coin
    if (coinDist < 0.13) {
      if (coinDist < 0.10) {
        // Inner coin star or symbol
        const innerCoin = Math.abs(coinDx) < 0.03 || Math.abs(coinDy) < 0.03;
        return [254, 240, 138, 255]; // Yellow gold
      }
      return [234, 179, 8, 255]; // Amber gold
    }

    // Jar / Pot
    if (jarDist < 0.28 && ny > 0.38 && ny < 0.76) {
      // Slit at top of jar
      if (Math.abs(jarX) < 0.08 && Math.abs(ny - 0.45) < 0.02) {
        return [15, 23, 42, 255]; // Dark slit
      }
      // Bamboo / Jimpitan ribs or pattern
      const rib = Math.sin(nx * 40) > 0.7;
      if (rib) {
        return [240, 253, 244, 255]; // Mint white rib
      }
      return [255, 255, 255, 255]; // White jar body
    }

    // Base stand
    if (Math.abs(jarX) < 0.18 && Math.abs(ny - 0.76) < 0.03) {
      return [254, 240, 138, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, jimpitanPainter(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, jimpitanPainter(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, jimpitanPainter(true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, jimpitanPainter(false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, jimpitanPainter(false)));

console.log('PWA icons created successfully!');
