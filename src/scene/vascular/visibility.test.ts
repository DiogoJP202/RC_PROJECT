import { Matrix4, PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { ProceduralVascularAdapter } from './ProceduralVascularAdapter';
import { VascularVisibilityProbe } from './visibility';

describe('actual triangle visibility diagnostic', () => {
  it('distinguishes a visible cell from an actual opaque foreground cell without changing transforms', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 }, { wallVisible: false });
    const matrix = new Matrix4(), camera = new PerspectiveCamera(58, 1, .06, 60), probe = new VascularVisibilityProbe();
    camera.position.set(0, 0, 3); camera.lookAt(0, 0, 0);
    // An explicit test fixture; production trajectories are never modified by the probe.
    for (const mesh of [adapter.rbcMesh, adapter.rcMesh]) for (let i = 0; i < mesh.count; i++) mesh.setMatrixAt(i, matrix.makeTranslation(20, 20, 20));
    adapter.rcMesh.setMatrixAt(0, matrix.identity());
    const before = adapter.rcMesh.instanceMatrix.array.slice();
    const visible = probe.measure(adapter, camera, 'rc:17:0', 600, 600);
    expect(visible.surfaceRays).toBeGreaterThan(10); expect(visible.visibleFraction).toBe(1);
    expect(adapter.rcMesh.instanceMatrix.array).toEqual(before);
    adapter.rcMesh.setMatrixAt(1, matrix.makeTranslation(0, 0, 1.3));
    // Bounds in the diagnostic use entity scale, so the blocker fixture must retain it.
    const blockerScale = adapter.entities[8].scale;
    adapter.rcMesh.setMatrixAt(1, matrix.makeScale(blockerScale, blockerScale, blockerScale).setPosition(0, 0, 1.3));
    const selectedScale = adapter.entities[0].scale;
    adapter.rcMesh.setMatrixAt(0, matrix.makeScale(selectedScale, selectedScale, selectedScale));
    const blocked = probe.measure(adapter, camera, 'rc:17:0', 600, 600);
    expect(blocked.visibleFraction).toBeLessThan(.3); expect(blocked.blockingIds).toContain('rc:17:8');
    adapter.dispose();
  });
  it('returns explicit absence and counts offscreen geometry without claiming it is visible', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 });
    const camera = new PerspectiveCamera(58, 1, .06, 60), probe = new VascularVisibilityProbe();
    expect(probe.measure(adapter, camera, 'missing', 400, 400).surfaceRays).toBe(0);
    adapter.dispose();
  });
});
