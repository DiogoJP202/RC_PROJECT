import { afterEach, describe, expect, it, vi } from 'vitest';
import seed from '../../public/catalog.json';
import { CatalogValidationError, evidenceLabel, loadCatalog, validateCatalog } from './catalog';

interface Fixture {
  schemaVersion: number;
  citations: Record<string, unknown>[];
  claims: Record<string, unknown>[];
  anatomy: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  cameraBookmarks: Record<string, unknown>[];
}
const fresh = (): Fixture => structuredClone(seed);
afterEach(() => { vi.unstubAllGlobals(); });

describe('catalog runtime boundary', () => {
  it('maps all six actual scene nodes and keeps factual and representation states distinct', () => {
    const result = validateCatalog(seed);
    expect(result.structures).toHaveLength(6);
    const kakuhou = result.structures.find((node) => node.id === 'ghoul.kakuhou.rinkaku');
    expect(kakuhou?.nodeName).toBe('KAKUHOU_RINKAKU');
    expect(kakuhou?.modelStatus).toBe('conceptual_proxy');
    expect(kakuhou?.modelDisclosure).toContain('PROXY / CONCEPTUAL MODEL');
    expect(result.claims.filter((claim) => kakuhou?.claimIds.includes(claim.id)).map((claim) => claim.kind)).toEqual(expect.arrayContaining(['official', 'hypothetical_model', 'unknown']));
    expect(result.claims.find((claim) => claim.id === 'claim.kakuhou.stores.rc')?.scope).toContain('não determina morfologia');
  });

  const negatives: [string, (value: Fixture) => void, string][] = [
    ['unsupported version', (value) => { value.schemaVersion = 999; }, 'schemaVersion'],
    ['duplicate IDs', (value) => { value.anatomy.push({ ...value.anatomy[0] }); }, 'duplicate id'],
    ['missing camera', (value) => { value.anatomy[0].cameraBookmarkId = 'camera.absent'; }, 'cameraBookmarkId'],
    ['missing camera focus', (value) => { value.cameraBookmarks[0].focusAnatomyId = 'node.absent'; }, 'focusAnatomyId'],
    ['negative distance', (value) => { value.cameraBookmarks[0].distanceMultiplier = -1; }, 'distanceMultiplier'],
    ['negative transition', (value) => { value.cameraBookmarks[0].transitionMs = -1; }, 'transitionMs'],
    ['invalid system', (value) => { value.anatomy[0].system = 'invented'; }, 'system'],
    ['invented node', (value) => { value.anatomy[0].nodeName = 'NOT_A_SCENE_NODE'; }, 'nodeName'],
    ['ready GLB without path', (value) => { value.assets[0].kind = 'glb'; value.assets[0].status = 'ready'; }, 'path'],
    ['third party without license', (value) => { value.assets[0].authorship = 'third_party_open'; delete value.assets[0].license; }, 'license'],
    ['orphan parent', (value) => { value.anatomy[0].parentId = 'node.absent'; }, 'parentId'],
    ['official from secondary only', (value) => { value.citations[0].sourceType = 'secondary'; }, 'fonte direta elegível'],
    ['official unverified', (value) => { value.citations[0].verifiedAt = null; }, 'fonte direta exige'],
    ['hypothesis without disclosure', (value) => { delete value.claims[2].disclaimer; }, 'disclaimer'],
    ['pending manga without TODO', (value) => { value.claims[0].kind = 'manga_needs_verification'; }, 'verificationTodo'],
    ['manifest mismatch', (value) => { value.assets[0].nodeNames = ['FAKE']; }, 'manifesto compilado'],
    ['parent cycle', (value) => { value.anatomy[0].parentId = 'human.head'; }, 'ciclo'],
    ['missing core structure', (value) => { value.anatomy.shift(); }, 'estrutura essencial ausente'],
    ['NaN camera', (value) => { value.cameraBookmarks[0].transitionMs = Number.NaN; }, 'transitionMs'],
  ];
  it.each(negatives)('rejects %s', (_name, mutate, expected) => {
    const fixture = fresh();
    mutate(fixture);
    expect(() => validateCatalog(fixture)).toThrow(expected);
  });

  it('reports malformed objects at the boundary instead of asserting a type', () => {
    expect(() => validateCatalog(null)).toThrow(CatalogValidationError);
    expect(() => validateCatalog({ schemaVersion: 2, anatomy: [null] })).toThrow('Catálogo inválido');
  });

  it('does not label pending manga as official', () => {
    expect(evidenceLabel.manga_needs_verification).toContain('pendente');
    expect(evidenceLabel.manga_needs_verification.toLowerCase()).not.toContain('oficial');
    expect(evidenceLabel.real_anatomy).toContain('humana');
  });

  it('fetches real resource asynchronously with abort support', async () => {
    const controller = new AbortController();
    const request = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(seed) });
    vi.stubGlobal('fetch', request);
    const data = await loadCatalog(controller.signal);
    expect(data.structures).toHaveLength(6);
    expect(request).toHaveBeenCalledWith('/catalog.json', { signal: controller.signal, cache: 'no-cache' });
  });

  it('surfaces HTTP failure without a fabricated success fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(loadCatalog()).rejects.toThrow('HTTP 503');
  });

  it('surfaces invalid JSON and invalid content independently', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.reject(new SyntaxError('bad JSON')) }));
    await expect(loadCatalog()).rejects.toThrow('JSON válido');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ schemaVersion: 999 }) }));
    await expect(loadCatalog()).rejects.toThrow(CatalogValidationError);
  });

  it('preserves network/abort rejection for the caller to handle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));
    await expect(loadCatalog()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
