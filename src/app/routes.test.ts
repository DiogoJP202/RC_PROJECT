import { describe, expect, it } from 'vitest';
import { atlasHref, cellHref, coldVascularHref, coldVascularSelection, readRoute } from './routes';

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

  it('decodes a canonical RC identity once and bounds cold returns', () => {
    const route = read(cellHref('rc:4294967295:1992', true));
    expect(route).toMatchObject({ section: 'cell', entity: { kind: 'rc', id: 'rc:4294967295:1992', index: 1992, seed: 4294967295 }, webglOff: true });
    if (route.section !== 'cell' || !route.entity) throw Error('Valid identity expected');
    const next = new URL(coldVascularHref(route.entity, route.webglOff), 'http://localhost');
    expect(next.pathname).toBe('/atlas/vascular');
    expect(coldVascularSelection(next.searchParams)).toEqual({ identity: route.entity, count: 2000 });
    for (const id of ['', 'rbc:17:1', 'rc:17:1', 'rc:17:2000', 'rc:4294967296:8', 'rc:017:0', 'rc:17:008', 'rc%253A17%253A0', '%E0%A4%A', '%2F']) {
      expect(read('/atlas/cell/' + id)).toMatchObject({ section: 'cell', entity: null });
    }
    expect(coldVascularSelection(new URLSearchParams('microSeed=31&microSelect=rc:17:0'))).toBeNull();
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
