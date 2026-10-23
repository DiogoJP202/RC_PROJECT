import { describe, expect, it } from 'vitest';
import { createProxyGeometries } from './proxyGeometry';

describe('original procedural AssetSlot', () => {
  it('supplies six independently bounded finite semantic meshes', () => {
    const meshes = createProxyGeometries();
    expect(Object.keys(meshes)).toHaveLength(6);
    for (const [id, geometry] of Object.entries(meshes)) {
      const positions = geometry.getAttribute('position');
      expect(positions.count, id).toBeGreaterThan(100);
      expect(Array.from(positions.array).every(Number.isFinite), id).toBe(true);
      expect(Array.from(geometry.getAttribute('normal').array).every(Number.isFinite), id).toBe(true);
      expect(geometry.boundingBox?.isEmpty(), id).toBe(false);
    }
    const surface = meshes['human.surface'].boundingBox!;
    const head = meshes['human.head'].boundingBox!;
    const organ = meshes['ghoul.kakuhou.rinkaku'].boundingBox!;
    expect(head.max.y).toBeCloseTo(1.85, 2);
    expect(surface.min.y).toBeGreaterThanOrEqual(0);
    expect(surface.max.x - surface.min.x).toBeLessThan(0.85);
    expect(organ.max.z).toBeLessThan(0);
    expect(organ.min.y).toBeGreaterThan(0.88);
    Object.values(meshes).forEach((geometry) => geometry.dispose());
  });
});
