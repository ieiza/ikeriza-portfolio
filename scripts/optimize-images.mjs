// Image pipeline: turns the originals in assets/images/ into the responsive
// AVIF + WebP files the site serves from public/media/img/, and writes
// src/data/images.json, which components/Picture.astro reads.
//
//   npm run images            # process new or changed originals
//   npm run images -- --force # rebuild everything
//
// Content keeps referring to images by their original name ("/media/photo.jpg");
// the manifest maps that name to the generated files.

import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/images');
const OUT = join(ROOT, 'public/media/img');
const MANIFEST = join(ROOT, 'src/data/images.json');
const force = process.argv.includes('--force');

const WIDTHS = [480, 800, 1200, 1600, 2400];
const AVIF = { quality: 52, effort: 4, chromaSubsampling: '4:2:0' };
const WEBP = { quality: 80, effort: 4, smartSubsample: true };

mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(MANIFEST), { recursive: true });

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const manifest = {};
const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f)).sort();

async function processFile(file) {
  const input = join(SRC, file);
  const key = `/media/${file}`;
  const { name } = parse(file);
  const mtime = Math.round(statSync(input).mtimeMs);
  const meta = await sharp(input, { animated: true }).metadata();
  const animated = (meta.pages ?? 1) > 1;
  const width = meta.width;
  const height = animated ? meta.pageHeight : meta.height;

  const reuse = !force && previous[key]?.mtime === mtime;
  const entry = { width, height, mtime, animated, avif: [], webp: [] };

  if (animated) {
    // Animated GIF -> animated WebP at its own size (AVIF animation support is patchy).
    const out = `${name}.webp`;
    if (!reuse || !existsSync(join(OUT, out))) {
      await sharp(input, { animated: true }).webp({ quality: 75, effort: 4, loop: 0 }).toFile(join(OUT, out));
    }
    entry.webp.push([`/media/img/${out}`, width]);
  } else {
    const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))])];
    for (const w of widths) {
      for (const [fmt, opts] of [['avif', AVIF], ['webp', WEBP]]) {
        const out = `${name}-${w}.${fmt}`;
        if (!reuse || !existsSync(join(OUT, out))) {
          await sharp(input).rotate().resize({ width: w, withoutEnlargement: true })[fmt](opts).toFile(join(OUT, out));
        }
        entry[fmt].push([`/media/img/${out}`, w]);
      }
    }
  }
  manifest[key] = entry;
}

// Small worker pool; sharp also multithreads internally.
const queue = [...files];
let done = 0;
const workers = Array.from({ length: Math.max(2, Math.floor(cpus().length / 2)) }, async () => {
  while (queue.length) {
    const file = queue.shift();
    try {
      await processFile(file);
    } catch (err) {
      console.error(`failed: ${file}: ${err.message}`);
    }
    if (++done % 25 === 0 || done === files.length) console.log(`${done}/${files.length}`);
  }
});
await Promise.all(workers);

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');
console.log(`manifest: ${Object.keys(sorted).length} images`);
