import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AssetRecord } from '../../../contracts/atlas-schema';
import { loadGltfResource } from './gltfResource';

const asset: AssetRecord = { id: 'test.original', kind: 'glb', status: 'ready', path: 'assets/test.glb', authorship: 'original', license: 'PROJECT_ORIGINAL', attribution: 'Original test fixture', nodeNames: ['BODY_ROOT'] };
const options = { baseUrl: 'http://localhost:5173/' };
// Original, in-memory glTF 2 container: a named node, no imported anatomy or mesh.
function fixture(): ArrayBuffer {
  const text = JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'BODY_ROOT' }] });
  const bytes = new TextEncoder().encode(text.padEnd(Math.ceil(text.length / 4) * 4, ' '));
  const buffer = new ArrayBuffer(20 + bytes.length);
  const view = new DataView(buffer);
  [0x46546c67, 2, buffer.byteLength, bytes.length, 0x4e4f534a].forEach((n, i) => view.setUint32(i * 4, n, true));
  new Uint8Array(buffer, 20).set(bytes);
  return buffer;
}
afterEach(() => vi.unstubAllGlobals());
describe('future glTF resource boundary', () => {
  it('rejects unavailable/unlicensed resources before a network request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(loadGltfResource({ ...asset, status: 'blocked_by_license' }, options)).rejects.toThrow(/licença/);
    await expect(loadGltfResource({ ...asset, license: undefined }, options)).rejects.toThrow(/licença/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('honors abort before fetch and reports real HTTP errors', async () => {
    const abort = new AbortController(); abort.abort();
    await expect(loadGltfResource(asset, { ...options, signal: abort.signal })).rejects.toThrow();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(loadGltfResource(asset, options)).rejects.toThrow(/HTTP 404/);
  });
  it('parses a real glTF 2 binary container and resolves its active node', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(fixture())));
    const resource = await loadGltfResource(asset, options);
    expect(resource.scene.getObjectByName('BODY_ROOT')).toBeDefined();
    expect(resource.animations).toEqual([]);
    expect(() => { resource.dispose(); resource.dispose(); }).not.toThrow();
  });
  it('rejects declared nodes absent from the active glTF scene', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(fixture())));
    await expect(loadGltfResource({ ...asset, nodeNames: ['NOT_IN_ACTIVE_SCENE'] }, options)).rejects.toThrow(/nodes ausentes/);
  });
  it('does not bypass the release gate with a remote or non-GLB path', async () => {
    await expect(loadGltfResource({ ...asset, path: 'https://third-party.test/mesh.glb' }, options)).rejects.toThrow(/mesma origem/);
    await expect(loadGltfResource({ ...asset, path: 'assets/file.png' }, options)).rejects.toThrow(/GLB/);
  });
});
