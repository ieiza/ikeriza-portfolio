// Builds the nav logo sprite (public/media/logo-sprite.webp) from the frames of
// the original Lottie animation: 30 frames, resized to 2x their largest display
// size and stacked vertically. components/Nav.astro steps through it on hover.
//
//   node scripts/build-logo-sprite.mjs
//
// The source frames were removed after building; to rebuild, restore
// public/media/670738a026c2f09fcab17aef_logo-lottie_00000.json and
// public/media/lottie/670738a026c2f09fcab17aef_logo-lottie_00000/ from commit a6fa6c2.

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/media/670738a026c2f09fcab17aef_logo-lottie_00000.json');
const OUT = join(ROOT, 'public/media/logo-sprite.webp');
const WIDTH = 400; // nav logo shows at up to 200px wide

const anim = JSON.parse(readFileSync(SRC, 'utf8'));
const frames = anim.layers.filter((l) => l.ip < anim.op).sort((a, b) => a.ip - b.ip);
const height = Math.round((WIDTH * anim.h) / anim.w);

const tiles = await Promise.all(frames.map(async (layer, i) => {
  const asset = anim.assets.find((a) => a.id === layer.refId);
  const file = join(ROOT, 'public/media', asset.u, asset.p);
  const input = await sharp(file).resize(WIDTH, height).png().toBuffer();
  return { input, top: i * height, left: 0 };
}));

await sharp({ create: { width: WIDTH, height: height * frames.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(tiles)
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(OUT);

// The resting frame on its own, for devices without hover (they never animate).
await sharp(tiles[0].input).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT.replace('-sprite', '-frame'));

console.log(`${frames.length} frames of ${WIDTH}x${height} -> ${OUT} (+ logo-frame.webp)`);
