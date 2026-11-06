// Build-time helpers for media. Images are looked up in src/data/images.json,
// written by scripts/optimize-images.mjs from the originals in assets/images/.
import manifest from '../data/images.json';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Fail the build if a referenced file isn't in public/ (catches typos before deploy). */
export function assertPublicFile(path: string): string {
  if (!existsSync(join(process.cwd(), 'public', path))) throw new Error(`[media] missing file: public${path}`);
  return path;
}

type Variant = [path: string, width: number];
interface Entry {
  width: number;
  height: number;
  animated: boolean;
  avif: Variant[];
  webp: Variant[];
}
const images = manifest as unknown as Record<string, Entry>;

const toSrcset = (variants: Variant[]) => variants.map(([p, w]) => `${p} ${w}w`).join(', ');
const closest = (variants: Variant[], target: number) =>
  variants.reduce((best, v) => (Math.abs(v[1] - target) < Math.abs(best[1] - target) ? v : best))[0];

export interface ImageSet {
  src: string;
  avifSrcset?: string;
  webpSrcset?: string;
  width?: number;
  height?: number;
}

/**
 * Responsive sources for an image referenced by its original name
 * ("/media/photo.jpg"). Fails the build if it isn't in the manifest.
 */
export function imageSet(src: string, fallbackWidth = 1200): ImageSet {
  const entry = images[src];
  if (!entry) throw new Error(`[media] ${src} is not in src/data/images.json — add it to assets/images/ and run "npm run images"`);
  return {
    src: closest(entry.webp, fallbackWidth),
    avifSrcset: entry.avif.length ? toSrcset(entry.avif) : undefined,
    webpSrcset: entry.webp.length > 1 || !entry.animated ? toSrcset(entry.webp) : undefined,
    width: entry.width,
    height: entry.height,
  };
}

/** Image `sizes` for a cell in a row with this many columns. */
export function sizesFor(columns: number): string {
  return columns <= 1 ? '100vw' : `${Math.ceil(100 / columns)}vw`;
}

/**
 * Sources for a looping background video. Webflow stored each upload as
 * "<name>-transcode.mp4" with a poster frame "<name>-poster-00001.jpg"; the
 * poster is served from the image pipeline as WebP.
 */
export function videoSources(mp4: string) {
  const stem = mp4.replace(/-transcode\.mp4$/, '').replace(/\.mp4$/, '');
  const posterKey = [`${stem}-poster-00001.jpg`, `${stem}.jpg`].find((k) => images[k]);
  const poster = posterKey ? closest(images[posterKey].webp, 1280) : undefined;
  return { mp4: assertPublicFile(mp4), poster };
}
