import type { Object3D } from 'three';

/** Raycaster includes descendants of hidden groups; picking must check the full chain. */
export function isEffectivelyVisible(object: Object3D): boolean {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}
