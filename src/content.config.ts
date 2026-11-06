import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Paths are site-relative, e.g. "/media/abc_photo.jpg" (files live in public/media/).
const path = z.string().startsWith('/');

/** One cell in a media row. Exactly one of image / video / lottie / slides / model. */
const item = z.union([
  z.object({
    image: path,
    alt: z.string().default(''),
    /** Show the whole image on a coloured background instead of filling the cell. */
    contain: z.boolean().optional(),
    background: z.string().optional(),
    padding: z.string().optional(),
  }).strict(),
  z.object({
    /** Looping, muted background video (MP4). A matching .webm and poster are picked up automatically. */
    video: path,
    vertical: z.boolean().optional(),
    filter: z.string().optional(),
    background: z.string().optional(),
  }).strict(),
  z.object({
    lottie: path,
    background: z.string().optional(),
    padding: z.string().optional(),
  }).strict(),
  z.object({
    /** Images shown as an auto-advancing slideshow. */
    slides: z.array(path).min(2),
    alt: z.string().default(''),
  }).strict(),
  z.object({
    /** 3D model (.glb) shown with <model-viewer>. */
    model: path,
    cameraOrbit: z.string().optional(),
    cameraTarget: z.string().optional(),
  }).strict(),
]);

const row = z.union([
  z.object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    /** Shorter 1-column row. */
    short: z.boolean().optional(),
    items: z.array(item).min(1),
  }).strict(),
  z.object({
    /** Full video with the site's own player: a looping preview with a big PLAY button. */
    player: z.object({
      src: path,
      poster: path.optional(),
      preview: path,
      title: z.string(),
      background: z.string().default('#000000'),
    }).strict(),
  }).strict(),
]);

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    /** Browser tab / search result title. */
    title: z.string(),
    /** Search and share description. */
    description: z.string().optional(),
    ogImage: path.optional(),
    /** Position in the home page list (and the "Next" order). */
    order: z.number().int(),
    /** Title in the home page list; a line break splits it onto two lines. */
    menuTitle: z.string(),
    /** Full-screen image shown behind the title in the home page list. */
    cover: path,
    heroTitle: z.string(),
    hero: z.union([
      z.object({ image: path, alt: z.string().default('') }).strict(),
      z.object({ video: path }).strict(),
    ]),
    /** Heading above the description (the body of this file). */
    heading: z.string(),
    creditsHeading: z.string().default('Details'),
    /** Credits; blank lines separate groups. */
    credits: z.string(),
    rows: z.array(row),
  }),
});

export const collections = { projects };
export type Item = z.infer<typeof item>;
export type Row = z.infer<typeof row>;
