import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

/** Projects in home page order. */
export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}

/** The project after this one in home page order, wrapping around. */
export function nextProject(projects: Project[], current: Project): Project {
  const i = projects.findIndex((p) => p.id === current.id);
  return projects[(i + 1) % projects.length];
}

/**
 * A search-snippet description from the project's own text: whole sentences
 * from the start, up to about 160 characters.
 */
export function excerpt(markdown: string, max = 160): string {
  const text = markdown.replace(/[*_`#>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  out = out.trim() || text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return out;
}

/** Split a title on line breaks for display ("Air\nTerra"). */
export const titleLines = (title: string) => title.trim().split('\n').map((l) => l.trim());
