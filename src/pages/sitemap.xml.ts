// sitemap.xml with image entries, so project images can be found in Google Images.
import type { APIRoute } from 'astro';
import { getProjects, type Project } from '../lib/projects';
import { imageSet } from '../lib/media';
import { frontmatter as about } from '../content/about.md';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Every still image on a project page (hero + media rows), as served WebP URLs. */
function projectImages(p: Project): string[] {
  const srcs: string[] = [];
  if ('image' in p.data.hero) srcs.push(p.data.hero.image);
  for (const row of p.data.rows) {
    if ('player' in row) continue;
    for (const item of row.items) {
      if ('image' in item) srcs.push(item.image);
      if ('slides' in item) srcs.push(...item.slides);
    }
  }
  return [...new Set(srcs)].map((src) => imageSet(src, 1600).src);
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'https://www.ikeriza.com/').replace(/\/$/, '');
  const projects = await getProjects();
  const pages: { path: string; images: string[] }[] = [
    { path: '/', images: projects.map((p) => imageSet(p.data.cover, 1600).src) },
    { path: '/about', images: [imageSet(about.image, 1600).src] },
    ...projects.map((p) => ({ path: `/${p.id}`, images: projectImages(p) })),
  ];
  const urls = pages
    .map(({ path, images }) => {
      const imgs = [...new Set(images)]
        .map((src) => `\n    <image:image><image:loc>${esc(base + src)}</image:loc></image:image>`)
        .join('');
      return `  <url>\n    <loc>${base}${path}</loc>${imgs}\n  </url>`;
    })
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
