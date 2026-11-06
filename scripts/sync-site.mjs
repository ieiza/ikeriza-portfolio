// Mirrors the live Webflow site into this repo so it can be served without Webflow.
//
//   node scripts/sync-site.mjs
//
// - Crawls every internal page starting from "/" (plus the 404 page).
// - Downloads every asset hosted by Webflow (CSS, JS, images, video, Lottie, fonts)
//   into public/media/, including assets referenced from inside CSS and JS files.
// - Rewrites the page HTML to point at those local copies and writes it to
//   src/site/pages/<slug>.html, which src/components/SitePage.astro renders.
//
// Safe to re-run: existing asset files are skipped, pages are overwritten.

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const SITE = 'https://www.ikeriza.com';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES_DIR = join(ROOT, 'src/site/pages');
const ASSET_DIR = join(ROOT, 'public/media');
const ASSET_PREFIX = '/media/';

// Hosts whose files disappear (or may) once the Webflow plan is cancelled.
const WEBFLOW_HOSTS = [
  'cdn.prod.website-files.com',
  'assets.website-files.com',
  'uploads-ssl.webflow.com',
  'global-uploads.webflow.com',
  'd3e54v103j8qbb.cloudfront.net',
];
const hostAlt = WEBFLOW_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|');
// Stops at quotes, whitespace, angle brackets, commas (srcset / data-video-urls) and "&" (&quot;).
const ASSET_RE = new RegExp(`https?:(?://|%2F%2F)(?:${hostAlt})(?:/|%2F)[^"'\\s<>,&;{}\\\\]*`, 'gi');

const assetMap = new Map(); // original URL string -> local path
const usedLocal = new Set();

function cleanMatch(url) {
  // Drop an unbalanced trailing ")" from unquoted CSS url(...).
  while (url.endsWith(')') && (url.match(/\)/g) || []).length > (url.match(/\(/g) || []).length) {
    url = url.slice(0, -1);
  }
  return url.replace(/[.;]+$/, '');
}

function fullyDecode(s) {
  let prev;
  do {
    prev = s;
    try { s = decodeURIComponent(s); } catch { break; }
  } while (s !== prev);
  return s;
}

function localPathFor(url) {
  if (assetMap.has(url)) return assetMap.get(url);
  const u = new URL(fullyDecode(url));
  let path = u.pathname.replace(/^\/+/, '');
  path = path.replace(/^[0-9a-f]{24}\//, ''); // drop the Webflow site-id folder
  if (u.hostname === 'd3e54v103j8qbb.cloudfront.net') path = 'vendor/' + path.split('/').pop();
  path = path
    .split('/')
    .map((seg) => {
      seg = seg.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-(?=\.)/g, '');
      if (seg.length <= 120) return seg;
      // Keep long (e.g. non-Latin) names short and unique.
      const ext = extname(seg);
      return seg.slice(0, 80) + '-' + createHash('sha1').update(seg).digest('hex').slice(0, 10) + ext;
    })
    .join('/');
  let local = ASSET_PREFIX + path;
  for (let i = 2; usedLocal.has(local); i++) {
    const ext = extname(path);
    local = ASSET_PREFIX + path.slice(0, path.length - ext.length) + `-${i}` + ext;
  }
  usedLocal.add(local);
  assetMap.set(url, local);
  return local;
}

function rewriteAssets(text) {
  return text.replace(ASSET_RE, (m) => {
    const url = cleanMatch(m);
    return localPathFor(url) + m.slice(url.length);
  });
}

function slugFor(pathname) {
  const p = pathname.replace(/^\/+|\/+$/g, '');
  return p === '' ? 'index' : p;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'ikeriza-site-mirror' } });
  return { status: res.status, text: await res.text() };
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

// ---- 1. Crawl pages -------------------------------------------------------
const pages = new Map(); // slug -> html
const queue = ['/'];
const seen = new Set(queue);
while (queue.length) {
  const path = queue.shift();
  const { status, text } = await fetchText(SITE + path);
  if (status !== 200) { console.warn(`skip ${path} (${status})`); continue; }
  pages.set(slugFor(path), text);
  console.log(`page ${path}`);
  for (const [, href] of text.matchAll(/href="((?:https?:\/\/(?:www\.)?ikeriza\.com)?\/[^"#?]*)/gi)) {
    const p = href.replace(/^https?:\/\/(?:www\.)?ikeriza\.com/i, '') || '/';
    if (/\.[a-z0-9]{2,5}$/i.test(p) || seen.has(p)) continue;
    seen.add(p);
    queue.push(p);
  }
}
{
  const { text } = await fetchText(SITE + '/this-page-does-not-exist-404');
  pages.set('404', text);
  console.log('page 404');
}

// ---- 2. Rewrite pages, collect assets -------------------------------------
await mkdir(PAGES_DIR, { recursive: true });
for (const [slug, html] of pages) {
  let out = rewriteAssets(html);
  // Internal links become root-relative so they work on any domain (incl. Vercel previews).
  out = out.replace(/(<a\b[^>]*?\bhref=")https?:\/\/(?:www\.)?ikeriza\.com(\/[^"]*)?"/gi,
    (_, pre, p) => `${pre}${p || '/'}"`);
  await writeFile(join(PAGES_DIR, `${slug}.html`), out);
}

// ---- 3. Download assets (and assets referenced inside CSS/JS) --------------
const done = new Set();
let totalBytes = 0;
const failures = [];
while (true) {
  const pending = [...assetMap.entries()].filter(([u]) => !done.has(u));
  if (!pending.length) break;
  for (const [url, local] of pending) {
    done.add(url);
    const file = join(ASSET_DIR, local.slice(ASSET_PREFIX.length));
    const isText = /\.(css|js|json|svg)$/i.test(local);
    if (await exists(file) && !isText) continue;
    const src = fullyDecode(url).replace(/ /g, '%20');
    const res = await fetch(src);
    if (!res.ok) { failures.push(`${res.status} ${src}`); continue; }
    let buf = Buffer.from(await res.arrayBuffer());
    if (isText) buf = Buffer.from(rewriteAssets(buf.toString('utf8'))); // may enqueue more assets
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, buf);
    totalBytes += buf.length;
    console.log(`asset ${local} (${(buf.length / 1e6).toFixed(1)} MB)`);
  }
}

await writeFile(join(ROOT, 'src/site/asset-map.json'),
  JSON.stringify(Object.fromEntries(assetMap), null, 2));
console.log(`\n${pages.size} pages, ${assetMap.size} assets, ${(totalBytes / 1e6).toFixed(0)} MB downloaded`);
if (failures.length) console.log('FAILED:\n' + failures.join('\n'));
