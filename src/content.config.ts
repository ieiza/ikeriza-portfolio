import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/content/loaders'; // Standard loader for Astro 5+

const projects = defineCollection({
    // Modern Astro 5+ loader looking inside src/content/projects/
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/projects" }),
    schema: z.object({
        title: z.string(),
        heroImage: z.string(),
        client: z.string().optional(),
        role: z.string().optional(),
        date: z.string().optional(),
        description: z.string().optional(),
        links: z.array(z.object({
            label: z.string(),
            url: z.string()
        })).optional(),
        // The matrix rules allowing 1, 2, 3, or 4 columns per element
        mediaGrid: z.array(z.object({
            type: z.enum(['image', 'video', 'placeholder']),
            src: z.string().optional(),
            title: z.string().optional(),
            span: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
        })).optional(),
    }),
});

export const collections = { projects };