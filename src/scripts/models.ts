// 3D models via <model-viewer>. The home page logo fades in when in view and
// plays its intro animation (sliding down) once, then rests on the last frame
// so it can be turned around.
import { ModelViewerElement } from '@google/model-viewer';

// Models are Draco-compressed; serve the decoder ourselves instead of from Google's CDN.
(ModelViewerElement as unknown as { dracoDecoderLocation: string }).dracoDecoderLocation = '/media/draco/';

type ModelViewer = HTMLElement & {
  play: (options?: { repetitions?: number }) => void;
};

export function init() {
  const logo = document.querySelector<ModelViewer>('model-viewer[data-home-logo]');
  if (!logo) return;

  new IntersectionObserver(([entry]) => logo.classList.toggle('is-visible', entry.isIntersecting), {
    rootMargin: '-30% 0px -30% 0px',
  }).observe(logo);

  // repetitions: 1 holds the final frame when the animation ends.
  logo.addEventListener('load', () => logo.play({ repetitions: 1 }), { once: true });
}
