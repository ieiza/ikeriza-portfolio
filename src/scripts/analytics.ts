// Google Analytics 4 events. gtag is only loaded in production (layouts/Base.astro),
// so in development these calls do nothing.
//
// Events sent (see README "Analytics"):
//   contact_click   method: email | linkedin | instagram, link_location        (key event)
//   select_content  content_type: project, item_id: <slug>, link_location: home | next
//   video_start / video_progress (25/50/75) / video_complete   for the site's own player
//   model_interact  model: <name>   first time a visitor drags a 3D model
//   page_not_found  page_path, page_referrer

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: string, params: Params = {}) {
  window.gtag?.('event', name, params);
}

const CONTACT: [RegExp, string][] = [
  [/^mailto:/, 'email'],
  [/linkedin\.com/, 'linkedin'],
  [/instagram\.com/, 'instagram'],
];

const where = (el: Element) => (el.closest('footer') ? 'footer' : el.closest('nav') ? 'nav' : 'content');

export function init() {
  document.addEventListener('click', (e) => {
    const link = (e.target as Element | null)?.closest?.('a');
    if (!link) return;
    const href = link.getAttribute('href') ?? '';

    const contact = CONTACT.find(([re]) => re.test(href));
    if (contact) {
      track('contact_click', { method: contact[1], link_location: where(link), link_url: link.href });
      return;
    }

    if (link.matches('[data-project-item]')) {
      const items = [...document.querySelectorAll('[data-project-item]')];
      track('select_content', {
        content_type: 'project',
        item_id: href.replace(/^\//, ''),
        link_location: 'home',
        index: items.indexOf(link) + 1,
      });
    } else if (link.closest('.page-nav') && document.documentElement.dataset.pageType === 'project') {
      track('select_content', { content_type: 'project', item_id: href.replace(/^\//, ''), link_location: 'next' });
    }
  });

  if (document.documentElement.dataset.pageType === 'not_found') {
    track('page_not_found', { page_path: location.pathname, page_referrer: document.referrer || undefined });
  }
}
