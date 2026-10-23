import { Box3, Vector3 } from 'three';
import type { AnatomyId } from '../app/types';
import type { AssetLease } from '../visuals/assets/assetCache';

/** Imperative bridge for scene-space queries, never a second editorial catalog. */
export const assetRuntime: { lease: AssetLease | null; revision: number; animationTime: number } = {
  lease: null, revision: 0, animationTime: 0,
};

export function bindingBounds(id: AnatomyId): Box3 | null {
  const objects = assetRuntime.lease?.bindings.get(id);
  if (!objects?.length) return null;
  const bounds = new Box3();
  for (const object of objects) bounds.union(new Box3().setFromObject(object, true));
  return bounds.isEmpty() ? null : bounds;
}

export function bindingAnchor(id: AnatomyId, output = new Vector3()): Vector3 | null {
  const bounds = bindingBounds(id);
  return bounds ? bounds.getCenter(output) : null;
}
