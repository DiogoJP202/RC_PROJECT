import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Points, ShaderMaterial, SkinnedMesh, Texture, Vector3 } from 'three';
import type { Object3D } from 'three';
import { acquireAsset, getAssetCacheStats, resolveAssetBindings } from './assetCache';
import type { AssetLease } from './assetCache';
import { assetRegistry, getAssetDefinition } from './assetRegistry';
import { disposeGltfScenes, inspectGlb, loadGltfResource } from './gltfResource';

const options = { baseUrl: 'http://localhost:5173/' };
const leases: AssetLease[] = [];
const binary = (name = 'static') => Uint8Array.from(readFileSync(`public/assets/fixtures/atlas-${name}-v1.glb`)).buffer;
const fixtureFetch = () => vi.fn((input: URL | RequestInfo) => Promise.resolve(new Response(binary(String(input).includes('rigged') ? 'rigged' : 'static'))));
async function lease(id = 'fixture.static.v1') { const resource = await acquireAsset(id, options); leases.push(resource); return resource; }
function modifiedDefinition() { return structuredClone(assetRegistry['fixture.static.v1']); }
function metadata(scene: Object3D, semanticId: string) { let result: Object3D | undefined; scene.traverse((node) => { if (node.userData.atlasId === semanticId) result = node; }); return result!; }
function jsonGlb(json: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(json)); const size = Math.ceil(bytes.length / 4) * 4;
  const output = new ArrayBuffer(20 + size); const view = new DataView(output);
  [0x46546c67, 2, output.byteLength, size, 0x4e4f534a].forEach((value, i) => view.setUint32(i * 4, value, true));
  new Uint8Array(output, 20).fill(32); new Uint8Array(output, 20).set(bytes); return output;
}
afterEach(() => { leases.splice(0).forEach((resource) => resource.release()); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('real synthetic disk assets and partial semantic integration', () => {
  it('contains real GLB mesh buffers and a second two-joint skin + clip', () => {
    const staticJson = inspectGlb(binary()); const rigJson = inspectGlb(binary('rigged'));
    expect(staticJson.meshes).toHaveLength(3); expect(rigJson.skins).toHaveLength(1); expect(rigJson.animations).toHaveLength(1);
    expect(staticJson.nodes).not.toEqual(rigJson.nodes);
  });
  it('loads approved disk bytes and resolves three stable anatomy IDs, bounds and sockets', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease();
    expect([...resource.bindings.keys()]).toEqual(['human.head', 'human.thorax', 'ghoul.kakuhou.rinkaku']);
    expect(resource.bounds.get('human.head')!.max.y).toBeCloseTo(1.85);
    expect(resource.anchors.get('ghoul.kakuhou.rinkaku')!.y).toBeCloseTo(.976);
    expect(resource.sockets.get('lumbar')!.getWorldPosition(new Vector3()).z).toBeCloseTo(-.192);
    let selectedMeshes = 0;
    resource.bindings.get('human.thorax')![0].traverse((object) => { if ((object as Mesh).isMesh) { selectedMeshes++; expect(object.userData.anatomyId).toBe('human.thorax'); } });
    expect(selectedMeshes).toBe(2); expect(resource.bindings.has('human.surface')).toBe(false);
  });
  it('does not depend on display names or a fixed hierarchy', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease();
    resource.scene.traverse((object) => { object.name = 'Same display name'; });
    expect(resolveAssetBindings(resource.scene, modifiedDefinition()).bindings.size).toBe(3);
  });
  it('rejects absent metadata and duplicate semantic identities', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease(); const definition = modifiedDefinition();
    definition.bindings['human.head']!.semanticIds = ['missing'];
    expect(() => resolveAssetBindings(resource.scene, definition)).toThrow(/ausente/);
    metadata(resource.scene, 'fixture.head').userData.atlasId = 'fixture.root';
    expect(() => resolveAssetBindings(resource.scene, modifiedDefinition())).toThrow(/duplicada/);
  });
  it('rejects renderable meshes with no anatomy binding while allowing empty rig/socket nodes', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease();
    const duplicate = resource.scene.getObjectByName('CranialFacet')!.clone(); duplicate.userData = {}; resource.scene.add(duplicate);
    expect(() => resolveAssetBindings(resource.scene, modifiedDefinition())).toThrow(/sem binding anatômico/);
  });
  it.each(['units', 'orientation', 'pivot', 'scale', 'bounds', 'anchor'] as const)('rejects invalid %s spatial contract', async (kind) => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease(); const definition = modifiedDefinition(); const root = metadata(resource.scene, 'fixture.root');
    if (kind === 'units') root.userData.metersPerUnit = .01;
    if (kind === 'orientation') root.rotation.z = Math.PI / 2;
    if (kind === 'pivot') root.position.y = .2;
    if (kind === 'scale') root.scale.setScalar(100);
    if (kind === 'bounds') definition.spatial.bounds.max = [5, 5, 5];
    if (kind === 'anchor') definition.bindings['human.head']!.anchor = [8, 8, 8];
    expect(() => resolveAssetBindings(resource.scene, definition)).toThrow(/Contrato espacial/);
  });
});

describe('approval and self-contained loading boundary', () => {
  it('does not fetch unregistered IDs', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(acquireAsset('arbitrary-path.glb', options)).rejects.toThrow(/não aprovado/); expect(fetch).not.toHaveBeenCalled();
  });
  it('does not allow overriding the application origin using baseUrl', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); vi.stubGlobal('location', { href: 'https://atlas.test/', origin: 'https://atlas.test' });
    await expect(acquireAsset('fixture.static.v1', { baseUrl: 'https://foreign.test/' })).rejects.toThrow(/mesma origem/); expect(fetch).not.toHaveBeenCalled();
  });
  it('verifies exact byte count and digest before parsing', async () => {
    const corrupt = binary(); new Uint8Array(corrupt)[100] ^= 1;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(corrupt)));
    await expect(acquireAsset('fixture.static.v1', options)).rejects.toThrow(/SHA-256/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(binary().slice(0, -4))));
    await expect(acquireAsset('fixture.static.v1', options)).rejects.toThrow(/tamanho/);
  });
  it('rejects redirect and locks credentials/referrer on fetch', async () => {
    const response = new Response(binary()); Object.defineProperty(response, 'redirected', { value: true });
    const fetch = vi.fn().mockResolvedValue(response); vi.stubGlobal('fetch', fetch);
    await expect(acquireAsset('fixture.static.v1', options)).rejects.toThrow(/redirect/);
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer' });
  });
  it.each(['https://foreign.test/buffer.bin', '/assets/other.bin', 'data:application/octet-stream;base64,AA=='])('rejects internal URI %s before GLTFLoader can fetch it', async (uri) => {
    const input = jsonGlb({ asset: { version: '2.0' }, buffers: [{ uri, byteLength: 1 }], nodes: [{ name: 'StaticFixtureOrigin' }], scenes: [{ nodes: [0] }], scene: 0 });
    const fetch = vi.fn().mockResolvedValue(new Response(input)); vi.stubGlobal('fetch', fetch);
    await expect(loadGltfResource(getAssetDefinition('fixture.static.v1'), options)).rejects.toThrow(/URI/); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects decoder extensions, malformed containers and unexpected chunks', () => {
    expect(() => inspectGlb(jsonGlb({ asset: { version: '2.0' }, extensionsUsed: ['KHR_draco_mesh_compression'] }))).toThrow(/extensão/);
    expect(() => inspectGlb(binary().slice(0, -1))).toThrow(/tamanho/);
    expect(() => inspectGlb(new ArrayBuffer(3))).toThrow(/cabeçalho/);
    const input = binary(); new DataView(input).setUint32(16, 0x12345678, true);
    expect(() => inspectGlb(input)).toThrow(/primeiro chunk/);
  });
});

describe('cache leases, abort, failure recovery and ownership', () => {
  it('coalesces concurrent loads but isolates transforms/materials; final release disposes geometry once', async () => {
    const fetch = fixtureFetch(); vi.stubGlobal('fetch', fetch);
    const [first, second] = await Promise.all([lease(), lease()]); expect(fetch).toHaveBeenCalledTimes(1);
    const a = first.scene.getObjectByName('CranialFacet') as Mesh; const b = second.scene.getObjectByName('CranialFacet') as Mesh;
    expect(first.scene).not.toBe(second.scene); expect(a.geometry).toBe(b.geometry); expect(a.material).not.toBe(b.material);
    const geometryDispose = vi.spyOn(a.geometry, 'dispose'); const materialDispose = vi.spyOn(a.material as MeshStandardMaterial, 'dispose');
    first.release(); first.release(); expect(materialDispose).toHaveBeenCalledOnce(); expect(geometryDispose).not.toHaveBeenCalled();
    expect(getAssetCacheStats().refCount).toBe(1); second.release(); expect(geometryDispose).toHaveBeenCalledOnce(); expect(getAssetCacheStats().entries).toBe(0);
  });
  it('clones a shared source material per mesh so local highlights never change another mesh', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease();
    const left = resource.scene.getObjectByName('LeftFacet') as Mesh; const right = resource.scene.getObjectByName('RightFacet') as Mesh;
    expect(left.material).not.toBe(right.material);
    (left.material as MeshStandardMaterial).opacity = .2; expect((right.material as MeshStandardMaterial).opacity).toBe(1);
  });
  it('retries a failed load without a rejected promise poisoning the cache', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(new Response(binary())); vi.stubGlobal('fetch', fetch);
    await expect(acquireAsset('fixture.static.v1', options)).rejects.toThrow(/HTTP 404/); expect(getAssetCacheStats().entries).toBe(0);
    const resource = await lease(); expect(resource.bindings.size).toBe(3); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('one aborted waiter does not abort another consumer of the same request', async () => {
    let complete!: (response: Response) => void;
    const fetch = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { complete = resolve; })); vi.stubGlobal('fetch', fetch);
    const abort = new AbortController(); const canceled = acquireAsset('fixture.static.v1', { ...options, signal: abort.signal }); const accepted = lease();
    const rejection = expect(canceled).rejects.toThrow(); abort.abort(); await rejection;
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    complete(new Response(binary())); const resource = await accepted; expect(resource.bindings.size).toBe(3); expect(getAssetCacheStats().refCount).toBe(1);
  });
  it('aborts an abandoned in-flight load, then permits a fresh request', async () => {
    const fetch = vi.fn().mockImplementation((_url: URL, init: RequestInit) => new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))); vi.stubGlobal('fetch', fetch);
    const abort = new AbortController(); const pending = acquireAsset('fixture.static.v1', { ...options, signal: abort.signal });
    const rejection = expect(pending).rejects.toThrow(); abort.abort(); await rejection; expect(getAssetCacheStats().entries).toBe(0);
    vi.stubGlobal('fetch', fixtureFetch()); expect((await lease()).bindings.size).toBe(3);
  });
  it('does not start a request for an already-aborted signal', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const abort = new AbortController(); abort.abort();
    await expect(acquireAsset('fixture.static.v1', { ...options, signal: abort.signal })).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
  });
});

describe('real rig animation and complete disposal', () => {
  it('parses SkinnedMesh weights and bones, deforms vertices, moves a socket, and isolates cloned rigs', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const [first, second] = await Promise.all([lease('fixture.rigged.v1'), lease('fixture.rigged.v1')]);
    const mesh = first.scene.getObjectByName('WeightedLumbarFacet') as SkinnedMesh; const other = second.scene.getObjectByName('WeightedLumbarFacet') as SkinnedMesh;
    expect(mesh.isSkinnedMesh).toBe(true); expect(mesh.skeleton.bones).toHaveLength(2); expect(mesh.skeleton.bones[0]).not.toBe(other.skeleton.bones[0]);
    const socket = first.sockets.get('rig-tip')!; const before = socket.getWorldPosition(new Vector3());
    const point = new Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'), 3); const beforeVertex = mesh.applyBoneTransform(3, point.clone());
    expect(first.animations[0].name).toBe('fixture_sway'); expect(first.animations[0].duration).toBe(1);
    const action = first.mixer!.clipAction(first.animations[0]); action.play(); first.mixer!.setTime(.5); first.scene.updateMatrixWorld(true); mesh.skeleton.update();
    expect(socket.getWorldPosition(new Vector3()).distanceTo(before)).toBeGreaterThan(.005);
    expect(mesh.applyBoneTransform(3, point.clone()).distanceTo(beforeVertex)).toBeGreaterThan(.005);
    expect(other.skeleton.bones[1].quaternion.z).toBe(0);
    mesh.skeleton.computeBoneTexture(); const dispose = vi.spyOn(mesh.skeleton.boneTexture!, 'dispose');
    first.release(); expect(dispose).toHaveBeenCalledOnce(); expect(action.isRunning()).toBe(false);
  });
  it('rejects invalid skin weights instead of silently accepting a broken rig', async () => {
    vi.stubGlobal('fetch', fixtureFetch()); const resource = await lease('fixture.rigged.v1');
    const mesh = resource.scene.getObjectByName('WeightedLumbarFacet') as SkinnedMesh;
    const weights = mesh.geometry.getAttribute('skinWeight'); const original = weights.getX(0); weights.setX(0, .2);
    expect(() => resolveAssetBindings(resource.scene, assetRegistry['fixture.rigged.v1'])).toThrow(/pesos/); weights.setX(0, original);
  });
  it('disposes shared geometry/material/texture/bitmap once across secondary scenes and uniforms', () => {
    const bitmap = { close: vi.fn() }; const texture = new Texture(bitmap as unknown as TexImageSource);
    const material = new ShaderMaterial({ uniforms: { nested: { value: [texture, texture] } } }); const geometry = new BoxGeometry();
    const sceneA = new Group(); const sceneB = new Group(); sceneA.add(new Mesh(geometry, material)); sceneB.add(new Mesh(geometry, material));
    const disposeGeometry = vi.spyOn(geometry, 'dispose'); const disposeMaterial = vi.spyOn(material, 'dispose'); const disposeTexture = vi.spyOn(texture, 'dispose');
    disposeGltfScenes([sceneA, sceneB]); expect(disposeGeometry).toHaveBeenCalledOnce(); expect(disposeMaterial).toHaveBeenCalledOnce(); expect(disposeTexture).toHaveBeenCalledOnce(); expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it('also disposes resources attached to non-mesh glTF primitives', () => {
    const geometry = new BoxGeometry(); const material = new MeshStandardMaterial(); const scene = new Group(); scene.add(new Points(geometry, material));
    const disposeGeometry = vi.spyOn(geometry, 'dispose'); const disposeMaterial = vi.spyOn(material, 'dispose');
    disposeGltfScenes([scene]); expect(disposeGeometry).toHaveBeenCalledOnce(); expect(disposeMaterial).toHaveBeenCalledOnce();
  });
});
