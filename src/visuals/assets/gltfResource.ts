import { LoadingManager } from 'three';
import type { AnimationClip, Object3D } from 'three';
import type { AssetRecord } from '../../../contracts/atlas-schema';
import { createResourceOwnership } from './resourceOwnership';
import { inspectGlb } from './glbValidation';
export { inspectGlb } from './glbValidation';

export interface GltfResource { scene: Object3D; scenes: Object3D[]; animations: AnimationClip[]; dispose: () => void }
export interface AssetLoadOptions { signal?: AbortSignal; baseUrl?: string; expectedSha256?: string; expectedBytes?: number; maxBytes?: number }

/** Deduplicates resources across all scenes. Owned template only; never call on a cache lease. */
export function disposeGltfScenes(scenes: readonly Object3D[]): void {
  const ownership = createResourceOwnership(); ownership.collect(scenes); ownership.dispose();
}
export function disposeGltfScene(scene: Object3D): void { disposeGltfScenes([scene]); }

/** Legacy adapter takes an approved record; production acquisition uses the committed registry. */
export async function loadGltfResource(asset: AssetRecord, options: AssetLoadOptions = {}): Promise<GltfResource> {
  if (asset.kind !== 'glb' || !['ready', 'proxy'].includes(asset.status) || !asset.path || !asset.license || !asset.attribution || !asset.nodeNames?.length || asset.authorship === 'unknown') {
    throw new Error(`Asset ${asset.id}: arquivo GLB, disponibilidade, licença, autoria, atribuição e nodes são obrigatórios.`);
  }
  const base = new URL(options.baseUrl ?? import.meta.env.BASE_URL, globalThis.location?.href ?? 'http://localhost/');
  if (globalThis.location?.origin && base.origin !== globalThis.location.origin) throw new Error(`Asset ${asset.id}: base deve permanecer na mesma origem da aplicação.`);
  const path = asset.path.replace(/^public\//, ''); const url = new URL(path, base);
  if (url.origin !== base.origin || !['http:', 'https:'].includes(url.protocol) || !url.pathname.endsWith('.glb') || url.search || url.hash || url.username || url.password || path.includes('..') || path.includes('\\') || /%2f|%5c|%2e/i.test(path)) throw new Error(`Asset ${asset.id}: use arquivo GLB aprovado hospedado na mesma origem, sem query/redirect/traversal.`);
  options.signal?.throwIfAborted();
  const response = await fetch(url, { signal: options.signal, redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`Asset ${asset.id}: falha de carregamento HTTP ${response.status}.`);
  if (response.redirected || (response.url && response.url !== url.href)) throw new Error(`Asset ${asset.id}: redirect ou arquivo diferente não aprovado.`);
  const limit = options.maxBytes ?? 64 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > limit) throw new Error(`Asset ${asset.id}: arquivo excede limite de bytes.`);
  const buffer = await response.arrayBuffer(); options.signal?.throwIfAborted();
  if (buffer.byteLength > limit || (options.expectedBytes !== undefined && buffer.byteLength !== options.expectedBytes)) throw new Error(`Asset ${asset.id}: tamanho diferente do aprovado.`);
  if (options.expectedSha256) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== options.expectedSha256) throw new Error(`Asset ${asset.id}: SHA-256 diferente do arquivo aprovado.`);
  }
  inspectGlb(buffer); options.signal?.throwIfAborted();
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  options.signal?.throwIfAborted();
  const ownership = createResourceOwnership();
  const objectUrls = new Set<string>(); let cleanupRequested = false;
  const cleanup = () => { cleanupRequested = true; ownership.dispose(); objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl)); objectUrls.clear(); };
  const manager = new LoadingManager();
  manager.setURLModifier((dependency) => {
    if (!dependency.startsWith('blob:')) throw new Error(`Asset ${asset.id}: dependência de rede não aprovada.`);
    if (cleanupRequested) URL.revokeObjectURL(dependency); else objectUrls.add(dependency);
    return dependency;
  });
  const loader = new GLTFLoader(manager);
  // Public plugin hook + typed parser methods, regression-tested against the pinned Three 0.186.1.
  // Track dependencies and geometry even if another asynchronous branch rejects first.
  loader.register((parser) => {
    const dependency = parser.getDependency.bind(parser);
    parser.getDependency = (type, index) => dependency(type, index).then((value: unknown) => {
      ownership.collect(value);
      if (type === 'texture' && !value) throw new Error(`Asset ${asset.id}: textura requerida falhou na decodificação.`);
      return value;
    });
    const geometry = parser.loadGeometries.bind(parser);
    parser.loadGeometries = (primitives) => Promise.all(primitives.map((primitive) => geometry([primitive]).then((value) => { ownership.collect(value); return value[0]; })));
    const image = parser.loadImageSource.bind(parser);
    parser.loadImageSource = (index, imageLoader) => image(index, imageLoader).then((value) => { ownership.collect(value); return value; });
    const finalMaterial = parser.assignFinalMaterial.bind(parser);
    parser.assignFinalMaterial = (mesh) => { ownership.collect(mesh.material); finalMaterial(mesh); ownership.collect(mesh); };
    return { name: 'ATLAS_RESOURCE_OWNERSHIP', afterRoot: (result) => { ownership.collect(result.scenes); return null; } };
  });
  const abort = () => cleanup(); options.signal?.addEventListener('abort', abort, { once: true });
  let gltf;
  try { gltf = await loader.parseAsync(buffer, new URL('.', url).href); }
  catch (error) { cleanup(); throw error; }
  finally { options.signal?.removeEventListener('abort', abort); }
  const scenes = [...new Set([gltf.scene, ...gltf.scenes])];
  ownership.collect(scenes);
  if (options.signal?.aborted) { cleanup(); options.signal.throwIfAborted(); }
  const missing = asset.nodeNames.filter((name) => !gltf.scene.getObjectByName(name));
  if (missing.length) { cleanup(); throw new Error(`Asset ${asset.id}: nodes ausentes na cena ativa: ${missing.join(', ')}.`); }
  let disposed = false;
  return { scene: gltf.scene, scenes, animations: gltf.animations, dispose: () => { if (disposed) return; disposed = true; cleanup(); } };
}
