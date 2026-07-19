import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

// Define the portfolio project schema structure
const projects = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/projects" }),
    schema: z.object({
        title: z.string(),
        client: z.string().optional(),
        category: z.string(),
        heroImage: z.string().optional(),
        videoUrl: z.string().url().optional(),
        layoutClass: z.string().optional(),
    })
});

// Export the portfolio collection schema for Astro mapping hooks
export const collections = { projects };
