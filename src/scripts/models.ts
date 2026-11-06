// 3D models via <model-viewer>. The home page logo fades in when in view and
// plays its animation at a cycle of speeds.
import { ModelViewerElement } from '@google/model-viewer';

// Models are Draco-compressed; serve the decoder ourselves instead of from Google's CDN.
(ModelViewerElement as unknown as { dracoDecoderLocation: string }).dracoDecoderLocation = '/media/draco/';

type ModelViewer = HTMLElement & {
  timeScale: number;
  play: (options?: { repetitions?: number }) => void;
};

export function init() {
  const logo = document.querySelector<ModelViewer>('model-viewer[data-home-logo]');
  if (!logo) return;

  new IntersectionObserver(([entry]) => logo.classList.toggle('is-visible', entry.isIntersecting), {
    rootMargin: '-30% 0px -30% 0px',
  }).observe(logo);

  const speeds = [1, 2, 0.5, -1];
  let i = 0;
  const play = () => {
    logo.timeScale = speeds[i++ % speeds.length];
    logo.play({ repetitions: 1 });
  };
  logo.addEventListener('load', play, { once: true });
  logo.addEventListener('finished', play);
}
