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

/** Split a title on line breaks for display ("Air\nTerra"). */
export const titleLines = (title: string) => title.trim().split('\n').map((l) => l.trim());
