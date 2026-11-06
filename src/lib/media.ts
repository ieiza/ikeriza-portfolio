// Build-time helpers for files in public/media/.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(process.cwd(), 'public');
const mediaFiles = new Set(readdirSync(join(PUBLIC, "media")).map((f: string) => `/media/${f}`));
const has = (path: string) => mediaFiles.has(path) || existsSync(join(PUBLIC, path));

const WIDTHS = [500, 800, 1080, 1600, 2000, 2600, 3200];

/**
 * srcset from the resized copies Webflow generated next to each image
 * (photo.jpg -> photo-p-500.jpg, photo-p-800.jpg, ...).
 */
export function srcset(src: string): string | undefined {
  const dot = src.lastIndexOf('.');
  const base = src.slice(0, dot);
  const ext = src.slice(dot);
  const variants = WIDTHS.filter((w) => has(`${base}-p-${w}${ext}`)).map((w) => `${base}-p-${w}${ext} ${w}w`);
  return variants.length ? variants.join(', ') : undefined;
}

/** Image `sizes` for a cell in a row with this many columns. */
export function sizesFor(columns: number): string {
  return columns <= 1 ? '100vw' : `${Math.ceil(100 / columns)}vw`;
}

/**
 * Sources for a looping background video. Webflow stored each upload as
 * "<name>-transcode.mp4" with a matching "-transcode.webm" and "-poster-00001.jpg".
 */
export function videoSources(mp4: string) {
  const stem = mp4.replace(/-transcode\.mp4$/, '').replace(/\.mp4$/, '');
  const webm = [`${stem}-transcode.webm`, `${stem}.webm`].find(has);
  const poster = [`${stem}-poster-00001.jpg`, `${stem}.jpg`].find(has);
  return { mp4, webm, poster };
}
