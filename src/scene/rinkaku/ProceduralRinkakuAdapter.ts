import {
  Box3, BufferGeometry, Color, DynamicDrawUsage, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  Sphere, Uint16BufferAttribute, Vector3,
} from 'three';
import type { RinkakuSnapshot } from '../../simulation/rinkaku';
import type { RinkakuAdapter, RinkakuAdapterInspection } from './adapters';

const LONGITUDINAL = 64;
const RADIAL = 16;
const SURFACE_VERTICES = (LONGITUDINAL + 1) * RADIAL;
const PARTICLES = 48;
const COLLAR_ROWS = 12;
const TAU = Math.PI * 2;
const UP = new Vector3(0, 1, 0);
// The artist-owned footprint belongs to the adapter, not to the body or GLB socket.
// Its narrow necks and separated footprints replace the former intersecting bulbs.
const ROOT_LAYOUTS = [
  [0, 0],
  [-.056, 0, .056, 0],
  [-.058, .046, .058, .046, 0, -.058],
  [-.058, .052, .058, .052, -.054, -.052, .054, -.052],
] as const;
const SKIN = new Color('#899593');
const FLESH = new Color('#89273b');
const FILTERED_FLESH = FLESH.clone().lerp(new Color('#647279'), .55);

interface Appendage {
  mesh: Mesh<BufferGeometry, MeshPhysicalMaterial>;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  tip: Vector3;
}

/** Original surface sculpture, not RC histology or a quantitative soft-body model. */
function createAppendage(material: MeshPhysicalMaterial, ordinal: number): Appendage {
  const positions = new Float32Array((SURFACE_VERTICES + 2) * 3);
  const normals = new Float32Array(positions.length);
  const colors = new Float32Array(positions.length);
  const indices = new Uint16Array((LONGITUDINAL * RADIAL * 2 + RADIAL * 2) * 3);
  let offset = 0;
  for (let row = 0; row <= LONGITUDINAL; row++) {
    for (let col = 0; col < RADIAL; col++) {
      const i = row * RADIAL + col;
      // Filled from the absolute pose below; roots use the body's palette at the buried edge.
      colors[i * 3] = FLESH.r;
      colors[i * 3 + 1] = FLESH.g;
      colors[i * 3 + 2] = FLESH.b;
      if (row < LONGITUDINAL) {
        const next = row * RADIAL + (col + 1) % RADIAL;
        indices[offset++] = i; indices[offset++] = next; indices[offset++] = i + RADIAL;
        indices[offset++] = next; indices[offset++] = next + RADIAL; indices[offset++] = i + RADIAL;
      }
    }
  }
  for (let col = 0; col < RADIAL; col++) {
    const next = (col + 1) % RADIAL;
    indices[offset++] = SURFACE_VERTICES; indices[offset++] = next; indices[offset++] = col;
    indices[offset++] = SURFACE_VERTICES + 1;
    indices[offset++] = LONGITUDINAL * RADIAL + col;
    indices[offset++] = LONGITUDINAL * RADIAL + next;
  }
  colors.set([SKIN.r, SKIN.g, SKIN.b, FLESH.r, FLESH.g, FLESH.b], SURFACE_VERTICES * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3).setUsage(DynamicDrawUsage));
  geometry.setIndex(new Uint16BufferAttribute(indices, 1));
  geometry.boundingBox = new Box3(new Vector3(-1.18, -.82, -1.22), new Vector3(1.18, 1.24, .14));
  geometry.boundingSphere = new Sphere(new Vector3(0, .18, -.54), 1.75);
  geometry.userData = { provenance: 'PROJECT_ORIGINAL', modelStatus: 'conceptual_proxy', anatomyId: 'ghoul.kakuhou.rinkaku' };
  const mesh = new Mesh(geometry, material);
  mesh.name = `G3A_CONCEPTUAL_APPENDAGE_${ordinal + 1}`;
  mesh.userData = { anatomyId: 'ghoul.kakuhou.rinkaku', layer: 'internal', modelStatus: 'conceptual_proxy', appendageIndex: ordinal };
  // Float32BufferAttribute copies its input; keep references to the actual GPU-bound buffers.
  return { mesh, positions: geometry.getAttribute('position').array as Float32Array,
    normals: geometry.getAttribute('normal').array as Float32Array,
    colors: geometry.getAttribute('color').array as Float32Array, tip: new Vector3() };
}

function fraction(value: number): number { return value - Math.floor(value); }
function smooth(value: number): number {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
}

/** Only the adapter's shallow edge approximates a body contact surface; it never edits the body. */
function buriedContactZ(x: number, y: number): number {
  const width = .162 - Math.max(0, y - .03) * .15;
  const depth = .101 - Math.max(0, y) * .08;
  return .112 - depth * Math.sqrt(Math.max(.08, 1 - (x / width) ** 2)) + .004;
}

/** A temporary extrusion gives release a bud, then settles into a shallow mature root. */
function rootLift(snapshot: RinkakuSnapshot): number {
  return .012 * snapshot.kakuhouActivation + .018 * snapshot.rootExposure
    + .055 * snapshot.rootExposure * (1 - snapshot.appendageExtension) ** 2
    + .006 * Math.sqrt(snapshot.appendageExtension);
}

/**
 * Four preallocated deformable surfaces. Every pose is evaluated from the current snapshot;
 * no solver history, wall clock, React updates, per-frame geometry or material allocation.
 */
export class ProceduralRinkakuAdapter implements RinkakuAdapter {
  readonly group = new Group();
  private readonly tissue = new MeshPhysicalMaterial({
    color: '#ffffff', vertexColors: true, roughness: .75, metalness: .005,
    clearcoat: .035, clearcoatRoughness: .72, specularIntensity: .36,
    emissive: '#000000', emissiveIntensity: 0,
  });
  private readonly particleMaterial = new MeshBasicMaterial({ color: '#bb5263', transparent: true, opacity: .58, depthWrite: false });
  private readonly appendages = [0, 1, 2, 3].map((i) => createAppendage(this.tissue, i));
  private readonly particleGeometry = new IcosahedronGeometry(.0046, 0);
  private readonly particles = new InstancedMesh(this.particleGeometry, this.particleMaterial, PARTICLES);
  private readonly envelope = new Box3(new Vector3(-1.18, -.82, -1.22), new Vector3(1.18, 1.24, .14));
  private readonly center = new Vector3();
  private readonly previous = new Vector3();
  private readonly next = new Vector3();
  private readonly tangent = new Vector3();
  private readonly normal = new Vector3();
  private readonly binormal = new Vector3();
  private readonly worldPoint = new Vector3();
  private readonly particleMatrix = new Matrix4();
  private readonly angularCos = new Float64Array(RADIAL);
  private readonly angularSin = new Float64Array(RADIAL);
  private readonly rootX = new Float64Array(4);
  private readonly rootY = new Float64Array(4);
  private readonly neckRadii = new Float64Array(4);
  private readonly fleshColor = FLESH.clone();
  private lastT = 0;
  private lastPhase: RinkakuSnapshot['phase'] = 'rest';
  private count = 4;
  private extension = 0;
  private disposed = false;

  constructor() {
    this.group.name = 'G3A_PROCEDURAL_RINKAKU';
    this.group.matrixAutoUpdate = false;
    this.group.visible = false;
    this.group.userData = { anatomyId: 'ghoul.kakuhou.rinkaku', layer: 'internal', modelStatus: 'conceptual_proxy', disclosure: 'PROXY / CONCEPTUAL MODEL' };
    for (let col = 0; col < RADIAL; col++) {
      this.angularCos[col] = Math.cos(col / RADIAL * TAU);
      this.angularSin[col] = Math.sin(col / RADIAL * TAU);
    }
    for (const appendage of this.appendages) this.group.add(appendage.mesh);
    this.particles.name = 'G3A_CONCEPTUAL_EMISSION';
    this.particles.userData = { disclosure: 'Conceptual particles; not RC cell morphology or scale.' };
    this.particles.instanceMatrix.setUsage(DynamicDrawUsage);
    this.particles.frustumCulled = false;
    this.particles.raycast = () => {};
    this.particles.count = 0;
    this.group.add(this.particles);
  }

  /** Event-level evidence styling leaves the body's contact palette untouched. */
  setEvidenceFilter(enabled: boolean): void {
    if (this.disposed) return;
    this.fleshColor.copy(enabled ? FILTERED_FLESH : FLESH);
    this.particleMaterial.color.set(enabled ? '#727d81' : '#bb5263');
  }

  /** Authored S-curves and depth folds; partial growth unfolds a curled frontier. */
  private sampleCenter(q: number, ordinal: number, snapshot: RinkakuSnapshot, output: Vector3): Vector3 {
    const side = ordinal % 2 ? 1 : -1;
    const upper = ordinal < 2;
    const seedPhase = (snapshot.seed % 65521) / 65521 * TAU;
    const spread = q * q * (3 - 2 * q);
    const flexible = snapshot.appendageMotion * (1 - snapshot.visualStiffness * .6);
    const wave = snapshot.motionTime + ordinal * 1.79 + seedPhase;
    const distal = q * q;
    const hook = Math.pow(q, 6);
    const asymmetry = ordinal === 1 ? .94 : ordinal === 2 ? 1.06 : 1;
    const middle = Math.sin(q * Math.PI);
    const bendPhase = ordinal * .77 + (upper ? 0 : .35);
    const sBend = Math.sin(q * TAU + bendPhase) * middle;
    const depthBend = Math.sin(q * TAU + bendPhase + 1.1) * middle;
    const exposed = snapshot.appendageExtension > 0 ? Math.min(1, q / snapshot.appendageExtension) : 0;
    const unfurl = Math.sin(snapshot.appendageExtension * Math.PI) * exposed * exposed * exposed;
    const emergence = smooth(q / .16);
    const tension = 1 - snapshot.visualStiffness * .2;
    const x = this.rootX[ordinal] + side * asymmetry * (.97 * spread - .19 * hook
      + .085 * Math.sin(q * 5.7 + ordinal * .4) * distal
      + .22 * sBend * emergence * tension - .17 * unfurl)
      + flexible * .08 * distal * Math.sin(wave + q * 4.8);
    const y = this.rootY[ordinal] + (upper
      ? 1.03 * Math.sin(q * 1.96) * q - .14 * hook
      : -.59 * Math.sin(q * 2.1) * q + .36 * hook)
      + .045 * Math.sin(q * 7.1 + ordinal) * distal
      + (upper ? 1 : -1) * (.16 * Math.sin(q * TAU + bendPhase + .8) * middle * emergence * tension - .15 * unfurl)
      + flexible * .09 * distal * Math.cos(wave * .83 + q * 5.2);
    const releaseReach = .045 * snapshot.rootExposure * (1 - snapshot.appendageExtension) ** 2
      * smooth(snapshot.appendageExtension / .006);
    const z = -.98 * q + .16 * spread + .16 * hook
      + .065 * Math.sin(q * 6.2 + ordinal * .9) * distal
      + .19 * depthBend * emergence - .08 * middle + .21 * unfurl
      - releaseReach * exposed
      + flexible * .07 * distal * Math.sin(wave * .91 + q * 6.1);
    return output.set(x, y, z);
  }

  private updateAppendage(appendage: Appendage, ordinal: number, snapshot: RinkakuSnapshot): void {
    const positions = appendage.positions, colors = appendage.colors;
    const extension = snapshot.appendageExtension;
    const thickness = snapshot.appendageThickness;
    const growthVolume = Math.sqrt(Math.max(0, extension)) * (.48 + .52 * thickness);
    const activation = snapshot.kakuhouActivation;
    const exposed = snapshot.rootExposure;
    const footRadius = ordinal < 2 ? .047 : .044;
    const baseRadius = ordinal < 2 ? .076 : .069;
    const neckRadius = .007 * activation + .022 * Math.sqrt(extension) + .007 * exposed;
    const budLift = rootLift(snapshot);
    const rootX = this.rootX[ordinal], rootY = this.rootY[ordinal];
    const maturity = smooth(snapshot.visualStiffness);
    this.neckRadii[ordinal] = neckRadius;
    for (let row = 0; row <= LONGITUDINAL; row++) {
      // The first twelve rings are part of this same indexed surface: buried skin
      // edge → shallow activated mound → narrow living neck → growing tissue.
      const collar = row <= COLLAR_ROWS;
      const p = Math.min(1, row / COLLAR_ROWS);
      const blend = smooth(p);
      const u = collar ? 0 : (row - COLLAR_ROWS) / (LONGITUDINAL - COLLAR_ROWS);
      const q = u * extension;
      this.sampleCenter(q, ordinal, snapshot, this.center);
      this.center.z -= budLift;
      this.sampleCenter(Math.max(0, q - .0003), ordinal, snapshot, this.previous);
      this.sampleCenter(Math.min(1, q + .0003), ordinal, snapshot, this.next);
      this.tangent.subVectors(this.next, this.previous).normalize();
      if (this.tangent.lengthSq() < .5) this.tangent.set(0, 0, -1);
      this.normal.crossVectors(this.tangent, UP).normalize();
      this.binormal.crossVectors(this.tangent, this.normal).normalize();
      // Growing tip stays tapered at the revealed frontier rather than ending in a cut cylinder.
      const taper = Math.pow(Math.max(0, 1 - u * u), .69);
      const belly = .91 + .17 * Math.sin(q * 6.9 + .25) + .08 * Math.sin(q * 14.5 + ordinal);
      const broadening = smooth(q / .17);
      const coreRadius = neckRadius + (baseRadius * growthVolume * belly - neckRadius) * broadening;
      const radius = collar ? footRadius + (neckRadius - footRadius) * blend
        : Math.max(.000025, coreRadius * taper);
      const twist = q * 3.5 + ordinal * .63 + Math.sin(q * 8.3) * .16;
      const twistCos = Math.cos(twist), twistSin = Math.sin(twist);
      const sculpture = maturity * smooth(q / .08);
      for (let col = 0; col < RADIAL; col++) {
        const cos = this.angularCos[col] * twistCos - this.angularSin[col] * twistSin;
        const sin = this.angularSin[col] * twistCos + this.angularCos[col] * twistSin;
        const angle = col / RADIAL * TAU + twist;
        const lobes = 1 + .055 * Math.cos(angle * 3 + q * 10.8) + .035 * Math.sin(angle * 5 - q * 9);
        // Fixation progressively tensions the S-curve and raises three continuous
        // longitudinal cords. This is geometry, not a phase-triggered colour flash.
        const cords = (.012 + .265 * sculpture) * Math.pow(.5 + .5 * Math.cos(angle * 3 + q * 7.5), 3);
        const ridge = (.025 + .035 * sculpture) * Math.cos(q * 67 - angle * 2.1)
          + (.019 + .025 * sculpture) * Math.sin(q * 43 + angle * 3.4 + ordinal);
        const corrugation = lobes + cords + ridge * (.35 + .65 * maturity);
        const broad = radius * corrugation * cos;
        const narrow = radius * (.79 + .08 * Math.sin(q * 5 + ordinal)) * corrugation * sin;
        const offset = (row * RADIAL + col) * 3;
        if (collar) {
          // Keep the contact ring in the skin's tangent plane. Its outermost edge
          // is buried; the middle rises gradually during activation and release.
          const collarTwist = twist * blend;
          const collarCos = this.angularCos[col] * Math.cos(collarTwist) - this.angularSin[col] * Math.sin(collarTwist);
          const collarSin = this.angularSin[col] * Math.cos(collarTwist) + this.angularCos[col] * Math.sin(collarTwist);
          const collarShape = 1 + (corrugation - 1) * blend;
          const x = rootX + radius * collarShape * collarCos;
          const ellipse = .86 + (.79 + .08 * Math.sin(ordinal) - .86) * blend;
          const y = rootY - radius * ellipse * collarShape * collarSin;
          positions[offset] = x;
          positions[offset + 1] = y;
          positions[offset + 2] = buriedContactZ(x, y) * (1 - blend) - budLift * blend;
          // Match the rotating frame at the seam without changing root placement.
          if (row === COLLAR_ROWS) {
            positions[offset] = this.center.x + this.normal.x * broad + this.binormal.x * narrow;
            positions[offset + 1] = this.center.y + this.normal.y * broad + this.binormal.y * narrow;
            positions[offset + 2] = this.center.z + this.normal.z * broad + this.binormal.z * narrow;
          }
        } else {
          positions[offset] = this.center.x + this.normal.x * broad + this.binormal.x * narrow;
          positions[offset + 1] = this.center.y + this.normal.y * broad + this.binormal.y * narrow;
          positions[offset + 2] = this.center.z + this.normal.z * broad + this.binormal.z * narrow;
        }
        // Keep only the buried perimeter skin-coloured. A long pale sleeve reads
        // as a mechanical socket; the living tissue should reach nearly to the body.
        const red = collar ? smooth((p - .1) / .54) * smooth(exposed / .32) : 1;
        const crease = (.04 + .2 * sculpture) * Math.pow(.5 + .5 * Math.cos(angle * 3 + q * 7.5), 8);
        const grain = .95 + .045 * Math.sin(q * 36 + angle * 1.4 + ordinal) - crease;
        colors[offset] = (SKIN.r + (this.fleshColor.r * grain - SKIN.r) * red);
        colors[offset + 1] = (SKIN.g + (this.fleshColor.g * grain - SKIN.g) * red);
        colors[offset + 2] = (SKIN.b + (this.fleshColor.b * grain - SKIN.b) * red);
      }
    }
    this.sampleCenter(0, ordinal, snapshot, this.center);
    positions[SURFACE_VERTICES * 3] = this.center.x;
    positions[SURFACE_VERTICES * 3 + 1] = this.center.y;
    positions[SURFACE_VERTICES * 3 + 2] = buriedContactZ(rootX, rootY) + .006;
    this.sampleCenter(extension, ordinal, snapshot, appendage.tip);
    appendage.tip.z -= budLift;
    positions[SURFACE_VERTICES * 3 + 3] = appendage.tip.x;
    positions[SURFACE_VERTICES * 3 + 4] = appendage.tip.y;
    positions[SURFACE_VERTICES * 3 + 5] = appendage.tip.z;
    colors[SURFACE_VERTICES * 3 + 3] = this.fleshColor.r;
    colors[SURFACE_VERTICES * 3 + 4] = this.fleshColor.g;
    colors[SURFACE_VERTICES * 3 + 5] = this.fleshColor.b;
    // Near rest, collapse the whole contact sculpture into a buried root point.
    // Otherwise the collar's fixed footprint leaves a cone at extension≈0 that
    // disappears only at the visibility threshold. The .02 activity window is an
    // artistic contact blend, independent of transport time or the pure sampler.
    const formation = smooth(Math.max(activation, exposed, extension) / .02);
    if (formation < 1) {
      const footprint = formation * formation;
      for (let offset = 0; offset < positions.length; offset += 3) {
        // Shrink area as well as height: a buried full-size disc is still visible
        // through the observatory's translucent skin. Squaring this same smooth
        // gate removes its footprint before the visibility cutoff, without opacity tricks.
        positions[offset] = rootX + (positions[offset] - rootX) * footprint;
        positions[offset + 1] = rootY + (positions[offset + 1] - rootY) * footprint;
        // Extra burial only at this terminal blend accommodates the approximate
        // proxy contact profile; .008 is scene-art clearance, not anatomy or RC scale.
        const contact = buriedContactZ(positions[offset], positions[offset + 1]) + .008;
        positions[offset + 2] = contact + (positions[offset + 2] - contact) * formation;
      }
      appendage.tip.set(positions[SURFACE_VERTICES * 3 + 3],
        positions[SURFACE_VERTICES * 3 + 4], positions[SURFACE_VERTICES * 3 + 5]);
    }
    this.updateNormals(appendage);
    appendage.mesh.geometry.getAttribute('position').needsUpdate = true;
    appendage.mesh.geometry.getAttribute('normal').needsUpdate = true;
    appendage.mesh.geometry.getAttribute('color').needsUpdate = true;
  }

  /** Finite differences on the deformed surface, using the existing attribute storage. */
  private updateNormals(appendage: Appendage): void {
    const p = appendage.positions, n = appendage.normals;
    for (let row = 0; row <= LONGITUDINAL; row++) {
      const before = Math.max(0, row - 1) * RADIAL;
      const after = Math.min(LONGITUDINAL, row + 1) * RADIAL;
      for (let col = 0; col < RADIAL; col++) {
        const left = (row * RADIAL + (col + RADIAL - 1) % RADIAL) * 3;
        const right = (row * RADIAL + (col + 1) % RADIAL) * 3;
        const back = (before + col) * 3, front = (after + col) * 3;
        const ax = p[right] - p[left], ay = p[right + 1] - p[left + 1], az = p[right + 2] - p[left + 2];
        const bx = p[front] - p[back], by = p[front + 1] - p[back + 1], bz = p[front + 2] - p[back + 2];
        const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const i = (row * RADIAL + col) * 3;
        if (length > 1e-14) { n[i] = nx / length; n[i + 1] = ny / length; n[i + 2] = nz / length; }
        else { n[i] = this.angularCos[col]; n[i + 1] = this.angularSin[col]; n[i + 2] = 0; }
      }
    }
    n[SURFACE_VERTICES * 3] = 0; n[SURFACE_VERTICES * 3 + 1] = 0; n[SURFACE_VERTICES * 3 + 2] = 1;
    n[SURFACE_VERTICES * 3 + 3] = 0; n[SURFACE_VERTICES * 3 + 4] = 0; n[SURFACE_VERTICES * 3 + 5] = -1;
  }

  apply(snapshot: RinkakuSnapshot, connection: Matrix4): void {
    if (this.disposed) return;
    this.lastT = snapshot.t;
    this.lastPhase = snapshot.phase;
    this.count = snapshot.appendageCount;
    this.extension = snapshot.appendageExtension;
    const layout = ROOT_LAYOUTS[this.count - 1];
    for (let i = 0; i < 4; i++) {
      this.rootX[i] = i < this.count ? layout[i * 2] : ROOT_LAYOUTS[3][i * 2];
      this.rootY[i] = i < this.count ? layout[i * 2 + 1] : ROOT_LAYOUTS[3][i * 2 + 1];
    }
    this.group.matrix.copy(connection);
    this.group.matrixWorldNeedsUpdate = true;
    this.group.visible = snapshot.kakuhouActivation > .00001 || snapshot.rootExposure > .00001;
    this.tissue.roughness = .78 - snapshot.visualStiffness * .09;
    this.tissue.clearcoat = .025 + snapshot.visualStiffness * .04;
    for (let i = 0; i < this.appendages.length; i++) {
      const appendage = this.appendages[i];
      appendage.mesh.visible = i < this.count;
      // Re-evaluate hidden branches too so scrub/quality/count never retains an earlier pose.
      this.updateAppendage(appendage, i, snapshot);
    }
    const particleCount = snapshot.particles && snapshot.quality !== 'low'
      ? Math.floor(PARTICLES * snapshot.particleEmission) : 0;
    this.particles.count = particleCount;
    this.particles.visible = particleCount > 0;
    // Populate inactive slots too: even the backing buffer has no prior-pose dependency.
    for (let i = 0; i < PARTICLES; i++) {
      const progress = fraction(i * .61803398875 + snapshot.motionTime * .145);
      const q = Math.min(snapshot.appendageExtension, .43) * progress;
      this.sampleCenter(q, i % this.count, snapshot, this.center);
      const phase = i * 2.3999632297 + snapshot.motionTime;
      const radius = .018 + .032 * progress;
      this.center.x += Math.cos(phase) * radius;
      this.center.y += Math.sin(phase) * radius;
      this.center.z -= rootLift(snapshot) + progress * .02;
      this.particleMatrix.makeScale(.55 + progress * .5, .55 + progress * .5, .55 + progress * .5);
      this.particleMatrix.setPosition(this.center);
      this.particles.setMatrixAt(i, this.particleMatrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
    this.group.updateMatrixWorld(true);
  }

  getBounds(output: Box3): Box3 {
    this.group.updateWorldMatrix(true, false);
    return output.copy(this.envelope).applyMatrix4(this.group.matrixWorld);
  }

  inspect(): RinkakuAdapterInspection {
    let hash = 2166136261;
    for (const appendage of this.appendages) for (const value of appendage.positions) {
      hash = Math.imul(hash ^ Math.round(value * 1e6), 16777619);
    }
    this.group.updateWorldMatrix(true, false);
    return {
      representation: 'procedural_proxy', disclosure: 'PROXY / CONCEPTUAL MODEL',
      disposed: this.disposed, visible: this.group.visible, t: this.lastT, phase: this.lastPhase,
      appendageCount: this.count, geometryCount: this.disposed ? 0 : 5, materialCount: this.disposed ? 0 : 2,
      vertexCount: this.disposed ? 0 : (SURFACE_VERTICES + 2) * 4 + this.particleGeometry.getAttribute('position').count,
      triangleCount: this.disposed ? 0 : this.appendages[0].mesh.geometry.getIndex()!.count / 3 * 4,
      particleCapacity: PARTICLES, particleCount: this.particles.count,
      positionHash: (hash >>> 0).toString(16).padStart(8, '0'),
      signature: (hash >>> 0).toString(16).padStart(8, '0'),
      visibleAppendages: this.group.visible && !this.disposed && this.extension > .00001 ? this.count : 0,
      resources: { geometries: this.disposed ? 0 : 5, materials: this.disposed ? 0 : 2, textures: 0,
        allocatedVertices: this.disposed ? 0 : (SURFACE_VERTICES + 2) * 4,
        allocatedParticles: this.disposed ? 0 : PARTICLES },
      root: this.worldPoint.set(0, 0, 0).applyMatrix4(this.group.matrixWorld).toArray(),
      roots: this.appendages.slice(0, this.count).map((_, ordinal) =>
        this.worldPoint.set(this.rootX[ordinal], this.rootY[ordinal], 0).applyMatrix4(this.group.matrixWorld).toArray()),
      tips: this.appendages.slice(0, this.count).map((appendage) =>
        this.worldPoint.copy(appendage.tip).applyMatrix4(this.group.matrixWorld).toArray()),
      resourceIds: {
        geometry: [...this.appendages.map((appendage) => appendage.mesh.geometry.uuid), this.particleGeometry.uuid],
        material: [this.tissue.uuid, this.particleMaterial.uuid],
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.group.visible = false;
    for (const appendage of this.appendages) appendage.mesh.geometry.dispose();
    this.particleGeometry.dispose();
    this.tissue.dispose();
    this.particleMaterial.dispose();
    this.particles.dispose();
    this.particles.count = 0;
    this.group.clear();
    this.group.removeFromParent();
  }
}
