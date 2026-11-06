// Loads the HTML files written by scripts/sync-site.mjs and splits each
// into the pieces SitePage.astro needs, after the clean-up in optimize.ts.
import { optimize } from './optimize';

const files = import.meta.glob('./pages/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface SitePageData {
  slug: string;
  htmlAttrs: Record<string, string>;
  bodyAttrs: Record<string, string>;
  head: string;
  body: string;
}

function decodeEntities(s: string) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function parseAttrs(src = ''): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [, name, dq, sq, bare] of src.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[name] = decodeEntities(dq ?? sq ?? bare ?? '');
  }
  return attrs;
}

function parse(slug: string, source: string): SitePageData {
  const html = optimize(source);
  const htmlTag = html.match(/<html\b([^>]*)>/i);
  const headM = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const bodyM = html.match(/<body\b([^>]*)>([\s\S]*)<\/body>/i);
  if (!htmlTag || !headM || !bodyM) throw new Error(`Unexpected HTML shape in ${slug}.html`);
  const htmlAttrs = parseAttrs(htmlTag[1]);
  delete htmlAttrs['data-wf-domain']; // tied to the old Webflow hosting
  return { slug, htmlAttrs, bodyAttrs: parseAttrs(bodyM[1]), head: headM[1], body: bodyM[2] };
}

export const sitePages: SitePageData[] = Object.entries(files).map(([path, html]) =>
  parse(path.replace(/^.*\/|\.html$/g, ''), html),
);

export function getSitePage(slug: string): SitePageData {
  const page = sitePages.find((p) => p.slug === slug);
  if (!page) throw new Error(`No page "${slug}"`);
  return page;
}
