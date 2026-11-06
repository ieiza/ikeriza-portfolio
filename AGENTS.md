# ikeriza.com — notes for coding agents

Portfolio site for Iker Iza. Astro (static output) deployed on Vercel from
`main` (project `ieizas-projects/ikeriza-portfolio`); every branch gets a preview.

## Accounts — personal only

This is a personal project. Use only the personal accounts: GitHub `ieiza`,
Vercel scope `ieizas-projects`, git author `Iker Iza <hello@ikeriza.com>`.
Never use or change anything belonging to Fortus (the default `gh`/git
identity and the Vercel connector on this Mac may be the Fortus account —
check `gh auth status` and push with
`git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`).

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run check` — type-check + content schema (run before every PR)
- `npm run images` — originals in `assets/images/` → AVIF/WebP in `public/media/img/` + `src/data/images.json`
- `npm run og` — 1200×630 share images in `public/media/og/`
- `npm run videos` — encode player videos (macOS `avconvert`)

## Layout

- `src/content/projects/*.md` — one file per project (schema in `src/content.config.ts`)
- `src/pages/` — home, about, `[slug]` project template, 404, sitemap
- `src/components/` — Nav, Footer, MediaItem, Picture, BackgroundVideo, VideoPlayer
- `src/scripts/` — site.ts (nav, lazy video, home list, slideshow), lottie.ts, models.ts, player.ts
- `src/styles/global.css` — all site styles
- `assets/` — source images and 3D models (not deployed); `public/media/` — what's served

## Rules of thumb

- Reference images in content by their original name (`/media/photo.jpg`);
  after adding an original to `assets/images/`, run `npm run images`.
- 3D models: keep the source in `assets/models/`, ship the compressed copy
  (`npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp --texture-size 1024`).
- Keep the layout pixel-identical to the original Webflow design unless asked.
- Docs: https://docs.astro.build
