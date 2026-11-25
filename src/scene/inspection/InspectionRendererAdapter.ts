import {
  BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments,
  Mesh, MeshStandardMaterial, Plane, Vector3, DoubleSide,
  type Intersection, type Raycaster,
} from 'three';
import { sampleCellSurface, type CellularModel } from '../../simulation/cellular';

export interface InspectionCut { axis: 'x' | 'y' | 'z'; position: number }
export type InspectionHit = 'surface' | 'section' | 'rbc';
export const inspectionResources = { created: 0, disposed: 0, active: 0 };

export function makeInspectionGeometry(model: CellularModel): BufferGeometry {
  const dense = model.representation === 'interpretive';
  const rings = dense ? 72 : 48, columns = dense ? 112 : 72;
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const base = new Color(model.kind === 'rbc' ? '#622531' : dense ? '#362630' : '#89958a');
  const crest = new Color(model.kind === 'rbc' ? '#c75b63' : dense ? '#bbcbbe' : '#c6d3bd');
  const color = new Color();
  const vertex = (polar: number, azimuth: number) => {
    const sample = sampleCellSurface(model, polar, azimuth);
    positions.push(sample.x, sample.y, sample.z);
    color.copy(base).lerp(crest, sample.shade);
    colors.push(color.r, color.g, color.b);
  };
  vertex(0, 0);
  for (let row = 1; row < rings; row++) {
    for (let col = 0; col < columns; col++) vertex(row / rings * Math.PI, col / columns * 2 * Math.PI);
  }
  const south = positions.length / 3;
  vertex(Math.PI, 0);
  for (let col = 0; col < columns; col++) {
    const next = (col + 1) % columns;
    indices.push(0, 1 + next, 1 + col);
    for (let row = 0; row < rings - 2; row++) {
      const here = 1 + row * columns;
      indices.push(here + col, here + next, here + col + columns, here + next, here + next + columns, here + col + columns);
    }
    const lastRing = south - columns;
    indices.push(lastRing + col, lastRing + next, south);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.center();
  const size = geometry.boundingBox!.getSize(new Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

interface ModelResources {
  mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  plane: Plane;
}

export class InspectionRendererAdapter {
  readonly group = new Group();
  private readonly pool = new Map<string, ModelResources>();
  private readonly contourGeometry = new BufferGeometry();
  private readonly contour = new LineSegments(this.contourGeometry, new LineBasicMaterial({ color: '#e4c69b', toneMapped: false }));
  private readonly scratch = [new Vector3(), new Vector3(), new Vector3()];
  private cut: InspectionCut | null = null;
  private disposed = false;

  constructor() {
    this.contour.visible = false;
    this.contour.frustumCulled = false;
    this.group.add(this.contour);
    inspectionResources.created++;
    inspectionResources.active++;
  }

  load(model: CellularModel): ModelResources['mesh'] {
    const key = model.kind + ':' + model.representation;
    const saved = this.pool.get(key);
    if (saved) return saved.mesh;
    const geometry = makeInspectionGeometry(model);
    const material = new MeshStandardMaterial({ vertexColors: true, roughness: model.kind === 'rc' ? .81 : .75, metalness: 0, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    const plane = new Plane();
    mesh.visible = false;
    const raycast = mesh.raycast.bind(mesh);
    mesh.raycast = (ray: Raycaster, hits: Intersection[]) => {
      if (!mesh.visible) return;
      const start = hits.length;
      raycast(ray, hits);
      // Raycasting in Three uses geometry; apply the same clip side as the material.
      if (material.clippingPlanes?.length) {
        let result = start;
        for (let i = start; i < hits.length; i++) {
          if (plane.distanceToPoint(hits[i].point) >= -1e-6) hits[result++] = hits[i];
        }
        hits.length = result;
      }
    };
    this.group.add(mesh);
    this.pool.set(key, { mesh, plane });
    return mesh;
  }

  show(primary: CellularModel, reference: CellularModel | null, cut: InspectionCut | null, hidePrimary: boolean) {
    const rc = this.load(primary);
    const rbc = reference ? this.load(reference) : null;
    for (const { mesh, plane } of this.pool.values()) {
      mesh.visible = mesh === rc ? !hidePrimary : mesh === rbc;
      mesh.position.set(0, 0, 0);
      const clipped = mesh === rc && Boolean(cut && !reference);
      const material = mesh.material;
      if (Boolean(material.clippingPlanes?.length) !== clipped) {
        material.clippingPlanes = clipped ? [plane] : null;
        material.needsUpdate = true;
      }
      if (clipped && cut) {
        const box = mesh.geometry.boundingBox!;
        const low = box.min[cut.axis], high = box.max[cut.axis];
        // Keep a tiny margin at the two extreme slices so the contour remains numerically well-defined.
        const offset = low + (high - low) * (.02 + (cut.position + 1) * .48);
        plane.normal.set(0, 0, 0);
        plane.normal[cut.axis] = -1;
        plane.constant = offset;
        this.updateContour(mesh.geometry, cut.axis, offset);
      }
    }
    this.cut = reference ? null : cut;
    this.contour.visible = Boolean(this.cut);
    return { primary: rc, reference: rbc };
  }

  hit(mesh: Mesh): InspectionHit {
    return mesh === this.pool.get('rbc:schematic')?.mesh ? 'rbc' : this.cut ? 'section' : 'surface';
  }

  private updateContour(geometry: BufferGeometry, axis: InspectionCut['axis'], offset: number) {
    const indices = geometry.index!;
    const verts = geometry.getAttribute('position');
    let target = this.contourGeometry.getAttribute('position') as BufferAttribute | undefined;
    if (!target || target.count < indices.count) {
      this.contourGeometry.dispose();
      target = new BufferAttribute(new Float32Array(indices.count * 3), 3).setUsage(DynamicDrawUsage);
      this.contourGeometry.setAttribute('position', target);
    }
    let cursor = 0;
    for (let i = 0; i < indices.count; i += 3) {
      const start = cursor;
      for (let edge = 0; edge < 3; edge++) this.scratch[edge].fromBufferAttribute(verts, indices.getX(i + edge));
      for (let edge = 0; edge < 3; edge++) {
        const a = this.scratch[edge], b = this.scratch[(edge + 1) % 3];
        const d1 = a[axis] - offset, d2 = b[axis] - offset;
        if ((d1 >= 0) === (d2 >= 0)) continue;
        const t = d1 / (d1 - d2);
        target.setXYZ(cursor++, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
      }
      if (cursor - start !== 2) cursor = start;
    }
    this.contourGeometry.setDrawRange(0, cursor);
    target.needsUpdate = true;
  }

  inspect() {
    return { geometries: this.pool.size + 1, contourVertices: this.contour.visible ? this.contourGeometry.drawRange.count : 0,
      bounds: [...this.pool.values()].map(({ mesh }) => ({
        min: mesh.geometry.boundingBox!.min.toArray(), max: mesh.geometry.boundingBox!.max.toArray(), visible: mesh.visible,
      })) };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.group.clear();
    for (const { mesh } of this.pool.values()) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.pool.clear();
    this.contourGeometry.dispose();
    this.contour.material.dispose();
    inspectionResources.disposed++;
    inspectionResources.active--;
  }
}

declare global {
  interface Window { __ATLAS_CELL_RESOURCES__?: () => typeof inspectionResources }
}
if (typeof window !== 'undefined') window.__ATLAS_CELL_RESOURCES__ = () => ({ ...inspectionResources });
