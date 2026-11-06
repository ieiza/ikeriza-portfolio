// 3D models via <model-viewer>. The home page logo fades in when in view and
// plays its intro animation (sliding down) once, then rests on the last frame
// so it can be turned around.
import { ModelViewerElement } from '@google/model-viewer';
import { track } from './analytics';

// Models are Draco-compressed; serve the decoder ourselves instead of from Google's CDN.
(ModelViewerElement as unknown as { dracoDecoderLocation: string }).dracoDecoderLocation = '/media/draco/';

type ModelViewer = HTMLElement & {
  play: (options?: { repetitions?: number }) => void;
};

export function init() {
  // Analytics: note the first time a visitor turns each model.
  document.querySelectorAll<HTMLElement>('model-viewer').forEach((mv) => {
    const onChange = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail?.source !== 'user-interaction') return;
      mv.removeEventListener('camera-change', onChange);
      const src = mv.getAttribute('src') ?? '';
      track('model_interact', { model: mv.hasAttribute('data-home-logo') ? 'home-logo' : src.split('/').pop()?.replace(/\.glb$/, '') });
    };
    mv.addEventListener('camera-change', onChange);
  });

  const logo = document.querySelector<ModelViewer>('model-viewer[data-home-logo]');
  if (!logo) return;

  new IntersectionObserver(([entry]) => logo.classList.toggle('is-visible', entry.isIntersecting), {
    rootMargin: '-30% 0px -30% 0px',
  }).observe(logo);

  // repetitions: 1 holds the final frame when the animation ends.
  logo.addEventListener('load', () => logo.play({ repetitions: 1 }), { once: true });
}
