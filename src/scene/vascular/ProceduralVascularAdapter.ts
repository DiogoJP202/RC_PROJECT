import {
  BackSide, Box3, BufferGeometry, Color, DataTexture, DynamicDrawUsage, Float32BufferAttribute,
  Group, InstancedMesh, LinearFilter, LinearMipmapLinearFilter, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshPhysicalMaterial,
  Quaternion, RepeatWrapping, RGBAFormat, Sphere, Vector3,
} from 'three';
import {
  createParticles, createVascularSample, createVesselFrame, DEFAULT_VASCULAR_CONFIG,
  normalizeVascularConfig, RBC_UNIT_BOUND, RC_UNIT_BOUND, vesselAt, vesselWallRadius, VESSEL_LOOP_RADIUS, VESSEL_RADIUS,
  writeVascularAt,
  type VascularConfig, type VascularEntity, type VascularKind, type VascularSample,
} from '../../simulation/vascular';
import type { CameraObstacles } from './tracking';

const TAU = Math.PI * 2;
const CELL_RADIAL = 24;
const WALL_LENGTH = 256;
const WALL_RADIAL = 32;
const POOL_KINDS = ['rbc', 'rc'] as const;
const RBC_COLOR = new Color('#b74350');
const RC_COLOR = new Color('#b4d2b7');
const MUTED_COLOR = new Color('#56545b');
function createSelectionGeometry(): BufferGeometry {
  const positions: number[] = [];
  for (let plane = 0; plane < 3; plane++) for (let arc = 0; arc < 4; arc++) for (let part = 0; part < 4; part++) {
    for (let end = 0; end < 2; end++) {
      const angle = arc * Math.PI / 2 + (part + end) * .07;
      const point = [0, 0, 0]; point[plane] = Math.cos(angle); point[(plane + 1) % 3] = Math.sin(angle);
      positions.push(...point);
    }
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3));
}

/** Revolved biconcave disc: thin centre, thicker annular rim, rounded edge. No RBC sphere proxy. */
function createRbcGeometry(): BufferGeometry {
  const profile = [[0, -.10], [.4, -.14], [.77, -.29], [.96, -.19], [1, 0],
    [.96, .19], [.77, .29], [.4, .14], [0, .10]];
  const positions = new Float32Array(profile.length * CELL_RADIAL * 3);
  const colors = new Float32Array(positions.length);
  const normals = new Float32Array(positions.length);
  const indices: number[] = [];
  for (let row = 0; row < profile.length; row++) {
    const previous = profile[Math.max(0, row - 1)], next = profile[Math.min(profile.length - 1, row + 1)];
    const dr = next[0] - previous[0], dz = next[1] - previous[1];
    const normalLength = Math.hypot(dr, dz);
    for (let col = 0; col < CELL_RADIAL; col++) {
      const theta = col / CELL_RADIAL * TAU, cosine = Math.cos(theta), sine = Math.sin(theta);
      const offset = (row * CELL_RADIAL + col) * 3;
      positions[offset] = profile[row][0] * cosine; positions[offset + 1] = profile[row][0] * sine; positions[offset + 2] = profile[row][1];
      const pole = row === 0 || row === profile.length - 1;
      normals[offset] = pole ? 0 : dz / normalLength * cosine;
      normals[offset + 1] = pole ? 0 : dz / normalLength * sine;
      normals[offset + 2] = pole ? (row === 0 ? -1 : 1) : -dr / normalLength;
      const shade = .82 + .18 * profile[row][0];
      colors[offset] = shade; colors[offset + 1] = shade; colors[offset + 2] = shade;
      if (row < profile.length - 1) {
        const a = row * CELL_RADIAL + col, b = row * CELL_RADIAL + (col + 1) % CELL_RADIAL;
        indices.push(a, b, a + CELL_RADIAL, b, b + CELL_RADIAL, a + CELL_RADIAL);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { authorship: 'PROJECT_ORIGINAL', representation: 'didactic_biconcave_rbc', disclosure: 'MODELO DIDÁTICO / P1' };
  return geometry;
}

/** Original lobed RC silhouette. No organelles, canonical morphology or micrometric scale. */
function createRcGeometry(): BufferGeometry {
  const latitude = 10;
  const positions = new Float32Array((latitude + 1) * CELL_RADIAL * 3);
  const colors = new Float32Array(positions.length);
  const indices: number[] = [];
  for (let row = 0; row <= latitude; row++) {
    const polar = row / latitude * Math.PI, sine = Math.sin(polar), cosine = Math.cos(polar);
    for (let col = 0; col < CELL_RADIAL; col++) {
      const theta = col / CELL_RADIAL * TAU;
      const radius = .94 + .20 * Math.cos(theta * 3 + .8 * cosine) * Math.pow(sine, .8)
        + .05 * Math.cos(theta * 5 - polar * 3) * sine * sine;
      const offset = (row * CELL_RADIAL + col) * 3;
      positions[offset] = sine * Math.cos(theta) * radius;
      positions[offset + 1] = cosine * radius * .86;
      positions[offset + 2] = sine * Math.sin(theta) * radius * .76;
      const relief = .84 + .13 * Math.sin(theta * 3 + polar * 4) ** 2;
      colors[offset] = relief; colors[offset + 1] = .94; colors[offset + 2] = relief;
      if (row < latitude) {
        const a = row * CELL_RADIAL + col, b = row * CELL_RADIAL + (col + 1) % CELL_RADIAL;
        indices.push(a, b, a + CELL_RADIAL, b, b + CELL_RADIAL, a + CELL_RADIAL);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3)); geometry.setIndex(indices);
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { authorship: 'PROJECT_ORIGINAL', representation: 'hypothetical_rc_surface', disclosure: 'PROXY / CONCEPTUAL MODEL' };
  return geometry;
}

function createWallGeometry(): BufferGeometry {
  const frame = createVesselFrame();
  const positions = new Float32Array((WALL_LENGTH + 1) * (WALL_RADIAL + 1) * 3);
  const colors = new Float32Array(positions.length);
  const uv = new Float32Array((WALL_LENGTH + 1) * (WALL_RADIAL + 1) * 2);
  const indices: number[] = [];
  for (let row = 0; row <= WALL_LENGTH; row++) {
    const u = row / WALL_LENGTH;
    vesselAt(u, frame);
    for (let col = 0; col <= WALL_RADIAL; col++) {
      // Broad folds grow outward only: the previously validated inner envelope is retained.
      const theta = col / WALL_RADIAL * TAU, radius = vesselWallRadius(u, theta)
        + .10 * (.5 + .5 * Math.sin(u * TAU * 3 + theta * 2)) ** 2;
      const x = Math.cos(theta) * radius, y = Math.sin(theta) * radius;
      const offset = (row * (WALL_RADIAL + 1) + col) * 3;
      const uvOffset = (row * (WALL_RADIAL + 1) + col) * 2;
      uv[uvOffset] = u; uv[uvOffset + 1] = col / WALL_RADIAL;
      for (let axis = 0; axis < 3; axis++) positions[offset + axis] = frame.center[axis] + frame.normal[axis] * x + frame.binormal[axis] * y;
      const tone = .76 + .17 * Math.sin(u * TAU * 3 + theta * 2) + .07 * Math.cos(theta * 3 - u * TAU * 2);
      colors[offset] = tone; colors[offset + 1] = tone * .93; colors[offset + 2] = tone * .97;
      if (row < WALL_LENGTH && col < WALL_RADIAL) {
        const a = row * (WALL_RADIAL + 1) + col, b = a + WALL_RADIAL + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3)); geometry.setIndex(indices);
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { authorship: 'PROJECT_ORIGINAL', representation: 'didactic_closed_vessel', disclosure: 'MODELO DIDÁTICO / P1' };
  return geometry;
}

/** Small periodic original height field; surface detail is illustrative, not named histology. */
function createWallBump(): DataTexture {
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * TAU, v = y / size * TAU;
    const height = .5 + .18 * Math.sin(u * 5 + Math.sin(v * 2) * .9)
      + .1 * Math.sin(u * 11 - v * 3) + .06 * Math.cos(u * 17 + v * 5) + .03 * Math.cos(u * 31 - v * 11);
    const value = Math.round(Math.max(0, Math.min(1, height)) * 255), offset = (y * size + x) * 4;
    data[offset] = value; data[offset + 1] = value; data[offset + 2] = value; data[offset + 3] = 255;
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.name = 'G4A_ORIGINAL_DIDACTIC_WALL_RELIEF';
  texture.wrapS = RepeatWrapping; texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2); texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter; texture.generateMipmaps = true;
  texture.needsUpdate = true;
  texture.userData = { authorship: 'PROJECT_ORIGINAL', source: 'CPU periodic height field; no external images.' };
  return texture;
}

export interface ProceduralVascularOptions { wallVisible?: boolean }

/** Owns only original procedural resources. Future GLB adapters must release their lease instead. */
export class ProceduralVascularAdapter {
  readonly group = new Group();
  readonly rbcGeometry = createRbcGeometry();
  readonly rcGeometry = createRcGeometry();
  readonly vesselGeometry = createWallGeometry();
  readonly vesselBump = createWallBump();
  readonly rbcMaterial = new MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: .72, metalness: 0, specularIntensity: .22 });
  readonly rcMaterial = new MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: .78, metalness: 0, specularIntensity: .18 });
  readonly vesselMaterial = new MeshPhysicalMaterial({ color: '#98606a', vertexColors: true, roughness: .94,
    metalness: 0, specularIntensity: .12, side: BackSide, bumpMap: this.vesselBump, bumpScale: .045 });
  readonly selectionGeometry = createSelectionGeometry();
  readonly selectionMaterial = new LineBasicMaterial({ color: '#d7e4c7', depthTest: true, depthWrite: false, toneMapped: false });
  readonly selectionMarker = new LineSegments(this.selectionGeometry, this.selectionMaterial);
  readonly rbcMesh = new InstancedMesh(this.rbcGeometry, this.rbcMaterial, 1750);
  readonly rcMesh = new InstancedMesh(this.rcGeometry, this.rcMaterial, 250);
  readonly vesselMesh = new Mesh(this.vesselGeometry, this.vesselMaterial);
  readonly entityIds: Record<VascularKind, string[]> = { rbc: [], rc: [] };
  readonly bounds = new Box3(new Vector3(-10.55, -3.2, -10.55), new Vector3(10.55, 3.2, 10.55));
  readonly boundingRadius = Object.freeze({ rbc: RBC_UNIT_BOUND, rc: RC_UNIT_BOUND });
  entities: readonly VascularEntity[] = [];
  config: VascularConfig = { ...DEFAULT_VASCULAR_CONFIG };
  private readonly entityById = new Map<string, VascularEntity>();
  private readonly poolIndices: Record<VascularKind, number[]> = { rbc: [], rc: [] };
  private readonly sample = createVascularSample();
  private readonly position = new Vector3();
  private readonly quaternion = new Quaternion();
  private readonly scale = new Vector3();
  private readonly matrix = new Matrix4();
  private readonly color = new Color();
  private seconds = 0;
  private selectedId: string | null = null;
  private highlightRC = false;
  private colorsDirty = true;
  private disposed = false;
  private readonly obstacles: CameraObstacles = { centers: new Float32Array(6000), radii: new Float32Array(2000), count: 0, selectedIndex: -1 };

  constructor(config: unknown = DEFAULT_VASCULAR_CONFIG, options: ProceduralVascularOptions = {}) {
    this.group.name = 'G4A_PROCEDURAL_VASCULAR';
    this.group.userData = { authorship: 'PROJECT_ORIGINAL', disclosure: 'MODELO DIDÁTICO / RC CONCEITUAL / P1' };
    this.rbcMesh.name = 'G4A_RBC_POOL'; this.rcMesh.name = 'G4A_RC_POOL'; this.vesselMesh.name = 'G4A_VESSEL_WALL';
    this.vesselMesh.visible = options.wallVisible !== false;
    for (const kind of POOL_KINDS) {
      const mesh = kind === 'rbc' ? this.rbcMesh : this.rcMesh;
      mesh.userData = { poolKind: kind, representation: kind === 'rbc' ? 'didactic_model' : 'hypothetical_model' };
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.setColorAt(0, this.color.set('#ffffff'));
      mesh.instanceColor!.setUsage(DynamicDrawUsage);
      const bound = VESSEL_LOOP_RADIUS + VESSEL_RADIUS + .3;
      mesh.boundingBox = new Box3(new Vector3(-bound, -3.2, -bound), new Vector3(bound, 3.2, bound));
      mesh.boundingSphere = new Sphere(new Vector3(), 15);
    }
    this.selectionMarker.name = 'G4A1_DIDACTIC_SELECTION_BRACKETS';
    this.selectionMarker.raycast = () => {}; this.selectionMarker.visible = false;
    this.group.add(this.vesselMesh, this.rbcMesh, this.rcMesh, this.selectionMarker);
    this.setConfig(config);
  }

  /** Population commands rebuild CPU identity tables, never geometry, materials or instance capacity. */
  setConfig(value: unknown): void {
    if (this.disposed) return;
    this.config = normalizeVascularConfig(value);
    this.entities = createParticles(this.config);
    this.entityById.clear();
    this.entityIds.rbc.length = 0; this.entityIds.rc.length = 0;
    this.poolIndices.rbc.length = 0; this.poolIndices.rc.length = 0;
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      this.entityById.set(entity.id, entity);
      this.entityIds[entity.kind].push(entity.id); this.poolIndices[entity.kind].push(i);
    }
    this.rbcMesh.count = this.entityIds.rbc.length; this.rcMesh.count = this.entityIds.rc.length;
    this.colorsDirty = true;
    this.apply(this.seconds, this.selectedId, this.highlightRC);
  }

  getEntity(id: string): VascularEntity | null { return this.entityById.get(id) ?? null; }
  getCameraObstacles(selectedId: string | null): CameraObstacles {
    this.obstacles.selectedIndex = selectedId ? this.entityById.get(selectedId)?.index ?? -1 : -1;
    return this.obstacles;
  }
  entityForInstance(kind: VascularKind, instanceId: number): VascularEntity | null {
    if (!Number.isInteger(instanceId) || instanceId < 0 || instanceId >= this.poolIndices[kind].length) return null;
    return this.entities[this.poolIndices[kind][instanceId]] ?? null;
  }
  getSample(id: string, seconds: number, output: VascularSample): VascularSample | null {
    const entity = this.getEntity(id);
    return entity ? writeVascularAt(seconds, entity, this.config, output) : null;
  }
  getBounds(output: Box3): Box3 {
    this.group.updateWorldMatrix(true, false);
    return output.copy(this.bounds).applyMatrix4(this.group.matrixWorld);
  }

  apply(seconds: number, selectedId: string | null = null, highlightRC = false): void {
    if (this.disposed) return;
    this.seconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const recolor = this.colorsDirty || this.selectedId !== selectedId || this.highlightRC !== highlightRC;
    this.selectedId = selectedId; this.highlightRC = highlightRC;
    this.selectionMarker.visible = false; this.obstacles.count = this.entities.length;
    for (let pool = 0; pool < POOL_KINDS.length; pool++) {
      const kind = POOL_KINDS[pool];
      const mesh = kind === 'rbc' ? this.rbcMesh : this.rcMesh;
      const indices = this.poolIndices[kind];
      for (let instance = 0; instance < indices.length; instance++) {
        const entity = this.entities[indices[instance]];
        writeVascularAt(this.seconds, entity, this.config, this.sample);
        const global = indices[instance];
        this.obstacles.centers.set(this.sample.position, global * 3); this.obstacles.radii[global] = entity.boundingRadius;
        if (entity.id === selectedId) {
          this.selectionMarker.visible = true;
          this.selectionMarker.position.fromArray(this.sample.position); this.selectionMarker.quaternion.fromArray(this.sample.quaternion);
          this.selectionMarker.scale.setScalar(entity.boundingRadius * 1.16);
        }
        this.position.fromArray(this.sample.position); this.quaternion.fromArray(this.sample.quaternion); this.scale.setScalar(entity.scale);
        this.matrix.compose(this.position, this.quaternion, this.scale); mesh.setMatrixAt(instance, this.matrix);
        if (recolor) {
          this.color.copy(kind === 'rbc' ? RBC_COLOR : RC_COLOR).multiplyScalar(.9 + entity.phase * .13);
          if (highlightRC && kind === 'rbc') this.color.lerp(MUTED_COLOR, .75).multiplyScalar(.48);
          if (highlightRC && kind === 'rc') this.color.multiplyScalar(1.12);
          mesh.setColorAt(instance, this.color);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (recolor) mesh.instanceColor!.needsUpdate = true;
    }
    this.colorsDirty = false;
  }

  inspect() {
    let hash = 2166136261;
    for (const mesh of [this.rbcMesh, this.rcMesh]) {
      const values = mesh.instanceMatrix.array;
      for (let i = 0; i < mesh.count * 16; i++) hash = Math.imul(hash ^ Math.round(values[i] * 1e6), 16777619);
    }
    const rbcTriangles = this.rbcGeometry.getIndex()!.count / 3, rcTriangles = this.rcGeometry.getIndex()!.count / 3;
    const wallTriangles = this.vesselGeometry.getIndex()!.count / 3;
    return { representation: 'procedural_vascular', disclosure: 'MODELO DIDÁTICO / RC CONCEITUAL / P1', disposed: this.disposed,
      config: { ...this.config }, seconds: this.seconds, selectedId: this.selectedId,
      selectedPresent: this.selectedId !== null && this.entityById.has(this.selectedId), highlightRC: this.highlightRC,
      selection: { id: this.selectedId, visible: this.selectionMarker.visible, kind: 'external-brackets', depthTest: true, preservesBaseColor: true },
      counts: { total: this.disposed ? 0 : this.entities.length, rbc: this.rbcMesh.count, rc: this.rcMesh.count },
      geometry: { rbcVertices: this.rbcGeometry.getAttribute('position').count, rbcTriangles,
        rcVertices: this.rcGeometry.getAttribute('position').count, rcTriangles, wallTriangles },
      triangles: this.disposed ? 0 : rbcTriangles * this.rbcMesh.count + rcTriangles * this.rcMesh.count + (this.vesselMesh.visible ? wallTriangles : 0),
      draws: this.disposed ? 0 : 2 + (this.vesselMesh.visible ? 1 : 0) + (this.selectionMarker.visible ? 1 : 0),
      resources: { geometries: this.disposed ? 0 : 4, materials: this.disposed ? 0 : 4, textures: this.disposed ? 0 : 1, instanceCapacity: this.disposed ? 0 : 2000 },
      resourceIds: { geometry: [this.rbcGeometry.uuid, this.rcGeometry.uuid, this.vesselGeometry.uuid, this.selectionGeometry.uuid],
        material: [this.rbcMaterial.uuid, this.rcMaterial.uuid, this.vesselMaterial.uuid, this.selectionMaterial.uuid], texture: [this.vesselBump.uuid] },
      boundingRadius: this.boundingRadius, bounds: { min: this.bounds.min.toArray(), max: this.bounds.max.toArray(), space: 'local' },
      positionHash: (hash >>> 0).toString(16).padStart(8, '0'),
      instanceIds: { rbc: [...this.entityIds.rbc], rc: [...this.entityIds.rc] } };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.rbcMesh.dispose(); this.rcMesh.dispose();
    this.rbcGeometry.dispose(); this.rcGeometry.dispose(); this.vesselGeometry.dispose();
    this.selectionGeometry.dispose(); this.selectionMaterial.dispose(); this.selectionMarker.visible = false; this.obstacles.count = 0;
    this.vesselBump.dispose();
    this.rbcMaterial.dispose(); this.rcMaterial.dispose(); this.vesselMaterial.dispose();
    this.rbcMesh.count = 0; this.rcMesh.count = 0;
    this.entities = []; this.entityById.clear();
    this.entityIds.rbc.length = 0; this.entityIds.rc.length = 0;
    this.poolIndices.rbc.length = 0; this.poolIndices.rc.length = 0;
    this.group.clear(); this.group.removeFromParent();
  }
}
