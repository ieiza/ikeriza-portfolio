# ikeriza.com

Portfolio site for Iker Iza, built with [Astro](https://astro.build) and hosted on Vercel.

## Commands

| Command | What it does |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server at `localhost:4321` |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | Type-check and validate content |
| `npm run videos` | Encode the player videos (macOS; see below) |

Pushing to `main` deploys to production; other branches get a Vercel preview link.

## Where things live

```
src/
  content/projects/*.md   one file per project (see "Adding a project")
  content/about.md        About page text
  pages/                  index (home), about, [slug] (project template), 404, sitemap
  components/             Nav, Footer, MediaItem, Picture, BackgroundVideo, VideoPlayer
  scripts/                site.ts (nav, lazy video, home list, slideshow), lottie.ts, models.ts, player.ts
  styles/global.css       all site styles
public/media/             images, videos, Lottie, 3D models
```

## Adding or editing a project

Each project is a Markdown file in `src/content/projects/`. The text below the
`---` block is the description; everything else is in the front matter:

```yaml
title: "Acumen"                 # browser tab / search title
description: "…"                # optional search & share text
order: 6                        # position on the home page (also sets "Next")
menuTitle: "Acumen"             # home page title; use a line break to split it
cover: "/media/cover.jpg"       # full-screen image behind the home page title
heroTitle: "Acumen"
hero:
  image: "/media/hero.jpg"      # or  video: "/media/hero.mp4"
heading: "Acumen"
credits: |
  Web Design & Development

  Client: Acumen
rows:
  - columns: 2                  # 1, 2, 3 or 4
    items:
      - image: "/media/a.jpg"
      - video: "/media/b.mp4"   # looping, muted
  - player:                     # full video with the site's own player
      src: "/media/video/film.mp4"
      poster: "/media/video/film.jpg"
      preview: "/media/film-loop.mp4"
      title: "Film"
      background: "#c09760"
```

Other item types: `lottie`, `slides` (slideshow), `model` (3D `.glb`), and
`contain` / `background` / `padding` for images on a coloured card. `npm run check`
reports any mistake in a project file.

## Video player

Full-length videos are self-hosted (no Vimeo) and played by
`src/components/VideoPlayer.astro`: a looping preview with a big **PLAY**, a small
**II** to pause, and a mono control bar (time, seek, sound, full screen).
Keyboard: Space/K, ←/→, M, F.

`npm run videos` encodes the source files listed in `scripts/encode-videos.mjs`
into web-ready MP4s and poster frames in `public/media/video/`, using macOS's
built-in `avconvert` (no ffmpeg needed).

## Fonts

`obviously` / `obviously-wide` come from Adobe Fonts kit `lmi7yvo` — the kit's
domain list must include every domain the site is served from (production and
Vercel previews). Victor Mono is bundled via `@fontsource/victor-mono`.
