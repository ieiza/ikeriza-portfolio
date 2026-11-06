// Looping Lottie animations in project pages: play while on screen, pause when away.
import lottie from 'lottie-web/build/player/lottie_light';

export function init(reduceMotion: boolean) {
  document.querySelectorAll<HTMLElement>('[data-lottie]').forEach((el) => {
    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      path: el.dataset.lottie!,
      loop: true,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    if (reduceMotion) return;
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim.play() : anim.pause()), { rootMargin: '200px 0px' }).observe(el);
  });
}
