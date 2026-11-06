// Site-wide behaviour. Heavier pieces (Lottie, 3D, video player) load only on
// pages that use them.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Navbar: hide when scrolling down, show when scrolling up -------------
{
  const nav = document.querySelector<HTMLElement>('[data-navbar]');
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking || !nav) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 4) {
        nav.classList.toggle('is-hidden', y > lastY && y > 80);
        lastY = y;
      }
      ticking = false;
    });
  }, { passive: true });
  nav?.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
}

// ---- Background videos: load and play near the viewport, pause when away ----
// With "reduce motion" on, they show their poster frame and don't play.
{
  const videos = document.querySelectorAll<HTMLVideoElement>('video[data-bg-video]');
  const showPoster = (v: HTMLVideoElement) => {
    if (v.dataset.poster) { v.poster = v.dataset.poster; delete v.dataset.poster; }
  };
  if (reduceMotion) videos.forEach((v) => { v.autoplay = false; v.pause(); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        const v = target as HTMLVideoElement;
        if (isIntersecting) {
          showPoster(v);
          if (!reduceMotion) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      }
    }, { rootMargin: '300px 0px' });
    videos.forEach((v) => io.observe(v));
  } else {
    videos.forEach((v) => { showPoster(v); if (!reduceMotion) { v.autoplay = true; v.load(); } });
  }
}

// ---- Home: the title crossing the middle of the screen shows its cover ----
{
  const items = document.querySelectorAll<HTMLElement>('[data-project-item]');
  if (items.length) {
    const io = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) target.classList.toggle('is-active', isIntersecting);
    }, { rootMargin: '-50% 0px -50% 0px' });
    items.forEach((el) => io.observe(el));
  }
}

// ---- Slideshows ------------------------------------------------------------
document.querySelectorAll<HTMLElement>('[data-slideshow]').forEach((show) => {
  if (reduceMotion) return;
  const slides = [...show.querySelectorAll('img')];
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    const current = slides[i];
    i = (i + 1) % slides.length;
    const next = slides[i];
    next.classList.remove('is-leaving');
    current.classList.replace('is-current', 'is-leaving');
    next.classList.add('is-current');
  }, 2000);
});

// ---- Lottie animations -------------------------------------------------------
if (document.querySelector('[data-lottie]')) {
  import('./lottie').then((m) => m.init(reduceMotion));
}

// ---- 3D models ---------------------------------------------------------------
if (document.querySelector('model-viewer')) {
  import('./models').then((m) => m.init());
}

// ---- Video player --------------------------------------------------------------
if (document.querySelector('[data-player]')) {
  import('./player');
}
