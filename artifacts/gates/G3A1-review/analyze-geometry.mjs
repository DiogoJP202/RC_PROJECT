// Offline G3A.1 diagnostics. CPU-side Three.js buffers only; no browser, WebGL,
// artificial screenshots or product changes. The G3A report remains historical.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Matrix4, Box3, Vector3 } from 'three';
import { ProceduralRinkakuAdapter } from '../../../src/scene/rinkaku/ProceduralRinkakuAdapter.ts';
import { sampleRinkakuAt } from '../../../src/simulation/rinkaku.ts';

const epsilon = 1e-6;
const componentContinuityLimit = .00003;
const rootDriftLimit = 1e-9;
const normalUnitErrorLimit = .0001;
const sourceFiles = [
  '../../../src/scene/rinkaku/ProceduralRinkakuAdapter.ts',
  '../../../src/simulation/rinkaku.ts',
];
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, sha(await fs.readFile(new URL(file, import.meta.url)))])));
const connection = new Matrix4();
const point = new Vector3(), bounds = new Box3();

function pose(adapter, appendageCount, t) {
  const snapshot = sampleRinkakuAt(t, { appendageCount, seed: 17, particles: true, quality: 'standard' });
  adapter.apply(snapshot, connection);
  const inspection = adapter.inspect();
  const branches = adapter.group.children.filter((object) => object.isMesh && !object.isInstancedMesh);
  const attributes = branches.map((mesh) => Object.fromEntries(['position', 'normal', 'color'].map((name) => [name, Float32Array.from(mesh.geometry.getAttribute(name).array)])));
  const particles = adapter.group.children.find((object) => object.isInstancedMesh);
  return { snapshot, inspection, attributes, particles: Float32Array.from(particles.instanceMatrix.array) };
}

function attributeDelta(a, b, attribute) {
  let maxComponent = 0, maxVector = 0, finite = true;
  for (let branch = 0; branch < a.attributes.length; branch++) {
    const aa = a.attributes[branch][attribute], bb = b.attributes[branch][attribute];
    for (let index = 0; index < aa.length; index += 3) {
      const dx = Math.abs(aa[index] - bb[index]);
      const dy = Math.abs(aa[index + 1] - bb[index + 1]);
      const dz = Math.abs(aa[index + 2] - bb[index + 2]);
      maxComponent = Math.max(maxComponent, dx, dy, dz);
      const vector = Math.hypot(dx, dy, dz);
      finite &&= Number.isFinite(vector);
      maxVector = Math.max(maxVector, vector);
    }
  }
  return { maximumComponentDifference: maxComponent, maximumVectorDifference: maxVector, finite };
}

function bufferDigest(current, includeParticles = true) {
  const hash = crypto.createHash('sha256');
  for (const branch of current.attributes) for (const attribute of ['position', 'normal', 'color']) {
    const values = branch[attribute];
    hash.update(new Uint8Array(values.buffer, values.byteOffset, values.byteLength));
  }
  if (includeParticles) hash.update(new Uint8Array(current.particles.buffer, current.particles.byteOffset, current.particles.byteLength));
  return hash.digest('hex');
}

const counts = [];
const failures = [];
for (const appendageCount of [1, 2, 3, 4]) {
  const adapter = new ProceduralRinkakuAdapter();
  const reference = pose(adapter, appendageCount, 0);
  const resources = JSON.stringify(reference.inspection.resourceIds);
  const references = adapter.group.children.slice(0, 4).map((mesh) => Object.fromEntries(['position', 'normal', 'color'].map((name) => [name, mesh.geometry.getAttribute(name).array])));
  let allPositionsFinite = true, allNormalsFinite = true, allColorsFinite = true, allParticlesFinite = true;
  let allVerticesInsideEnvelope = true, maxRootCenterDrift = 0, maxConnectionRootDrift = 0;
  let maxNormalUnitError = 0, resourceIdentitiesStable = true, attributeBuffersStable = true;
  let minimumFootprintClearance = Infinity, minimumNeckClearance = Infinity, minimumFootprintZ = Infinity;
  const phaseObservations = new Map();
  for (let index = 0; index <= 200; index++) {
    const current = pose(adapter, appendageCount, index / 200);
    resourceIdentitiesStable &&= JSON.stringify(current.inspection.resourceIds) === resources;
    adapter.getBounds(bounds);
    for (let branch = 0; branch < 4; branch++) {
      const attributes = current.attributes[branch];
      allPositionsFinite &&= attributes.position.every(Number.isFinite);
      allNormalsFinite &&= attributes.normal.every(Number.isFinite);
      allColorsFinite &&= attributes.color.every(Number.isFinite);
      for (const attribute of ['position', 'normal', 'color']) attributeBuffersStable &&= adapter.group.children[branch].geometry.getAttribute(attribute).array === references[branch][attribute];
      for (let vertex = 0; vertex < attributes.position.length; vertex += 3) {
        point.set(attributes.position[vertex], attributes.position[vertex + 1], attributes.position[vertex + 2]);
        allVerticesInsideEnvelope &&= bounds.containsPoint(point);
        maxNormalUnitError = Math.max(maxNormalUnitError, Math.abs(Math.hypot(attributes.normal[vertex], attributes.normal[vertex + 1], attributes.normal[vertex + 2]) - 1));
      }
    }
    allParticlesFinite &&= current.particles.every(Number.isFinite);
    maxConnectionRootDrift = Math.max(maxConnectionRootDrift, Math.hypot(...current.inspection.root));
    for (let root = 0; root < appendageCount; root++) maxRootCenterDrift = Math.max(maxRootCenterDrift,
      Math.hypot(...current.inspection.roots[root].map((value, axis) => value - reference.inspection.roots[root][axis])));

    // Conservative XY circles around actual ring vertices, not a mesh/body
    // collision test. Row 0 is the skin footprint; row 12 is the narrow neck.
    const footRadii = [], neckRadii = [];
    for (let branch = 0; branch < appendageCount; branch++) {
      const positions = current.attributes[branch].position;
      const root = current.inspection.roots[branch];
      let footprint = 0, neck = 0;
      for (let column = 0; column < 16; column++) {
        let offset = column * 3;
        footprint = Math.max(footprint, Math.hypot(positions[offset] - root[0], positions[offset + 1] - root[1]));
        minimumFootprintZ = Math.min(minimumFootprintZ, positions[offset + 2]);
        offset = (12 * 16 + column) * 3;
        neck = Math.max(neck, Math.hypot(positions[offset] - root[0], positions[offset + 1] - root[1]));
      }
      footRadii.push(footprint); neckRadii.push(neck);
    }
    for (let a = 0; a < appendageCount; a++) for (let b = a + 1; b < appendageCount; b++) {
      const centerDistance = Math.hypot(current.inspection.roots[a][0] - current.inspection.roots[b][0], current.inspection.roots[a][1] - current.inspection.roots[b][1]);
      minimumFootprintClearance = Math.min(minimumFootprintClearance, centerDistance - footRadii[a] - footRadii[b]);
      minimumNeckClearance = Math.min(minimumNeckClearance, centerDistance - neckRadii[a] - neckRadii[b]);
    }
    if (!phaseObservations.has(current.snapshot.phase)) phaseObservations.set(current.snapshot.phase, { firstSampleT: current.snapshot.t, visible: current.inspection.visible, visibleAppendages: current.inspection.visibleAppendages });
  }

  const boundaries = [.08, .2, .35, .67, .85, .95].map((boundary) => {
    const before = pose(adapter, appendageCount, boundary - epsilon), after = pose(adapter, appendageCount, boundary + epsilon);
    return { boundary, beforeT: before.snapshot.t, afterT: after.snapshot.t, beforePhase: before.snapshot.phase, afterPhase: after.snapshot.phase,
      positions: attributeDelta(before, after, 'position'), normals: attributeDelta(before, after, 'normal'), colors: attributeDelta(before, after, 'color') };
  });
  const first = pose(adapter, appendageCount, .7);
  for (const t of [.2, .7, .3]) pose(adapter, appendageCount, t);
  const repeat = pose(adapter, appendageCount, .7);
  const final = pose(adapter, appendageCount, 1);
  const endingBefore = pose(adapter, appendageCount, 1 - epsilon);
  const ending = { beforeT: endingBefore.snapshot.t, finalT: final.snapshot.t,
    positions: attributeDelta(endingBefore, final, 'position'), normals: attributeDelta(endingBefore, final, 'normal'), colors: attributeDelta(endingBefore, final, 'color'),
    finalVisible: final.inspection.visible, finalVisibleAppendages: final.inspection.visibleAppendages, finalRootExposure: final.snapshot.rootExposure,
    finalAppendageExtension: final.snapshot.appendageExtension, finalParticleCount: final.inspection.particleCount,
    sameRestSurfaceBuffers: bufferDigest(reference, false) === bufferDigest(final, false),
    sameRestAllBuffers: bufferDigest(reference) === bufferDigest(final),
    inactiveParticleBuffersEqual: reference.particles.every((value, index) => value === final.particles[index]),
    endpointNote: 'The surface at t=1 must match the retracted t=0 surface. Inactive particle matrices need not equal t=0 because motionTime intentionally differs by 18; particles must be count=0 and the group hidden. Same-t revisit still requires every particle matrix byte to match.' };
  const revisit = { sequence: [.7, .2, .7, .3, .7], samePositionHash: first.inspection.positionHash === repeat.inspection.positionHash,
    sameAllBufferBytes: bufferDigest(first) === bufferDigest(repeat), sameTips: JSON.stringify(first.inspection.tips) === JSON.stringify(repeat.inspection.tips),
    sameRoots: JSON.stringify(first.inspection.roots) === JSON.stringify(repeat.inspection.roots), positions: attributeDelta(first, repeat, 'position') };
  adapter.dispose(); adapter.dispose();
  const disposed = adapter.inspect();
  const result = { appendageCount, sampleCount: 201, rootsAtRest: reference.inspection.roots, rootAtRest: reference.inspection.root,
    allPositionsFinite, allNormalsFinite, allColorsFinite, allParticlesFinite, allVerticesInsideEnvelope, maxNormalUnitError,
    maxRootCenterDriftSceneUnits: maxRootCenterDrift, maxConnectionRootDriftSceneUnits: maxConnectionRootDrift,
    resourceIdentitiesStable, attributeBuffersStable, resources: reference.inspection.resources, resourceIds: reference.inspection.resourceIds,
    contactRingDiagnostics: { method: 'Minimum distance of root XY centres minus conservative XY ring radii over 201 poses; circles include all sampled ring vertices. Positive clearance applies to these proximal sections only.',
      minimumFootprintClearanceSceneUnits: Number.isFinite(minimumFootprintClearance) ? minimumFootprintClearance : null,
      minimumNeckClearanceSceneUnits: Number.isFinite(minimumNeckClearance) ? minimumNeckClearance : null,
      singleAppendageHasNoPair: appendageCount === 1, minimumFootprintLocalZ: minimumFootprintZ },
    phaseObservations: Object.fromEntries(phaseObservations), boundaries, revisit, ending,
    disposed: { disposed: disposed.disposed, geometryCount: disposed.geometryCount, materialCount: disposed.materialCount, visible: disposed.visible } };
  counts.push(result);
  if (!allPositionsFinite || !allNormalsFinite || !allColorsFinite || !allParticlesFinite || !allVerticesInsideEnvelope) failures.push(`count ${appendageCount}: finite/envelope invariant failed`);
  if (maxNormalUnitError >= normalUnitErrorLimit || maxRootCenterDrift > rootDriftLimit || maxConnectionRootDrift > rootDriftLimit) failures.push(`count ${appendageCount}: normal/root invariant failed`);
  if (!resourceIdentitiesStable || !attributeBuffersStable || !revisit.sameAllBufferBytes || !revisit.samePositionHash || !revisit.sameTips || !revisit.sameRoots) failures.push(`count ${appendageCount}: identity/revisit invariant failed`);
  if (boundaries.some((boundary) => !boundary.positions.finite || !boundary.normals.finite || !boundary.colors.finite || boundary.positions.maximumComponentDifference >= componentContinuityLimit || boundary.colors.maximumComponentDifference >= componentContinuityLimit)) failures.push(`count ${appendageCount}: phase boundary invariant failed`);
  if (ending.positions.maximumComponentDifference >= componentContinuityLimit || ending.colors.maximumComponentDifference >= componentContinuityLimit || ending.finalVisible || ending.finalVisibleAppendages !== 0 || ending.finalRootExposure !== 0 || ending.finalAppendageExtension !== 0 || ending.finalParticleCount !== 0 || !ending.sameRestSurfaceBuffers) failures.push(`count ${appendageCount}: final retraction invariant failed`);
  if (appendageCount > 1 && (minimumFootprintClearance <= 0 || minimumNeckClearance <= 0)) failures.push(`count ${appendageCount}: conservative proximal ring separation failed`);
  if (!disposed.disposed || disposed.geometryCount !== 0 || disposed.materialCount !== 0 || disposed.visible) failures.push(`count ${appendageCount}: disposal invariant failed`);
}
const sourceChanges = [];
for (const [file, hash] of Object.entries(sourceHashes)) if (sha(await fs.readFile(new URL(file, import.meta.url))) !== hash) sourceChanges.push(file);
if (sourceChanges.length) failures.push('Product sources changed while this CPU diagnostic was running; repeat after source freeze.');
const result = { createdAt: new Date().toISOString(), gate: 'G3A.1', method: 'Offline evaluation of the actual sampler and refined procedural adapter in identity connection space; CPU-side Three.js buffers, no WebGL/browser. All four allocated surfaces checked, including hidden branches. Default seed17/standard/particles enabled.',
  epsilon, samplesPerCount: 201, totalPoseSamples: 804, thresholds: { componentContinuityLimit, rootDriftLimit, normalUnitErrorLimit },
  sourceHashes, sourceChanges, counts, failures, passed: failures.length === 0,
  notes: ['Scene units are illustrative, not a physiological RC scale.',
    'Finite positions, fixed roots, positive proximal ring clearances and continuous sampled buffers do not prove collision-free meshes, clean body contact, continuous skin topology or natural motion.',
    'The contact formula approximates the current proxy only; this run does not load a body, GLB, skeleton, renderer or physical phone.',
    'Normals are measured for finiteness/unit length and boundary deltas are reported honestly; no claim of continuous shading at degenerate hidden rest tips follows.',
    'Byte-equal revisit buffers include positions, normals, colors and all 48 particle matrices. They demonstrate this deterministic route/configuration, not human artistic approval.',
    'CPU resource UUIDs/buffers and disposal flags are not renderer-memory, GPU VRAM, FPS or leak measurements.',
    'Actual screenshots, video, E2E and production performance are separate evidence. No previous G3A metric is reused as a new result.'] };
await fs.mkdir(new URL('.', import.meta.url), { recursive: true });
await fs.writeFile(new URL('geometry-review.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ gate: result.gate, samples: result.totalPoseSamples, passed: result.passed, failures,
  counts: counts.map((item) => ({ appendageCount: item.appendageCount, finite: item.allPositionsFinite && item.allNormalsFinite && item.allColorsFinite && item.allParticlesFinite,
    maxRootDrift: item.maxRootCenterDriftSceneUnits, maxNormalUnitError: item.maxNormalUnitError, resourcesStable: item.resourceIdentitiesStable && item.attributeBuffersStable,
    maxBoundaryPositionDelta: Math.max(...item.boundaries.map((boundary) => boundary.positions.maximumVectorDifference)),
    maxBoundaryNormalDelta: Math.max(...item.boundaries.map((boundary) => boundary.normals.maximumVectorDifference)),
    minFootprintClearance: item.contactRingDiagnostics.minimumFootprintClearanceSceneUnits, minNeckClearance: item.contactRingDiagnostics.minimumNeckClearanceSceneUnits,
    revisitIdentical: item.revisit.sameAllBufferBytes, endpointSurfaceEqualsRest: item.ending.sameRestSurfaceBuffers,
    inactiveEndpointParticleBuffersEqual: item.ending.inactiveParticleBuffersEqual })) }, null, 2));
if (failures.length) process.exitCode = 1;
