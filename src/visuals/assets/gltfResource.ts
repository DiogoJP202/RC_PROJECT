import type { AnimationClip, Material, Mesh, Object3D, Texture } from 'three';
import type { AssetRecord } from '../../../contracts/atlas-schema';

export interface GltfResource { scene: Object3D; animations: AnimationClip[]; dispose: () => void }
export interface AssetLoadOptions { signal?: AbortSignal; baseUrl?: string }

/** Owns only resources created by this load; never dispose a shared AssetSlot. */
export function disposeGltfScene(scene: Object3D): void {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value: unknown) => {
        if (typeof value === 'object' && value !== null && 'isTexture' in value && value.isTexture) textures.add(value as Texture);
      });
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

/** Future GLB seam. No production model is claimed or loaded by the G1 proxy. */
export async function loadGltfResource(asset: AssetRecord, options: AssetLoadOptions = {}): Promise<GltfResource> {
  if (asset.kind !== 'glb' || !['ready', 'proxy'].includes(asset.status) || !asset.path || !asset.license || !asset.attribution || !asset.nodeNames?.length || asset.authorship === 'unknown') {
    throw new Error(`Asset ${asset.id}: arquivo GLB, disponibilidade, licença, autoria, atribuição e nodes são obrigatórios.`);
  }
  const base = new URL(options.baseUrl ?? import.meta.env.BASE_URL, globalThis.location?.href ?? 'http://localhost/');
  const url = new URL(asset.path.replace(/^public\//, ''), base);
  if (url.origin !== base.origin || !url.pathname.endsWith('.glb')) throw new Error(`Asset ${asset.id}: use GLB aprovado hospedado na mesma origem.`);
  options.signal?.throwIfAborted();
  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) throw new Error(`Asset ${asset.id}: falha de carregamento HTTP ${response.status}.`);
  const buffer = await response.arrayBuffer();
  options.signal?.throwIfAborted();
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().parseAsync(buffer, new URL('.', url).href);
  if (options.signal?.aborted) { disposeGltfScene(gltf.scene); options.signal.throwIfAborted(); }
  const missing = asset.nodeNames.filter((name) => !gltf.scene.getObjectByName(name));
  if (missing.length) {
    disposeGltfScene(gltf.scene);
    throw new Error(`Asset ${asset.id}: nodes ausentes na cena ativa: ${missing.join(', ')}.`);
  }
  let disposed = false;
  return { scene: gltf.scene, animations: gltf.animations, dispose: () => {
    if (disposed) return;
    disposeGltfScene(gltf.scene); disposed = true;
  } };
}
