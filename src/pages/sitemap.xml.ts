import type { APIRoute } from 'astro';
import { sitePages } from '../site/pages';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'https://ikeriza.com/').replace(/\/$/, '');
  const urls = sitePages
    .filter((p) => p.slug !== '404')
    .map((p) => `  <url><loc>${base}${p.slug === 'index' ? '/' : `/${p.slug}`}</loc></url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
