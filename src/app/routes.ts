import { anatomyIds, type AnatomyId } from './types';

export const atlasPaths = {
  body: '/atlas',
  rinkaku: '/atlas/rinkaku',
  vascular: '/atlas/vascular',
  compare: '/atlas/comparar',
} as const;

export type AtlasView = keyof typeof atlasPaths;
export type EditorialSection = 'home' | 'studies' | 'sources';
export type NavigationKind = 'initial' | 'link' | 'history';
export interface AtlasRoute {
  section: 'atlas';
  view: AtlasView;
  search: string;
  href: string;
}
export type AppRoute = AtlasRoute | { section: EditorialSection | 'cell' | 'not-found'; href: string };

function rootLegacyView(query: URLSearchParams): AtlasView | undefined {
  switch (query.get('mode')) {
    case 'body': return 'body';
    case 'micro': return 'vascular';
    case 'compare': return 'compare';
  }
  const seed = query.get('microSeed');
  const selection = query.get('select');
  if (query.get('webgl') === 'off' || query.get('assets') === 'lab'
    || query.get('asset') === 'missing' || query.get('catalog') === 'missing' || query.has('silhouette')
    || (seed !== null && /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff)
    || (selection !== null && anatomyIds.includes(selection as AnatomyId))) return 'body';
}

export function atlasHref(view: AtlasView, search = ''): string {
  const query = new URLSearchParams(search);
  query.delete('mode');
  const params = query.toString();
  return atlasPaths[view] + (params ? '?' + params : '');
}

function atlasRoute(view: AtlasView, url: URL): AtlasRoute {
  const href = atlasHref(view, url.search) + url.hash;
  return { section: 'atlas', view, href, search: href.slice(atlasPaths[view].length, url.hash ? -url.hash.length : undefined) };
}

export function readRoute(url: URL): AppRoute {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
    const legacy = rootLegacyView(url.searchParams);
    if (legacy) return atlasRoute(legacy, url);
    return { section: 'home', href: '/' + url.search + url.hash };
  }
  for (const view of Object.keys(atlasPaths) as AtlasView[]) {
    if (atlasPaths[view] === path) return atlasRoute(view, url);
  }
  const href = path + url.search + url.hash;
  if (path === '/estudos') return { section: 'studies', href };
  if (path === '/fontes') return { section: 'sources', href };
  if (/^\/atlas\/cell\/[^/]+$/.test(path)) return { section: 'cell', href };
  return { section: 'not-found', href };
}

export function isBodyView(view: AtlasView): boolean {
  return view === 'body' || view === 'rinkaku';
}
