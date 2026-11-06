// Build-time clean-up applied to every page from src/site/pages/.
// The page files stay exactly as scripts/sync-site.mjs downloaded them; all
// fixes live here so a re-sync never undoes them.

type Fix = (html: string) => string;

const scriptTag = (srcPart: string) =>
  new RegExp(`<script\\b[^>]*src="[^"]*${srcPart}[^"]*"[^>]*>\\s*</script>\\s*`, 'g');
const inlineScript = (bodyPart: string) =>
  new RegExp(`<script\\b(?![^>]*src=)[^>]*>(?:(?!</script>)[\\s\\S])*${bodyPart}(?:(?!</script>)[\\s\\S])*</script>\\s*`, 'g');

/** GSAP + 20 plugins (~750 KB) were loaded and registered on every page but nothing uses them. */
const dropUnusedGsap: Fix = (html) =>
  html.replace(scriptTag('/media/gsap/'), '').replace(inlineScript('gsap\\.registerPlugin'), '');

/** The Adobe Fonts kit was loaded twice (blocking JS kit + CSS). Keep only the CSS. */
const dropTypekitJs: Fix = (html) =>
  html.replace(scriptTag('use\\.typekit\\.net/[a-z0-9]+\\.js'), '').replace(inlineScript('Typekit\\.load'), '');

/** Victor Mono came through the blocking WebFont loader; a stylesheet link does the same job. */
const googleFontLink: Fix = (html) => {
  if (!/WebFont\.load/.test(html)) return html;
  return html
    .replace(scriptTag('webfont\\.js'), '')
    .replace(inlineScript('WebFont\\.load'),
      '<link href="https://fonts.googleapis.com/css2?family=Victor+Mono:ital,wght@1,700&display=swap" rel="stylesheet"/>');
};

/** Google Analytics was installed twice, so every visit was counted twice. Keep the first copy. */
const dedupeAnalytics: Fix = (html) => {
  let seenTag = false;
  let seenConfig = false;
  return html
    .replace(scriptTag('googletagmanager\\.com/gtag/js'), (m) => (seenTag ? '' : ((seenTag = true), m)))
    .replace(inlineScript("gtag\\('config'"), (m) => (seenConfig ? '' : ((seenConfig = true), m)));
};

/** Plyr (video player) is only used on pages that have more than the setup call's ".js-player". */
const plyrOnlyWhereUsed: Fix = (html) => {
  const players = (html.match(/js-player/g) || []).length - 1; // one is the Plyr.setup selector
  if (players > 0) return html;
  return html
    .replace(/<link\b[^>]*href="[^"]*plyr[^"]*\.css"[^>]*>\s*/g, '')
    .replace(scriptTag('plyr[^"]*\\.js'), '')
    .replace(inlineScript('Plyr\\.setup'), '');
};

/** model-viewer (~1 MB) is only needed on pages with a 3D model. */
const modelViewerOnlyWhereUsed: Fix = (html) =>
  /<model-viewer\b/.test(html) ? html : html.replace(scriptTag('model-viewer'), '');

/**
 * The homepage 3D logo script passed the browser's global stop() as an event
 * handler, which threw an error after the first play. It was meant to cycle
 * through the speeds, so play the next one instead.
 */
const fixModelViewerLoop: Fix = (html) =>
  html.replace("addEventListener('finished', stop)", "addEventListener('finished', play)");

/** Webflow marks every image lazy, including the first one; load that one straight away. */
const eagerFirstImage: Fix = (html) => {
  let done = false;
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (done) return tag;
    done = true;
    return tag.replace(/\sloading="lazy"/, '').replace(/<img\b/, '<img fetchpriority="high"');
  });
};

/**
 * Every autoplaying background video started downloading on page load (≈16 MB on
 * some project pages). Keep the first one as is; the rest load and play when
 * they come near the screen, and pause when they leave.
 */
const lazyVideos: Fix = (html) => {
  let index = 0;
  const out = html.replace(/<video\b[^>]*>/g, (tag) => {
    if (index++ === 0 || !/\sautoplay(?:="")?/.test(tag)) return tag;
    return tag.replace(/\sautoplay(?:="")?/, ' preload="none" data-lazy-autoplay');
  });
  if (index < 2) return out;
  const loader = `<script>(()=>{const vs=document.querySelectorAll('video[data-lazy-autoplay]');if(!('IntersectionObserver'in window)){vs.forEach(v=>{v.autoplay=true;v.load();});return;}const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{});}else if(!v.paused){v.pause();}}),{rootMargin:'300px 0px'});vs.forEach(v=>io.observe(v));})();</script>`;
  return out.replace(/<\/body>/i, `${loader}</body>`);
};

const fixes: Fix[] = [
  dropUnusedGsap,
  dropTypekitJs,
  googleFontLink,
  dedupeAnalytics,
  plyrOnlyWhereUsed,
  modelViewerOnlyWhereUsed,
  fixModelViewerLoop,
  eagerFirstImage,
  lazyVideos,
];

export function optimize(html: string): string {
  return fixes.reduce((h, fix) => fix(h), html);
}
