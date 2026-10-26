import { BackSide, Box3, Matrix4, Raycaster, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createVascularSample, createVesselFrame, vesselAt, VESSEL_MIN_RADIUS, writeVascularAt } from '../../simulation/vascular';
import { getAssetCacheStats } from '../../visuals/assets/assetCache';
import { ProceduralVascularAdapter } from './ProceduralVascularAdapter';

describe('original instanced vascular representation', () => {
  it('uses biconcave RBC volume and a distinct bounded lobed RC shape with finite geometry', () => {
    const adapter = new ProceduralVascularAdapter();
    const rbc = adapter.rbcGeometry.getAttribute('position');
    let centerThickness = 0, rimThickness = 0;
    for (let i = 0; i < rbc.count; i++) {
      const radius = Math.hypot(rbc.getX(i), rbc.getY(i));
      if (radius < .1) centerThickness = Math.max(centerThickness, Math.abs(rbc.getZ(i)));
      if (radius > .7 && radius < .9) rimThickness = Math.max(rimThickness, Math.abs(rbc.getZ(i)));
    }
    expect(rimThickness).toBeGreaterThan(centerThickness * 2.5);
    for (const [geometry, bound] of [[adapter.rbcGeometry, 1.01], [adapter.rcGeometry, 1.2]] as const) {
      const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
      for (let i = 0; i < positions.count; i++) {
        expect(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))).toBeLessThanOrEqual(bound);
        expect([normals.getX(i), normals.getY(i), normals.getZ(i)].every(Number.isFinite)).toBe(true);
      }
    }
    expect(adapter.vesselMaterial.side).toBe(BackSide);
    expect(adapter.rbcMesh.castShadow).toBe(false); expect(adapter.rcMesh.castShadow).toBe(false);
    expect(adapter.rbcMaterial.transparent).toBe(false); expect(adapter.rcMaterial.transparent).toBe(false);
    expect(adapter.vesselBump.image.width).toBe(128);
    expect(adapter.vesselMaterial.bumpMap).toBe(adapter.vesselBump);
    for (const material of [adapter.rbcMaterial, adapter.rcMaterial, adapter.vesselMaterial]) {
      expect(material.isMeshPhysicalMaterial).toBe(true);
      expect(material.specularIntensity).toBeLessThanOrEqual(.22);
      expect(material.metalness).toBe(0);
      expect(material.emissive.getHex()).toBe(0);
    }
    adapter.dispose();
  });

  it('maps each pool instance to a stable entity across profiles and reports removed selections', () => {
    const adapter = new ProceduralVascularAdapter({ count: 2000, seed: 17 });
    const resourceIds = adapter.inspect().resourceIds;
    const rbcBuffer = adapter.rbcMesh.instanceMatrix.array, rcBuffer = adapter.rcMesh.instanceMatrix.array;
    const removed = adapter.entities[800].id;
    const first = adapter.entityForInstance('rc', 0)!;
    adapter.apply(7, removed, false);
    expect(adapter.inspect().selectedPresent).toBe(true);
    adapter.setConfig({ count: 100, seed: 17 });
    expect(adapter.getEntity(removed)).toBeNull();
    expect(adapter.inspect().selectedPresent).toBe(false);
    expect(adapter.inspect().selectedId).toBe(removed);
    expect(adapter.entityForInstance('rc', 0)).toEqual(first);
    expect(adapter.entityForInstance('rc', -1)).toBeNull();
    expect(adapter.entityForInstance('rbc', 5000)).toBeNull();
    for (const count of [500, 2000, 100] as const) {
      adapter.setConfig({ count, seed: 17 });
      expect(adapter.inspect().counts.total).toBe(count);
      expect(adapter.rbcMesh.count + adapter.rcMesh.count).toBe(count);
      for (let i = 0; i < adapter.rcMesh.count; i++) expect(adapter.entityForInstance('rc', i)?.id).toBe(adapter.entityIds.rc[i]);
      expect(adapter.inspect().resourceIds).toEqual(resourceIds);
      expect(adapter.rbcMesh.instanceMatrix.array).toBe(rbcBuffer); expect(adapter.rcMesh.instanceMatrix.array).toBe(rcBuffer);
    }
    adapter.dispose();
  });

  it('reproduces positions and styles without modifying trajectories when selecting or highlighting', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 });
    const selected = adapter.entities[0].id;
    adapter.apply(12.4, selected, true);
    const before = adapter.inspect(), colors = adapter.rcMesh.instanceColor!.array.slice();
    adapter.apply(73, null, false); adapter.apply(0, null, true); adapter.apply(12.4, selected, true);
    expect(adapter.inspect().positionHash).toBe(before.positionHash);
    expect(adapter.rcMesh.instanceColor!.array).toEqual(colors);
    adapter.apply(12.4, null, false);
    expect(adapter.inspect().positionHash).toBe(before.positionHash);
    const output = createVascularSample();
    expect(adapter.getSample(selected, 12.4, output)).toBe(output);
    expect(adapter.getSample('missing', 0, output)).toBeNull();
    adapter.dispose();
  });

  it('preserves both species colors and morphology before, during and after selection', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 });
    const rbc = adapter.entityForInstance('rbc', 0)!, rc = adapter.entityForInstance('rc', 0)!;
    const geometries = [adapter.rbcGeometry, adapter.rcGeometry];
    const shapes = geometries.map((geometry) => geometry.getAttribute('position').array.slice());
    for (const highlight of [false, true]) {
      adapter.apply(12.4, null, highlight);
      const base = [adapter.rbcMesh.instanceColor!.array.slice(), adapter.rcMesh.instanceColor!.array.slice()];
      const hash = adapter.inspect().positionHash;
      for (const entity of [rbc, rc]) {
        adapter.apply(12.4, entity.id, highlight);
        expect(adapter.inspect().positionHash).toBe(hash);
        expect(adapter.rbcMesh.instanceColor!.array).toEqual(base[0]);
        expect(adapter.rcMesh.instanceColor!.array).toEqual(base[1]);
        expect(adapter.inspect().selection).toEqual({ id: entity.id, visible: true, kind: 'external-brackets', depthTest: true, preservesBaseColor: true });
        adapter.apply(12.4, null, highlight);
        expect(adapter.rbcMesh.instanceColor!.array).toEqual(base[0]);
        expect(adapter.rcMesh.instanceColor!.array).toEqual(base[1]);
        expect(adapter.selectionMarker.visible).toBe(false);
      }
    }
    geometries.forEach((geometry, index) => expect(geometry.getAttribute('position').array).toEqual(shapes[index]));
    adapter.dispose();
  });

  it('uses external depth-tested brackets without intercepting cell or wall picking', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 });
    const entity = adapter.entityForInstance('rc', 0)!;
    adapter.apply(5, entity.id);
    adapter.group.updateMatrixWorld(true);
    const sample = adapter.getSample(entity.id, 5, createVascularSample())!;
    const target = new Vector3().fromArray(sample.position), point = new Vector3();
    const marker = adapter.selectionMarker;
    expect(marker.position.toArray()).toEqual(sample.position);
    expect(marker.quaternion.toArray()).toEqual(sample.quaternion);
    expect(adapter.selectionMaterial.depthTest).toBe(true);
    expect(adapter.selectionMaterial.depthWrite).toBe(false);
    expect(marker.renderOrder).toBe(0);
    const brackets = adapter.selectionGeometry.getAttribute('position');
    for (let i = 0; i < brackets.count; i++) {
      point.fromBufferAttribute(brackets, i).applyMatrix4(marker.matrixWorld);
      expect(point.distanceTo(target)).toBeGreaterThan(entity.boundingRadius * 1.15);
      expect(point.distanceTo(target)).toBeLessThan(entity.boundingRadius * 1.17);
    }
    const ray = new Raycaster(target.clone().add(new Vector3(0, 0, 3)), new Vector3(0, 0, -1), 0, 4);
    expect(ray.intersectObject(marker)).toEqual([]);
    const hits = ray.intersectObjects([marker, adapter.rcMesh]);
    expect(hits.some((hit) => hit.object === marker)).toBe(false);
    expect(hits.some((hit) => hit.object === adapter.rcMesh && hit.instanceId === 0)).toBe(true);
    expect(adapter.inspect().draws).toBe(4);
    adapter.apply(5, 'missing');
    expect(marker.visible).toBe(false);
    expect(adapter.inspect().draws).toBe(3);
    adapter.dispose();
  });

  it('reuses global-index obstacle buffers and removes missing selections when profiles shrink', () => {
    const adapter = new ProceduralVascularAdapter({ count: 2000, seed: 17 });
    const selected = adapter.entities[800].id;
    const obstacles = adapter.getCameraObstacles(selected);
    const centers = obstacles.centers, radii = obstacles.radii, sample = createVascularSample();
    expect(centers).toHaveLength(6000); expect(radii).toHaveLength(2000);
    for (const [count, time] of [[2000, 8.4], [500, 23], [100, .2], [2000, 8.4]] as const) {
      adapter.setConfig({ count, seed: 17 }); adapter.apply(time, selected);
      const current = adapter.getCameraObstacles(selected);
      expect(current).toBe(obstacles);
      expect(current.centers).toBe(centers); expect(current.radii).toBe(radii);
      expect(current.count).toBe(count);
      expect(current.selectedIndex).toBe(count > 800 ? 800 : -1);
      expect(adapter.selectionMarker.visible).toBe(count > 800);
      for (let i = 0; i < count; i++) {
        writeVascularAt(time, adapter.entities[i], adapter.config, sample);
        for (let axis = 0; axis < 3; axis++) expect(centers[i * 3 + axis]).toBeCloseTo(sample.position[axis], 5);
        expect(radii[i]).toBeCloseTo(adapter.entities[i].boundingRadius, 7);
      }
      const hash = adapter.inspect().positionHash;
      expect(adapter.getCameraObstacles(null).selectedIndex).toBe(-1);
      expect(adapter.getCameraObstacles('missing').selectedIndex).toBe(-1);
      expect(adapter.inspect().positionHash).toBe(hash);
    }
    adapter.dispose();
    expect(adapter.getCameraObstacles(selected)).toBe(obstacles);
    expect(obstacles.count).toBe(0); expect(obstacles.selectedIndex).toBe(-1);
  });

  it('supports real Three raycast instance selection rather than a fabricated hotspot', () => {
    const adapter = new ProceduralVascularAdapter({ count: 100, seed: 17 });
    adapter.apply(5);
    adapter.group.updateMatrixWorld(true);
    const entity = adapter.entityForInstance('rc', 0)!;
    const sample = adapter.getSample(entity.id, 5, createVascularSample())!;
    const target = new Vector3().fromArray(sample.position);
    const ray = new Raycaster(target.clone().add(new Vector3(0, 0, 3)), new Vector3(0, 0, -1), 0, 4);
    const hit = ray.intersectObject(adapter.rcMesh).find((entry) => entry.instanceId === 0);
    expect(hit).toBeDefined();
    expect(adapter.entityForInstance('rc', hit!.instanceId!)?.id).toBe(entity.id);
    const frame = vesselAt(0, createVesselFrame());
    const wallRay = new Raycaster(new Vector3().fromArray(frame.center), new Vector3().fromArray(frame.normal), 0, 4);
    const wallHit = wallRay.intersectObject(adapter.vesselMesh)[0];
    expect(wallHit).toBeDefined();
    expect(wallHit.distance).toBeGreaterThan(2.19); expect(wallHit.distance).toBeLessThan(2.405);
    adapter.dispose();
  });

  it('contains every transformed cell vertex inside the conservative wall volume at the largest profile', () => {
    const adapter = new ProceduralVascularAdapter({ count: 2000, seed: 17 });
    const matrix = new Matrix4(), point = new Vector3(), center = new Vector3(), sample = createVascularSample();
    for (const time of [.8, 17.9]) {
      adapter.apply(time);
      let maximumRadius = 0;
      for (const kind of ['rbc', 'rc'] as const) {
        const mesh = kind === 'rbc' ? adapter.rbcMesh : adapter.rcMesh;
        const positions = mesh.geometry.getAttribute('position');
        for (let instance = 0; instance < mesh.count; instance++) {
          const entity = adapter.entityForInstance(kind, instance)!;
          writeVascularAt(time, entity, adapter.config, sample);
          center.fromArray(sample.center); mesh.getMatrixAt(instance, matrix);
          for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
            maximumRadius = Math.max(maximumRadius, point.distanceTo(center));
          }
        }
      }
      expect(maximumRadius).toBeLessThan(VESSEL_MIN_RADIUS - .1);
    }
    const frame = createVesselFrame(), wall = adapter.vesselGeometry.getAttribute('position');
    const normals = adapter.vesselGeometry.getAttribute('normal'), bounds = adapter.getBounds(new Box3());
    let maximumWallRadius = 0;
    for (let row = 0; row <= 256; row++) {
      vesselAt(row / 256, frame); center.fromArray(frame.center);
      for (let col = 0; col <= 32; col++) {
        point.fromBufferAttribute(wall, row * 33 + col);
        const radius = point.distanceTo(center);
        expect(radius).toBeGreaterThanOrEqual(VESSEL_MIN_RADIUS - .000001);
        expect(radius).toBeLessThanOrEqual(2.405 + .000001);
        maximumWallRadius = Math.max(maximumWallRadius, radius);
        expect(point.toArray().every(Number.isFinite)).toBe(true);
        expect(bounds.containsPoint(point)).toBe(true);
        expect([normals.getX(row * 33 + col), normals.getY(row * 33 + col), normals.getZ(row * 33 + col)].every(Number.isFinite)).toBe(true);
      }
    }
    // Broad folds add at most .1 outward; retaining the old 2.305 upper bound would reject this intended refinement.
    expect(maximumWallRadius).toBeGreaterThan(2.305);
    adapter.dispose();
  });

  it('keeps resource identities through ten profile/time cycles and disposes only its own resources once', () => {
    const adapter = new ProceduralVascularAdapter();
    const cache = getAssetCacheStats(), ids = adapter.inspect().resourceIds;
    const geometries = [adapter.rbcGeometry, adapter.rcGeometry, adapter.vesselGeometry, adapter.selectionGeometry];
    const materials = [adapter.rbcMaterial, adapter.rcMaterial, adapter.vesselMaterial, adapter.selectionMaterial];
    const disposals = [...geometries, ...materials, adapter.rbcMesh, adapter.rcMesh, adapter.vesselBump].map((resource) => vi.spyOn(resource, 'dispose'));
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const count of [100, 500, 2000] as const) {
        adapter.setConfig({ count, seed: 17 }); adapter.apply(cycle * 8.7, adapter.entities[0].id);
        expect(adapter.inspect().resourceIds).toEqual(ids);
        // The external bracket marker owns one additional geometry/material; the cell pools remain instanced.
        expect(adapter.inspect().resources).toEqual({ geometries: 4, materials: 4, textures: 1, instanceCapacity: 2000 });
        expect(adapter.selectionMarker.visible).toBe(true);
      }
    }
    expect(getAssetCacheStats()).toEqual(cache);
    adapter.dispose(); adapter.dispose(); adapter.apply(1); adapter.setConfig({ count: 100, seed: 17 });
    expect(adapter.group.children).toHaveLength(0);
    expect(adapter.selectionMarker.visible).toBe(false);
    expect(adapter.getCameraObstacles(null).count).toBe(0);
    expect(adapter.inspect().resources).toEqual({ geometries: 0, materials: 0, textures: 0, instanceCapacity: 0 });
    disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1));
    expect(getAssetCacheStats()).toEqual(cache);
  });
});
