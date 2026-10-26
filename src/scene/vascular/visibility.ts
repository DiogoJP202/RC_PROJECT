import { InstancedMesh, Matrix4, Mesh, Object3D, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import type { VascularEntity } from '../../simulation/vascular';

/** Diagnostic sampling of actual triangles, never a camera controller or a render effect. */
export interface VisibilitySource {
  group: Object3D; rbcMesh: InstancedMesh; rcMesh: InstancedMesh; vesselMesh: Mesh;
  entities: readonly VascularEntity[];
}
export interface VisibilityResult {
  id: string; visibleFraction: number; inFrameFraction: number; surfaceRays: number; visibleRays: number;
  blockingIds: string[]; selectedPixelsEstimate: number; grid: number;
}

/** Reusable CPU probes. Calling measure does not change the sampled scene or particle transforms. */
export class VascularVisibilityProbe {
  private readonly ray = new Raycaster();
  private readonly point = new Vector3();
  private readonly pointer = new Vector2();
  private readonly matrix = new Matrix4();
  private readonly instance = new Matrix4();
  private readonly selected = new Mesh();
  private readonly obstacle = new Mesh();
  private readonly poolIndices = new Int32Array(2000);
  private readonly centers = new Float64Array(6000);
  private readonly radii = new Float64Array(2000);
  private readonly hits: ReturnType<Raycaster['intersectObject']> = [];

  measure(source: VisibilitySource, camera: PerspectiveCamera, id: string, width: number, height: number, grid = 9): VisibilityResult {
    const result: VisibilityResult = { id, visibleFraction: 0, inFrameFraction: 0, surfaceRays: 0, visibleRays: 0,
      blockingIds: [], selectedPixelsEstimate: 0, grid };
    const selectedIndex = source.entities.findIndex((entity) => entity.id === id);
    if (selectedIndex < 0) return result;
    source.group.updateWorldMatrix(true, true); camera.updateMatrixWorld(true);
    let rbc = 0, rc = 0;
    for (let i = 0; i < source.entities.length; i++) {
      const entity = source.entities[i], mesh = entity.kind === 'rc' ? source.rcMesh : source.rbcMesh;
      const pool = entity.kind === 'rc' ? rc++ : rbc++;
      this.poolIndices[i] = pool; mesh.getMatrixAt(pool, this.instance);
      this.matrix.multiplyMatrices(mesh.matrixWorld, this.instance);
      this.point.setFromMatrixPosition(this.matrix).toArray(this.centers, i * 3);
      const e = mesh.matrixWorld.elements;
      const scale = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
      this.radii[i] = entity.boundingRadius * scale;
    }
    const entity = source.entities[selectedIndex], mesh = entity.kind === 'rc' ? source.rcMesh : source.rbcMesh;
    mesh.getMatrixAt(this.poolIndices[selectedIndex], this.instance);
    this.selected.geometry = mesh.geometry; this.selected.material = mesh.material;
    this.selected.matrixWorld.multiplyMatrices(mesh.matrixWorld, this.instance);
    const vertices = mesh.geometry.getAttribute('position');
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < vertices.count; i++) {
      this.point.fromBufferAttribute(vertices, i).applyMatrix4(this.selected.matrixWorld).project(camera);
      minX = Math.min(minX, this.point.x); maxX = Math.max(maxX, this.point.x);
      minY = Math.min(minY, this.point.y); maxY = Math.max(maxY, this.point.y);
    }
    if (![minX, maxX, minY, maxY].every(Number.isFinite)) return result;
    result.selectedPixelsEstimate = Math.max(0, maxX - minX) * Math.max(0, maxY - minY) * width * height / 4;
    const blockers = new Set<string>(); let inFrame = 0;
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) {
      const nx = minX + (x + .5) / grid * (maxX - minX), ny = minY + (y + .5) / grid * (maxY - minY);
      this.pointer.set(nx, ny); this.ray.setFromCamera(this.pointer, camera); this.ray.far = Infinity;
      this.hits.length = 0; this.selected.raycast(this.ray, this.hits);
      if (!this.hits.length) continue;
      const distance = Math.min(...this.hits.map((hit) => hit.distance));
      result.surfaceRays++;
      if (Math.abs(nx) > 1 || Math.abs(ny) > 1 || distance < camera.near || distance > camera.far) continue;
      inFrame++;
      this.ray.far = distance - 1e-5;
      let blocked = false;
      if (source.vesselMesh.visible) {
        this.hits.length = 0; source.vesselMesh.raycast(this.ray, this.hits);
        if (this.hits.length) { blocked = true; blockers.add('vessel-wall'); }
      }
      const origin = this.ray.ray.origin, direction = this.ray.ray.direction;
      for (let i = 0; !blocked && i < source.entities.length; i++) {
        if (i === selectedIndex) continue;
        const offset = i * 3, dx = this.centers[offset] - origin.x, dy = this.centers[offset + 1] - origin.y, dz = this.centers[offset + 2] - origin.z;
        const along = dx * direction.x + dy * direction.y + dz * direction.z, radius = this.radii[i];
        if (along + radius < 0 || along - radius > distance) continue;
        const radial2 = dx * dx + dy * dy + dz * dz - along * along;
        if (radial2 > radius * radius) continue;
        const other = source.entities[i], otherMesh = other.kind === 'rc' ? source.rcMesh : source.rbcMesh;
        otherMesh.getMatrixAt(this.poolIndices[i], this.instance);
        this.obstacle.geometry = otherMesh.geometry; this.obstacle.material = otherMesh.material;
        this.obstacle.matrixWorld.multiplyMatrices(otherMesh.matrixWorld, this.instance);
        this.hits.length = 0; this.obstacle.raycast(this.ray, this.hits);
        if (this.hits.length) { blocked = true; blockers.add(other.id); }
      }
      if (!blocked) result.visibleRays++;
    }
    result.visibleFraction = result.surfaceRays ? result.visibleRays / result.surfaceRays : 0;
    result.inFrameFraction = result.surfaceRays ? inFrame / result.surfaceRays : 0;
    result.blockingIds = [...blockers]; return result;
  }
}
