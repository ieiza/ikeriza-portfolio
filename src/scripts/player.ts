// Behaviour for components/VideoPlayer.astro.
//
// States (data-state on the section): idle -> playing <-> paused -> ended.
// Keyboard (when the player has focus): Space/K play-pause, ←/→ seek 5s,
// M mute, F full screen.

type State = 'idle' | 'playing' | 'paused' | 'ended';

const players: HTMLElement[] = [];
const IDLE_HIDE_MS = 2200;

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

function setup(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const frame = q<HTMLElement>('[data-player-frame]');
  const video = q<HTMLVideoElement>('[data-player-video]');
  const preview = root.querySelector<HTMLVideoElement>('.player__preview video');
  const toggle = q<HTMLButtonElement>('[data-player-toggle]');
  const time = q<HTMLElement>('[data-player-time]');
  const duration = q<HTMLElement>('[data-player-duration]');
  const progress = q<HTMLElement>('[data-player-progress]');
  const fill = q<HTMLElement>('[data-player-fill]');
  const mute = q<HTMLButtonElement>('[data-player-mute]');
  const full = q<HTMLButtonElement>('[data-player-fullscreen]');
  const title = toggle.getAttribute('aria-label')?.replace(/^Play /, '') ?? 'video';

  let hideTimer = 0;
  const setState = (state: State) => {
    root.dataset.state = state;
    toggle.setAttribute('aria-label', `${state === 'playing' ? 'Pause' : 'Play'} ${title}`);
    if (state === 'idle' || state === 'ended') preview?.play().catch(() => {});
    else preview?.pause();
  };
  const wake = () => {
    root.classList.add('is-active');
    clearTimeout(hideTimer);
    if (root.dataset.state === 'playing') {
      hideTimer = window.setTimeout(() => root.classList.remove('is-active'), IDLE_HIDE_MS);
    }
  };

  const play = () => {
    for (const other of players) if (other !== root) other.dispatchEvent(new Event('player:pause'));
    if (root.dataset.state === 'ended') video.currentTime = 0;
    video.play().catch(() => setState('paused'));
  };
  const pause = () => video.pause();
  const togglePlay = () => (video.paused || video.ended ? play() : pause());

  root.addEventListener('player:pause', pause);
  toggle.addEventListener('click', () => { togglePlay(); wake(); });
  video.addEventListener('click', togglePlay);

  video.addEventListener('play', () => { setState('playing'); wake(); });
  video.addEventListener('pause', () => { if (!video.ended) setState('paused'); wake(); });
  video.addEventListener('ended', () => { setState('ended'); root.classList.remove('is-active'); });
  video.addEventListener('loadedmetadata', () => { duration.textContent = fmt(video.duration); });
  video.addEventListener('timeupdate', () => {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = `${pct}%`;
    time.textContent = fmt(video.currentTime);
    progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    progress.setAttribute('aria-valuetext', fmt(video.currentTime));
  });
  video.addEventListener('volumechange', () => mute.setAttribute('aria-pressed', String(video.muted)));
  mute.setAttribute('aria-pressed', 'false');

  // Seeking: click or drag along the line.
  const seekTo = (clientX: number) => {
    const r = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (video.duration) video.currentTime = ratio * video.duration;
    else video.addEventListener('loadedmetadata', () => (video.currentTime = ratio * video.duration), { once: true });
  };
  progress.addEventListener('pointerdown', (e) => {
    progress.setPointerCapture(e.pointerId);
    if (root.dataset.state === 'idle') play();
    seekTo(e.clientX);
    const move = (ev: PointerEvent) => seekTo(ev.clientX);
    progress.addEventListener('pointermove', move);
    progress.addEventListener('pointerup', () => progress.removeEventListener('pointermove', move), { once: true });
  });

  mute.addEventListener('click', () => { video.muted = !video.muted; wake(); });

  const isFull = () => document.fullscreenElement === frame;
  full.addEventListener('click', () => {
    if (isFull()) document.exitFullscreen();
    else if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
    else (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
    wake();
  });
  document.addEventListener('fullscreenchange', () => { full.textContent = isFull() ? 'Exit' : 'Full'; });

  root.addEventListener('pointermove', wake);
  root.addEventListener('pointerleave', () => { if (root.dataset.state === 'playing') root.classList.remove('is-active'); });

  root.addEventListener('keydown', (e) => {
    if (e.target === mute || e.target === full) return;
    const key = e.key.toLowerCase();
    if (key === ' ' || key === 'k') { e.preventDefault(); togglePlay(); }
    else if (key === 'arrowright') { e.preventDefault(); video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); }
    else if (key === 'arrowleft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); }
    else if (key === 'm') video.muted = !video.muted;
    else if (key === 'f') full.click();
    else return;
    wake();
  });

  // Stop playing when scrolled well out of view.
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && !video.paused) pause(); }, { threshold: 0 }).observe(root);

  players.push(root);
}

document.querySelectorAll<HTMLElement>('[data-player]').forEach(setup);

export {};
