import { Skeleton } from 'three';
import type { BufferGeometry, Material, Object3D, Texture } from 'three';

/** Tracks parser-created resources, including late resolutions after a failed/aborted parse. */
export function createResourceOwnership() {
  const geometries = new Set<BufferGeometry>(); const materials = new Set<Material>();
  const textures = new Set<Texture>(); const skeletons = new Set<Skeleton>();
  const disposed = new WeakSet<object>(); const visited = new WeakSet<object>();
  const closed = new WeakSet<object>(); let disposalRequested = false;
  function texturesIn(value: unknown, seen = new WeakSet<object>()): void {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if ('isTexture' in value && value.isTexture) { textures.add(value as Texture); return; }
    if (Array.isArray(value)) value.forEach((child) => texturesIn(child, seen));
    else Object.values(value).forEach((child) => texturesIn(child, seen));
  }
  function flush(): void {
    materials.forEach((material) => texturesIn(material));
    skeletons.forEach((skeleton) => {
      if (disposed.has(skeleton)) return;
      if (skeleton.boneTexture) disposed.add(skeleton.boneTexture);
      disposed.add(skeleton); skeleton.dispose();
    });
    textures.forEach((texture) => {
      if (disposed.has(texture)) return; disposed.add(texture);
      const source = texture.source?.data; const images = Array.isArray(source) ? source : [source];
      images.forEach((bitmap: unknown) => {
        if (bitmap && typeof bitmap === 'object' && !closed.has(bitmap) && 'close' in bitmap && typeof bitmap.close === 'function') { closed.add(bitmap); bitmap.close(); }
      });
      texture.dispose();
    });
    materials.forEach((material) => { if (!disposed.has(material)) { disposed.add(material); material.dispose(); } });
    geometries.forEach((geometry) => { if (!disposed.has(geometry)) { disposed.add(geometry); geometry.dispose(); } });
  }
  function collect(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) value.forEach(collect);
    else if ('isObject3D' in value && value.isObject3D) {
      // Traverse again when a scene finishes: a previously seen group may now have children.
      (value as Object3D).traverse((node) => {
        if ('geometry' in node) collect(node.geometry);
        if ('material' in node) collect(node.material);
        if ('skeleton' in node) collect(node.skeleton);
      });
    } else if (!visited.has(value)) {
      visited.add(value);
      if ('isBufferGeometry' in value && value.isBufferGeometry) geometries.add(value as BufferGeometry);
      else if ('isMaterial' in value && value.isMaterial) { materials.add(value as Material); texturesIn(value); }
      else if ('isTexture' in value && value.isTexture) textures.add(value as Texture);
      else if (value instanceof Skeleton) skeletons.add(value);
    }
    if (disposalRequested) flush();
  }
  return { collect, dispose: () => { disposalRequested = true; flush(); } };
}
