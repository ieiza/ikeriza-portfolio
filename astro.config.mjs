// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ikeriza.com',
  // Start loading a page when its link is hovered or tapped.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: {
    // The CSS is small (~12 KB), so inline it and skip a render-blocking request.
    inlineStylesheets: 'always',
  },
});
