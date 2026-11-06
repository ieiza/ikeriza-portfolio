// Share images (Open Graph / Twitter): one 1200x630 JPEG per page, cropped
// from the project's `ogImage`, hero image or cover, written to public/media/og/.
//
//   npm run og

import sharp from 'sharp';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets/images');
const OUT = join(ROOT, 'public/media/og');
mkdirSync(OUT, { recursive: true });

const field = (md, re) => (md.match(re) || [])[1];
const source = (path) => join(ASSETS, path.replace(/^\/media\//, ''));

const jobs = [
  ['home', '/media/6806f3bcea1b73b097048a26_EN-Display-Hor-Double-01.jpg'],
  ['about', field(readFileSync(join(ROOT, 'src/content/about.md'), 'utf8'), /^image: "([^"]+)"/m)],
];
const dir = join(ROOT, 'src/content/projects');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const md = readFileSync(join(dir, file), 'utf8');
  const src = field(md, /^ogImage: "([^"]+)"/m) ?? field(md, /^hero:\n  image: "([^"]+)"/m) ?? field(md, /^cover: "([^"]+)"/m);
  jobs.push([file.replace(/\.md$/, ''), src]);
}

for (const [name, src] of jobs) {
  await sharp(source(src), { animated: false })
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `${name}.jpg`));
  console.log(`og/${name}.jpg <- ${src}`);
}
