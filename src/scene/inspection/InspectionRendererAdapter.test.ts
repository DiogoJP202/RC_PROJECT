import { Vector3, Raycaster } from 'three';
import { describe, expect, it } from 'vitest';
import { rcCellModel, redCellModel, sampleCellSurface } from '../../simulation/cellular';
import { InspectionRendererAdapter, inspectionResources, makeInspectionGeometry } from './InspectionRendererAdapter';

const identity = { kind: 'rc', id: 'rc:17:0', seed: 17, index: 0 } as const;
const model = rcCellModel(identity, 'interpretive');

describe('cellular inspection geometry', () => {
  it('creates reproducible finite geometry with smooth shared normals and a normalized envelope', () => {
    const a = makeInspectionGeometry(model);
    const b = makeInspectionGeometry(rcCellModel(identity, 'interpretive'));
    const c = makeInspectionGeometry(rcCellModel({ kind: 'rc', id: 'rc:31:8', seed: 31, index: 8 }, 'interpretive'));
    try {
      expect(a.getAttribute('position').array).toEqual(b.getAttribute('position').array);
      expect(a.getAttribute('position').array).not.toEqual(c.getAttribute('position').array);
      const size = a.boundingBox!.getSize(new Vector3());
      expect(Math.max(...size.toArray())).toBeCloseTo(2, 6);
      expect(a.getAttribute('normal').array.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...[0, 1, 2].map((axis) => a.getAttribute('normal').array[axis]))).toBeCloseTo(1, 6);
      expect(a.index!.count / 3).toBe(15904);
    } finally { a.dispose(); b.dispose(); c.dispose(); }
  });

  it('distinguishes mode relief and gives the hemácia a continuous thin centre and thick rim', () => {
    const a = sampleCellSurface(model, 1.63, .9);
    expect(a).not.toEqual(sampleCellSurface(rcCellModel(identity, 'schematic'), 1.63, .9));
    expect(sampleCellSurface(redCellModel, 0, 0).z).toBeGreaterThan(0);
    expect(sampleCellSurface(redCellModel, .95, 0).z).toBeGreaterThan(sampleCellSurface(redCellModel, 0, 0).z);
    expect(sampleCellSurface(redCellModel, Math.PI / 2, .7).z).toBeCloseTo(0, 8);
  });

  it('clips picking and outlines the same plane, reuses resources and disposes idempotently', () => {
    const baseline = { ...inspectionResources };
    const adapter = new InspectionRendererAdapter();
    try {
      const { primary } = adapter.show(model, null, null, false);
      adapter.group.updateMatrixWorld(true);
      const ray = new Raycaster(new Vector3(0, 0, 4), new Vector3(0, 0, -1));
      const first = ray.intersectObject(primary)[0];
      expect(first.point.z).toBeGreaterThan(.2);
      expect(adapter.show(model, null, { axis: 'z', position: 0 }, false).primary).toBe(primary);
      const plane = primary.material.clippingPlanes![0];
      const hits = ray.intersectObject(primary);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every((hit) => plane.distanceToPoint(hit.point) >= -1e-6)).toBe(true);
      expect(adapter.inspect().contourVertices).toBeGreaterThan(40);
      for (const position of [-1, 1]) {
        adapter.show(model, null, { axis: 'z', position }, false);
        expect(adapter.inspect().contourVertices).toBeGreaterThan(0);
      }
      adapter.show(model, redCellModel, null, true);
      expect(ray.intersectObject(primary)).toHaveLength(0);
      expect(adapter.inspect().contourVertices).toBe(0);
    } finally { adapter.dispose(); adapter.dispose(); }
    expect(inspectionResources.active).toBe(baseline.active);
    expect(inspectionResources.disposed - baseline.disposed).toBe(1);
  });
});
