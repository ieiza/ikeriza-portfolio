// Encodes the full-length videos played by the site's own video player
// (these used to be hosted on Vimeo) into web-ready H.264 MP4 + a poster JPEG.
//
//   npm run videos            # encode anything missing
//   npm run videos -- --force # re-encode everything
//
// macOS only: uses the built-in `avconvert` encoder and a small Swift script,
// so no ffmpeg install is needed. Sources live in the shared assets folder.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = process.env.ASSETS_DIR || join(ROOT, '../../01 Webflow Assets');
const OUT = join(ROOT, 'public/media/video');
const force = process.argv.includes('--force');

// name -> source file (relative to the assets folder) and the second used for the poster.
const VIDEOS = {
  candor: { src: 'Sabadell/Values/BS-Spot-English-01.mp4', poster: 3 },
  'solvia-oportunidades': { src: 'Sabadell/Solvia/BS-Sol-Spot-00.mp4', poster: 4 },
  'solvia-patitas': { src: 'Sabadell/Solvia/BS-Sol-Spot-01.mp4', poster: 5 },
  'solvia-humo': { src: 'Sabadell/Solvia/BS-Sol-Spot-03.mp4', poster: 6 },
};

mkdirSync(OUT, { recursive: true });
for (const [name, { src, poster }] of Object.entries(VIDEOS)) {
  const input = join(ASSETS, src);
  const mp4 = join(OUT, `${name}.mp4`);
  const webp = join(OUT, `${name}.webp`);
  if (!existsSync(input)) { console.warn(`missing source for ${name}: ${input}`); continue; }
  if (force || !existsSync(mp4)) {
    // Preset1920x1080 = H.264/AAC, fast-start (moov atom first) so playback starts while downloading.
    execFileSync('avconvert', ['-s', input, '-p', 'Preset1920x1080', '-o', mp4, '--replace'], { stdio: 'ignore' });
  }
  if (force || !existsSync(webp)) {
    const jpg = join(OUT, `${name}.jpg`);
    execFileSync('swift', [join(ROOT, 'scripts/poster-frame.swift'), mp4, jpg, String(poster), '1600'], { stdio: 'ignore' });
    await sharp(jpg).webp({ quality: 80 }).toFile(webp);
    rmSync(jpg);
  }
  console.log(`${name}: ${(statSync(mp4).size / 1e6).toFixed(1)} MB video, ${(statSync(webp).size / 1e3).toFixed(0)} KB poster`);
}
