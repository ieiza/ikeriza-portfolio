// Lottie animations: looping ones play while on screen; the nav logo plays
// forward on hover and backward when the pointer leaves.
import lottie from 'lottie-web/build/player/lottie_light';

export function init(reduceMotion: boolean) {
  document.querySelectorAll<HTMLElement>('[data-lottie]').forEach((el) => {
    const hover = el.hasAttribute('data-lottie-hover');
    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      path: el.dataset.lottie!,
      loop: !hover,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    if (hover) {
      const target = el.closest('a') ?? el;
      const forward = () => { anim.setDirection(1); anim.play(); };
      const back = () => { anim.setDirection(-1); anim.play(); };
      target.addEventListener('pointerenter', forward);
      target.addEventListener('pointerleave', back);
      target.addEventListener('focus', forward);
      target.addEventListener('blur', back);
      return;
    }

    if (reduceMotion) return;
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim.play() : anim.pause()), { rootMargin: '200px 0px' }).observe(el);
  });
}
