import { Box3, InstancedMesh, Line3, Matrix4, Mesh, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { sampleRinkakuAt } from '../../simulation/rinkaku';
import { getAssetCacheStats } from '../../visuals/assets/assetCache';
import { GLB_RINKAKU_AVAILABILITY } from './adapters';
import { ProceduralRinkakuAdapter } from './ProceduralRinkakuAdapter';

const ATTACHMENT = new Matrix4().makeTranslation(0, .98, -.15);

describe('original G3A procedural representation', () => {
  it('re-evaluates the same surface and particles after forward and reverse scrub', () => {
    const adapter = new ProceduralRinkakuAdapter();
    adapter.apply(sampleRinkakuAt(.7), ATTACHMENT);
    const before = adapter.inspect();
    const particleMatrices = (adapter.group.children[4] as InstancedMesh).instanceMatrix.array.slice();
    adapter.apply(sampleRinkakuAt(.2), ATTACHMENT);
    adapter.apply(sampleRinkakuAt(.35), ATTACHMENT);
    adapter.apply(sampleRinkakuAt(.7), ATTACHMENT);
    const after = adapter.inspect();
    expect(after.signature).toBe(before.signature);
    expect(after.root).toEqual(before.root);
    expect(after.roots).toEqual(before.roots);
    expect(after.tips).toEqual(before.tips);
    expect(after.particleCount).toBe(before.particleCount);
    expect((adapter.group.children[4] as InstancedMesh).instanceMatrix.array).toEqual(particleMatrices);
    expect(after.resourceIds).toEqual(before.resourceIds);
    adapter.dispose();
  });

  it('supports one through four independently visible appendages without changing its attachment', () => {
    const adapter = new ProceduralRinkakuAdapter();
    for (const appendageCount of [1, 2, 3, 4]) {
      adapter.apply(sampleRinkakuAt(.9, { appendageCount }), ATTACHMENT);
      const info = adapter.inspect();
      expect(info.visibleAppendages).toBe(appendageCount);
      expect(info.roots).toHaveLength(appendageCount);
      expect(info.tips).toHaveLength(appendageCount);
      expect(info.root).toEqual([0, .98, -.15]);
      expect(adapter.group.children.slice(0, 4).filter((child) => child.visible)).toHaveLength(appendageCount);
      info.roots.forEach((root) => {
        expect(root[2]).toBe(-.15);
        // G3A.1 intentionally separates contact centres instead of stacking .085-radius bulbs.
        expect(Math.abs(root[0])).toBeLessThan(.065);
        expect(Math.abs(root[1] - .98)).toBeLessThan(.065);
      });
    }
    adapter.apply(sampleRinkakuAt(0), ATTACHMENT);
    expect(adapter.inspect().visibleAppendages).toBe(0);
    adapter.apply(sampleRinkakuAt(1), ATTACHMENT);
    expect(adapter.inspect().visibleAppendages).toBe(0);
    adapter.dispose();
  });

  it('keeps positions, normals and transformed poses finite throughout every phase', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const rotated = new Matrix4().makeRotationY(.74).setPosition(.11, .98, -.17);
    const bounds = new Box3();
    const point = new Vector3();
    for (const appendageCount of [1, 2, 3, 4]) for (let frame = 0; frame <= 100; frame++) {
      adapter.apply(sampleRinkakuAt(frame / 100, { seed: 0xffffffff, appendageCount }), rotated);
      adapter.getBounds(bounds);
      let finitePositions = true, contained = true, finiteNormals = true, unitNormals = true;
      for (const child of adapter.group.children.slice(0, 4)) {
        const geometry = (child as Mesh).geometry;
        const positions = geometry.getAttribute('position');
        const normals = geometry.getAttribute('normal');
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(rotated);
          finitePositions &&= Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
          contained &&= bounds.containsPoint(point);
          const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i);
          finiteNormals &&= Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
          unitNormals &&= Math.abs(Math.hypot(nx, ny, nz) - 1) < .0001;
        }
      }
      expect({ finitePositions, contained, finiteNormals, unitNormals }).toEqual({
        finitePositions: true, contained: true, finiteNormals: true, unitNormals: true,
      });
    }
    adapter.dispose();
  });

  it('provides a fixed conservative world envelope while the exposed curve grows and retracts', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const bounds = new Box3();
    adapter.apply(sampleRinkakuAt(.35), ATTACHMENT);
    expect(adapter.getBounds(bounds)).toBe(bounds);
    const before = bounds.clone();
    adapter.apply(sampleRinkakuAt(.9), ATTACHMENT);
    expect(adapter.getBounds(bounds).equals(before)).toBe(true);
    adapter.apply(sampleRinkakuAt(.98), ATTACHMENT);
    expect(adapter.getBounds(bounds).equals(before)).toBe(true);
    const moved = ATTACHMENT.clone().setPosition(2, 3, -4);
    adapter.apply(sampleRinkakuAt(.9), moved);
    adapter.getBounds(bounds);
    expect(bounds.min.x - before.min.x).toBeCloseTo(2);
    expect(bounds.min.y - before.min.y).toBeCloseTo(3 - .98);
    expect(adapter.inspect().root).toEqual([2, 3, -4]);
    adapter.dispose();
  });

  it('uses deterministic seed variation and a tapered curved, non-circular surface', () => {
    const adapter = new ProceduralRinkakuAdapter();
    adapter.apply(sampleRinkakuAt(.9, { seed: 11 }), ATTACHMENT);
    const a = adapter.inspect();
    adapter.apply(sampleRinkakuAt(.9, { seed: 31 }), ATTACHMENT);
    const b = adapter.inspect();
    expect(b.signature).not.toBe(a.signature);
    expect(b.root).toEqual(a.root);
    const geometry = (adapter.group.children[0] as Mesh).geometry;
    const positions = geometry.getAttribute('position');
    const rootSection = new Box3(), middleSection = new Box3(), tipSection = new Box3();
    const point = new Vector3();
    for (let col = 0; col < 16; col++) {
      rootSection.expandByPoint(point.fromBufferAttribute(positions, col));
      middleSection.expandByPoint(point.fromBufferAttribute(positions, 32 * 16 + col));
      tipSection.expandByPoint(point.fromBufferAttribute(positions, 64 * 16 + col));
    }
    expect(tipSection.getSize(point).length()).toBeLessThan(rootSection.getSize(new Vector3()).length() * .02);
    expect(middleSection.getCenter(point).x).toBeLessThan(-.2);
    expect(middleSection.getCenter(point).z).toBeLessThan(-.25);
    expect(Math.abs(rootSection.getSize(point).x - rootSection.getSize(new Vector3()).y)).toBeGreaterThan(.01);
    adapter.dispose();
  });

  it('turns conceptual particles off in low quality or by explicit preference', () => {
    const adapter = new ProceduralRinkakuAdapter();
    adapter.apply(sampleRinkakuAt(.35), ATTACHMENT);
    expect(adapter.inspect().particleCount).toBe(48);
    adapter.apply(sampleRinkakuAt(.35, { quality: 'low' }), ATTACHMENT);
    expect(adapter.inspect().particleCount).toBe(0);
    adapter.apply(sampleRinkakuAt(.35, { particles: false }), ATTACHMENT);
    expect(adapter.inspect().particleCount).toBe(0);
    adapter.dispose();
  });

  it('unfolds curved intermediate sections instead of stretching straight root-to-tip chords', () => {
    const adapter = new ProceduralRinkakuAdapter();
    adapter.apply(sampleRinkakuAt(.53), ATTACHMENT);
    const center = new Vector3(), point = new Vector3(), closest = new Vector3();
    for (const child of adapter.group.children.slice(0, 4)) {
      const positions = (child as Mesh).geometry.getAttribute('position');
      const root = new Vector3().fromBufferAttribute(positions, 65 * 16);
      const tip = new Vector3().fromBufferAttribute(positions, 65 * 16 + 1);
      center.set(0, 0, 0);
      for (let col = 0; col < 16; col++) center.add(point.fromBufferAttribute(positions, 32 * 16 + col));
      center.divideScalar(16);
      new Line3(root, tip).closestPointToPoint(center, true, closest);
      expect(center.distanceTo(closest)).toBeGreaterThan(.065);
    }
    adapter.dispose();
  });

  it('reuses all resource identities and buffers through ten complete reversible cycles', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const resources = adapter.inspect().resourceIds;
    const buffers = adapter.group.children.slice(0, 4).map((child) => (child as Mesh).geometry.getAttribute('position').array);
    const cache = getAssetCacheStats();
    for (let cycle = 0; cycle < 10; cycle++) {
      for (let frame = 0; frame <= 40; frame++) adapter.apply(sampleRinkakuAt(frame / 40), ATTACHMENT);
      for (let frame = 40; frame >= 0; frame--) adapter.apply(sampleRinkakuAt(frame / 40), ATTACHMENT);
      expect(adapter.inspect().resourceIds).toEqual(resources);
      expect(adapter.inspect().resources).toMatchObject({ geometries: 5, materials: 2, textures: 0, allocatedParticles: 48 });
      for (let i = 0; i < 4; i++) expect((adapter.group.children[i] as Mesh).geometry.getAttribute('position').array).toBe(buffers[i]);
    }
    expect(getAssetCacheStats()).toEqual(cache);
    adapter.dispose();
  });

  it('disposes only its own resources exactly once and leaves G2A cache ownership unchanged', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const cache = getAssetCacheStats();
    const geometryDisposals = adapter.group.children.map((child) => vi.spyOn((child as Mesh).geometry, 'dispose'));
    const material = (adapter.group.children[0] as Mesh).material;
    const tissueDispose = vi.spyOn(Array.isArray(material) ? material[0] : material, 'dispose');
    adapter.apply(sampleRinkakuAt(.7), ATTACHMENT);
    adapter.dispose();
    adapter.dispose();
    adapter.apply(sampleRinkakuAt(.9), ATTACHMENT);
    expect(adapter.group.children).toHaveLength(0);
    expect(adapter.inspect()).toMatchObject({ disposed: true, visible: false, geometryCount: 0, materialCount: 0, visibleAppendages: 0 });
    geometryDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1));
    expect(tissueDispose).toHaveBeenCalledTimes(1);
    expect(getAssetCacheStats()).toEqual(cache);
    expect(GLB_RINKAKU_AVAILABILITY.available).toBe(false);
  });

  it('separates the skin footprints and narrow necks for every supported count', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const point = new Vector3(), origin = new Vector3();
    for (const appendageCount of [1, 2, 3, 4]) {
      for (const t of [.14, .275, .53, .76, .9, .98]) {
        adapter.apply(sampleRinkakuAt(t, { appendageCount }), new Matrix4());
        const roots = adapter.inspect().roots;
        for (let a = 0; a < appendageCount; a++) {
          const geometry = (adapter.group.children[a] as Mesh).geometry;
          const positions = geometry.getAttribute('position');
          const colors = geometry.getAttribute('color');
          const material = (adapter.group.children[a] as Mesh).material;
          expect(Array.isArray(material)).toBe(false);
          let neckRadius = 0;
          origin.fromArray(roots[a]);
          for (let col = 0; col < 16; col++) {
            point.fromBufferAttribute(positions, col);
            expect(point.z).toBeGreaterThan(.011);
            expect(colors.getY(col)).toBeGreaterThan(.25); // skin-palette edge, not a pink disc
            point.fromBufferAttribute(positions, 12 * 16 + col);
            neckRadius = Math.max(neckRadius, Math.hypot(point.x - origin.x, point.y - origin.y));
          }
          expect(neckRadius).toBeLessThan(.043);
          for (let b = a + 1; b < appendageCount; b++) {
            const distance = origin.distanceTo(point.fromArray(roots[b]));
            const footprintA = a < 2 ? .047 : .044;
            const footprintB = b < 2 ? .047 : .044;
            expect(distance).toBeGreaterThan(footprintA + footprintB + .008);
          }
        }
      }
    }
    adapter.dispose();
  });

  it('forms activation mounds and release buds before long growth, then tensions fixation folds', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const identity = new Matrix4();
    const mesh = adapter.group.children[0] as Mesh;
    const positions = mesh.geometry.getAttribute('position');
    const point = new Vector3();
    const extent = () => {
      const bounds = new Box3();
      for (let i = 0; i < positions.count; i++) bounds.expandByPoint(point.fromBufferAttribute(positions, i));
      return bounds.getSize(new Vector3());
    };
    adapter.apply(sampleRinkakuAt(.04), identity);
    expect(adapter.group.visible).toBe(false);
    adapter.apply(sampleRinkakuAt(.14), identity);
    expect(adapter.group.visible).toBe(true);
    expect(adapter.inspect().visibleAppendages).toBe(0);
    const activation = extent();
    adapter.apply(sampleRinkakuAt(.275), identity);
    const release = extent();
    expect(release.z).toBeGreaterThan(activation.z * 1.5);
    let releaseNeckZ = 0;
    for (let col = 0; col < 16; col++) releaseNeckZ += positions.getZ(12 * 16 + col) / 16;
    expect(adapter.inspect().tips[0][2]).toBeLessThan(-.08); // a protruding bud, not only a surface mound
    adapter.apply(sampleRinkakuAt(.53), identity);
    expect(extent().length()).toBeGreaterThan(release.length() * 2);
    // Isolate stiffness from motionTime/extension to demonstrate structural, not chromatic differentiation.
    const fixation = sampleRinkakuAt(.76);
    adapter.apply({ ...fixation, visualStiffness: 0 }, identity);
    const soft = Array.from(positions.array);
    adapter.apply({ ...fixation, visualStiffness: 1 }, identity);
    let displacement = 0;
    for (let i = 0; i < soft.length; i++) displacement = Math.max(displacement, Math.abs(soft[i] - positions.array[i]));
    expect(displacement).toBeGreaterThan(.015);
    adapter.apply(sampleRinkakuAt(.9), identity);
    let matureNeckZ = 0;
    for (let col = 0; col < 16; col++) matureNeckZ += positions.getZ(12 * 16 + col) / 16;
    expect(Math.abs(matureNeckZ)).toBeLessThan(Math.abs(releaseNeckZ) * .75);
    const colors = mesh.geometry.getAttribute('color');
    expect(colors.getY(8 * 16)).toBeLessThan(.06); // living tissue reaches the shallow collar; no pale sleeve
    adapter.dispose();
  });

  it('keeps surface positions and colours continuous across every phase boundary and final retraction', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const identity = new Matrix4();
    for (const appendageCount of [1, 2, 3, 4]) {
      for (const boundary of [.08, .2, .35, .67, .85, .95, 1]) {
        adapter.apply(sampleRinkakuAt(boundary - 1e-6, { appendageCount }), identity);
        const before = adapter.group.children.slice(0, 4).map((child) => ({
          position: (child as Mesh).geometry.getAttribute('position').array.slice(),
          color: (child as Mesh).geometry.getAttribute('color').array.slice(),
        }));
        adapter.apply(sampleRinkakuAt(Math.min(1, boundary + 1e-6), { appendageCount }), identity);
        let maximumPosition = 0, maximumColor = 0;
        for (let branch = 0; branch < 4; branch++) {
          const geometry = (adapter.group.children[branch] as Mesh).geometry;
          const position = geometry.getAttribute('position').array;
          const color = geometry.getAttribute('color').array;
          for (let i = 0; i < position.length; i++) {
            maximumPosition = Math.max(maximumPosition, Math.abs(position[i] - before[branch].position[i]));
            maximumColor = Math.max(maximumColor, Math.abs(color[i] - before[branch].color[i]));
          }
        }
        expect(maximumPosition, `count ${appendageCount}, boundary ${boundary}`).toBeLessThan(.00003);
        expect(maximumColor).toBeLessThan(.00003);
      }
    }
    adapter.dispose();
  });

  it('desaturates hypothetical tissue while preserving the skin edge and pose under the evidence filter', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const frame = sampleRinkakuAt(.9);
    adapter.apply(frame, ATTACHMENT);
    const mesh = adapter.group.children[0] as Mesh;
    const colors = mesh.geometry.getAttribute('color');
    const original = colors.array.slice();
    const before = adapter.inspect();
    adapter.setEvidenceFilter(true);
    adapter.apply(frame, ATTACHMENT);
    const after = adapter.inspect();
    expect(after.signature).toBe(before.signature);
    expect(after.resourceIds).toEqual(before.resourceIds);
    expect(colors.array.slice(0, 16 * 3)).toEqual(original.slice(0, 16 * 3));
    expect(colors.getX(32 * 16)).toBeLessThan(original[32 * 16 * 3]);
    expect(colors.getY(32 * 16)).toBeGreaterThan(original[32 * 16 * 3 + 1]);
    adapter.setEvidenceFilter(false);
    adapter.apply(frame, ATTACHMENT);
    expect(colors.array).toEqual(original);
    adapter.dispose();
    expect(() => adapter.setEvidenceFilter(true)).not.toThrow();
  });

  it('buries the terminal mounds before hiding, converges to the same resting surface and preserves resources', () => {
    const adapter = new ProceduralRinkakuAdapter();
    const identity = new Matrix4();
    const resourceIds = adapter.inspect().resourceIds;
    const geometries = adapter.group.children.slice(0, 4).map((child) => (child as Mesh).geometry);
    const positions = geometries.map((geometry) => geometry.getAttribute('position').array);
    const geometryDisposals = geometries.map((geometry) => vi.spyOn(geometry, 'dispose'));
    for (const appendageCount of [1, 2, 3, 4]) {
      adapter.apply(sampleRinkakuAt(0, { appendageCount }), identity);
      const resting = positions.map((buffer) => buffer.slice());
      const roots = adapter.inspect().roots;
      let previousMaximumHeight = Infinity;
      let previousMaximumDiameter = Infinity;
      for (const t of [.998, .999, .9995, .9999, .99999, 1]) {
        adapter.apply(sampleRinkakuAt(t, { appendageCount }), identity);
        let maximumHeight = 0, maximumDiameter = 0;
        for (let branch = 0; branch < 4; branch++) {
          const buffer = positions[branch];
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (let i = 0; i < buffer.length; i += 3) {
            // Contact is inside the proxy skin here; a residual cone must not be
            // allowed to stay at local z≈0 and vanish only when group.visible flips.
            // The proxy contact approximation needs a terminal burial margin:
            // near-coplanar triangles left thin visible seams, especially count3's lower root.
            if (t >= .999) expect(buffer[i + 2]).toBeGreaterThan(.020);
            maximumHeight = Math.max(maximumHeight, Math.abs(buffer[i + 2] - resting[branch][i + 2]));
            minX = Math.min(minX, buffer[i]); maxX = Math.max(maxX, buffer[i]);
            minY = Math.min(minY, buffer[i + 1]); maxY = Math.max(maxY, buffer[i + 1]);
          }
          maximumDiameter = Math.max(maximumDiameter, Math.hypot(maxX - minX, maxY - minY));
          const cap = geometries[branch].getAttribute('position');
          const tip = adapter.inspect().tips[branch];
          if (tip) {
            expect(cap.getX(65 * 16 + 1)).toBeCloseTo(tip[0], 6);
            expect(cap.getY(65 * 16 + 1)).toBeCloseTo(tip[1], 6);
            expect(cap.getZ(65 * 16 + 1)).toBeCloseTo(tip[2], 6);
          }
          expect(geometries[branch].getAttribute('position').array).toBe(positions[branch]);
        }
        expect(maximumHeight).toBeLessThanOrEqual(previousMaximumHeight + .0000001);
        // Burial alone leaves large discs visible through a translucent body.
        // Their projected footprint must itself converge to a point before hiding.
        expect(maximumDiameter).toBeLessThanOrEqual(previousMaximumDiameter + .0000001);
        if (t >= .999) expect(maximumDiameter).toBeLessThan(.0015);
        if (t >= .9999) expect(maximumDiameter).toBeLessThan(.0000005);
        previousMaximumHeight = maximumHeight;
        previousMaximumDiameter = maximumDiameter;
        expect(adapter.inspect().resourceIds).toEqual(resourceIds);
        expect(adapter.inspect().roots).toEqual(roots);
      }
      expect(previousMaximumHeight).toBe(0);
      expect(previousMaximumDiameter).toBe(0);
      expect(positions).toEqual(resting);
      expect(adapter.inspect()).toMatchObject({ visible: false, particleCount: 0 });
    }
    adapter.dispose();
    adapter.dispose();
    geometryDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1));
  });
});
