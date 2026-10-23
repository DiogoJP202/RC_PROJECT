import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoxGeometry, BufferGeometry, Material, MeshStandardMaterial, Texture } from 'three';
import { assetRegistry } from './assetRegistry';
import { inspectGlb, loadGltfResource } from './gltfResource';
import { createResourceOwnership } from './resourceOwnership';

interface TestGlb {
  asset: { version: string };
  accessors: { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string; sparse?: unknown }[];
  bufferViews: { buffer: number; byteOffset: number; byteLength: number }[];
  buffers: { byteLength: number }[];
  meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[];
  nodes: { children?: number[] }[];
  animations: { samplers: { input: number; output: number }[]; channels: { target: { node: number; path: string } }[] }[];
  materials: { pbrMetallicRoughness: { baseColorTexture?: { index: number } }; extensions?: Record<string, unknown> }[];
  extensionsUsed?: string[];
  images?: { bufferView: number; mimeType: string }[];
  textures?: { source: number }[];
  extras?: unknown;
}
function unpack(name = 'rigged'): { json: TestGlb; binary: Uint8Array } {
  const input = Uint8Array.from(readFileSync(`public/assets/fixtures/atlas-${name}-v1.glb`)); const view = new DataView(input.buffer);
  const jsonLength = view.getUint32(12, true);
  return { json: JSON.parse(new TextDecoder().decode(input.slice(20, 20 + jsonLength))) as TestGlb, binary: input.slice(28 + jsonLength) };
}
function pack({ json, binary }: ReturnType<typeof unpack>): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(json)); const length = Math.ceil(bytes.length / 4) * 4; const binLength = Math.ceil(binary.length / 4) * 4;
  const output = new ArrayBuffer(28 + length + binLength); const view = new DataView(output);
  [0x46546c67, 2, output.byteLength, length, 0x4e4f534a].forEach((value, i) => view.setUint32(i * 4, value, true));
  new Uint8Array(output, 20, length).fill(32); new Uint8Array(output, 20).set(bytes);
  view.setUint32(20 + length, binLength, true); view.setUint32(24 + length, 0x004e4942, true); new Uint8Array(output, 28 + length).set(binary); return output;
}
function floats(fixture: ReturnType<typeof unpack>, accessorId: number): Float32Array {
  const accessor = fixture.json.accessors[accessorId]; const bufferView = fixture.json.bufferViews[accessor.bufferView];
  return new Float32Array(fixture.binary.buffer, fixture.binary.byteOffset + bufferView.byteOffset + (accessor.byteOffset ?? 0), bufferView.byteLength / 4);
}
function imageFixture(): ArrayBuffer {
  const fixture = unpack('static');
  // Tiny synthetic image payload is embedded only to exercise decode success/failure ownership.
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'));
  const at = fixture.binary.length; const binary = new Uint8Array(at + png.length); binary.set(fixture.binary); binary.set(png, at); fixture.binary = binary;
  const index = fixture.json.bufferViews.length; fixture.json.bufferViews.push({ buffer: 0, byteOffset: at, byteLength: png.length });
  fixture.json.buffers[0].byteLength = binary.length; fixture.json.images = [{ bufferView: index, mimeType: 'image/png' }]; fixture.json.textures = [{ source: 0 }];
  fixture.json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 }; return pack(fixture);
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('binary preflight before Three can normalize malformed inputs', () => {
  it('rejects original non-normalized skin weights in the binary file', async () => {
    const fixture = unpack(); const weightsId = fixture.json.meshes[2].primitives[0].attributes.WEIGHTS_0;
    floats(fixture, weightsId)[0] = .2; const buffer = pack(fixture);
    expect(() => inspectGlb(buffer)).toThrow(/pesos originais não normalizados/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(buffer)));
    await expect(loadGltfResource(assetRegistry['fixture.rigged.v1'], { baseUrl: 'http://localhost/' })).rejects.toThrow(/pesos originais/);
  });
  it.each(['nan', 'out-of-order', 'quaternion', 'target', 'count'] as const)('rejects invalid animation %s', (kind) => {
    const fixture = unpack(); const sampler = fixture.json.animations[0].samplers[0];
    if (kind === 'nan') floats(fixture, sampler.output)[0] = Number.NaN;
    if (kind === 'out-of-order') floats(fixture, sampler.input)[1] = 0;
    if (kind === 'quaternion') floats(fixture, sampler.output)[3] = .5;
    if (kind === 'target') fixture.json.animations[0].channels[0].target.node = 999;
    if (kind === 'count') fixture.json.accessors[sampler.output].count = 2;
    expect(() => inspectGlb(pack(fixture))).toThrow(/GLB/);
  });
  it('rejects nonfinite positions, accessor overflow, cycles and sparse accessors', () => {
    const position = unpack(); floats(position, position.json.meshes[0].primitives[0].attributes.POSITION)[0] = Number.POSITIVE_INFINITY;
    expect(() => inspectGlb(pack(position))).toThrow(/não finito/);
    const overflow = unpack(); overflow.json.accessors[0].count = 1000000;
    expect(() => inspectGlb(pack(overflow))).toThrow(/accessor fora/);
    const cycle = unpack(); cycle.json.nodes[0].children = [0];
    expect(() => inspectGlb(pack(cycle))).toThrow(/cíclica/);
    const sparse = unpack(); sparse.json.accessors[0].sparse = {};
    expect(() => inspectGlb(pack(sparse))).toThrow(/sparse/);
  });
  it('bounds JSON traversal depth before recursive scene creation', () => {
    const fixture = unpack(); let value: unknown = 0;
    for (let i = 0; i < 70; i++) value = { deeper: value }; fixture.json.extras = value;
    expect(() => inspectGlb(pack(fixture))).toThrow(/profundidade/);
  });
  it('rejects nested plugin extensions omitted from declarations and malformed extension payloads', () => {
    const hidden = unpack(); hidden.json.materials[0].extensions = { KHR_materials_transmission: { transmissionFactor: 1 } };
    expect(() => inspectGlb(pack(hidden))).toThrow(/extensão aninhada/);
    const undeclared = unpack(); undeclared.json.materials[0].extensions = { KHR_materials_unlit: {} };
    expect(() => inspectGlb(pack(undeclared))).toThrow(/extensão aninhada/);
    undeclared.json.extensionsUsed = ['KHR_materials_unlit']; undeclared.json.materials[0].extensions = { KHR_materials_unlit: [] };
    expect(() => inspectGlb(pack(undeclared))).toThrow(/objeto JSON/);
    undeclared.json.materials[0].extensions = { KHR_materials_unlit: {} };
    expect(() => inspectGlb(pack(undeclared))).not.toThrow();
  });
  it('rejects duplicate child edges and multiple parents before bounded hierarchy traversal', () => {
    const duplicate = unpack(); duplicate.json.nodes = Array.from({ length: 12 }, (_, i) => i < 11 ? { children: [i + 1, i + 1] } : {});
    expect(() => inspectGlb(pack(duplicate))).toThrow(/filho duplicado/);
    const shared = unpack(); shared.json.nodes[8].children = [2];
    expect(() => inspectGlb(pack(shared))).toThrow(/múltiplos pais/);
    const reversed = unpack(); reversed.json.nodes = Array.from({ length: 130 }, (_, i) => i ? { children: [i - 1] } : {});
    expect(() => inspectGlb(pack(reversed))).toThrow(/profunda/);
  });
});

describe('partial parse failure and late resource ownership', () => {
  it('disposes late-created resources and shared ImageBitmap exactly once after a failure', () => {
    const owner = createResourceOwnership(); owner.dispose();
    const bitmap = { close: vi.fn() }; const texture = new Texture(bitmap as unknown as TexImageSource); const material = new MeshStandardMaterial({ map: texture }); const geometry = new BoxGeometry();
    const textureDispose = vi.spyOn(texture, 'dispose'); const materialDispose = vi.spyOn(material, 'dispose'); const geometryDispose = vi.spyOn(geometry, 'dispose');
    owner.collect([geometry, material, texture]); owner.collect([geometry, material, texture]); owner.dispose();
    expect(textureDispose).toHaveBeenCalledOnce(); expect(materialDispose).toHaveBeenCalledOnce(); expect(geometryDispose).toHaveBeenCalledOnce(); expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it('treats an actual embedded image decode rejection as an asset failure and cleans partial geometry/material/blob URL', async () => {
    const buffer = imageFixture(); const decode = vi.fn().mockRejectedValue(new Error('Synthetic decoder failure'));
    vi.stubGlobal('self', globalThis); vi.stubGlobal('createImageBitmap', decode);
    const fetch = vi.fn((input: URL | RequestInfo) => Promise.resolve(new Response(String(input).startsWith('blob:') ? new Uint8Array([1]) : buffer)));
    vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose'); const disposeMaterial = vi.spyOn(Material.prototype, 'dispose'); const revoke = vi.spyOn(URL, 'revokeObjectURL');
    await expect(loadGltfResource(assetRegistry['fixture.static.v1'], { baseUrl: 'http://localhost/' })).rejects.toThrow(/textura requerida/);
    await vi.waitFor(() => { expect(disposeGeometry).toHaveBeenCalled(); expect(disposeMaterial).toHaveBeenCalled(); });
    expect(decode).toHaveBeenCalledOnce(); expect(revoke).toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('loads an embedded image and closes its decoded bitmap on resource release', async () => {
    const buffer = imageFixture(); const bitmap = { width: 1, height: 1, close: vi.fn() };
    vi.stubGlobal('self', globalThis); vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    vi.stubGlobal('fetch', vi.fn((input: URL | RequestInfo) => Promise.resolve(new Response(String(input).startsWith('blob:') ? new Uint8Array([1]) : buffer))));
    const resource = await loadGltfResource(assetRegistry['fixture.static.v1'], { baseUrl: 'http://localhost/' });
    const material = resource.scene.getObjectByName('CranialFacet')!.getObjectByProperty('isMesh', true);
    expect(material).toBeDefined(); expect(bitmap.close).not.toHaveBeenCalled(); resource.dispose(); resource.dispose(); expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it('disposes parser-owned source and flat-shading clone materials, including unreferenced originals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(pack(unpack()))));
    const dispose = vi.spyOn(Material.prototype, 'dispose'); const resource = await loadGltfResource(assetRegistry['fixture.rigged.v1'], { baseUrl: 'http://localhost/' }); resource.dispose();
    // Pinned Three creates3 source materials and3 derived variants (tangents/flat shading).
    expect(dispose.mock.instances.length).toBe(6); expect(new Set(dispose.mock.instances).size).toBe(6);
  });
});
