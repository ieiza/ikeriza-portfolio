import type { APIRoute } from 'astro';
import { getProjects } from '../lib/projects';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'https://ikeriza.com/').replace(/\/$/, '');
  const paths = ['/', '/about', ...(await getProjects()).map((p) => `/${p.id}`)];
  const urls = paths.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
