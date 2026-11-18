import { describe, expect, it } from 'vitest';
import { atlasHref, readRoute } from './routes';

const read = (path: string) => readRoute(new URL(path, 'http://localhost:5173'));

describe('atlas route compatibility', () => {
  it('maps the three functional views, editorial routes and unavailable states separately', () => {
    expect(read('/')).toEqual({ section: 'home', href: '/' });
    expect(read('/estudos').section).toBe('studies');
    expect(read('/fontes').section).toBe('sources');
    expect(read('/atlas')).toMatchObject({ section: 'atlas', view: 'body' });
    expect(read('/atlas/rinkaku')).toMatchObject({ section: 'atlas', view: 'rinkaku' });
    expect(read('/atlas/vascular')).toMatchObject({ section: 'atlas', view: 'vascular' });
    expect(read('/atlas/comparar')).toMatchObject({ section: 'atlas', view: 'compare' });
    expect(read('/atlas/cell/rc%3A17%3A0').section).toBe('cell');
    expect(read('/inexistente').section).toBe('not-found');
  });

  it('normalizes old URLs with valid identifiers and keeps diagnostic options', () => {
    expect(read('/?mode=body&select=ghoul.kakuhou.rinkaku')).toEqual({
      section: 'atlas', view: 'body', search: '?select=ghoul.kakuhou.rinkaku', href: '/atlas?select=ghoul.kakuhou.rinkaku',
    });
    expect(read('/?mode=micro&microSeed=4294967295&webgl=off').href).toBe('/atlas/vascular?microSeed=4294967295&webgl=off');
    expect(read('/?mode=compare').href).toBe('/atlas/comparar');
    for (const flag of ['assets=lab', 'asset=missing', 'catalog=missing', 'silhouette=1', 'webgl=off']) {
      expect(read('/?' + flag).section).toBe('atlas');
    }
    expect(read('/?mode=constructor').section).toBe('home');
    expect(read('/?microSeed=4294967296').section).toBe('home');
    expect(read('/?select=ficcao').section).toBe('home');
    expect(read('/?utm_source=example').section).toBe('home');
  });

  it('prioritizes explicit views and retains fragment without keeping legacy mode', () => {
    expect(read('/atlas/rinkaku/?mode=micro&webgl=off#workspace')).toEqual({
      section: 'atlas', view: 'rinkaku', search: '?webgl=off', href: '/atlas/rinkaku?webgl=off#workspace',
    });
    expect(atlasHref('vascular', '?select=human.head&mode=compare')).toBe('/atlas/vascular?select=human.head');
  });
});
