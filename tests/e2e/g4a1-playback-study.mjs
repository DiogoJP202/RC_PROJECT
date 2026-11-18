/** CPU study of actual eased tracking playback. No browser, renderer or GPU is created. */
import { createServer } from 'vite';
import { PerspectiveCamera } from 'three';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const HZ = 60, DURATION = 40, STEPS = HZ * DURATION, PROBE_EVERY = 30;
const WIDTH = 896, HEIGHT = 638, NEAR_CELL_GAP = .15;
const cases = [{ count: 500, seed: 17 }, { count: 2000, seed: 17 }, { count: 500, seed: 73 }];
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const records = [];

function visibilitySummary(frames) {
  // The right endpoint is a diagnostic sample, not an additional half-second interval.
  const bins = frames.slice(0, -1);
  let run = 0, longest = 0;
  for (const frame of bins) {
    run = frame.fraction < .2 ? run + PROBE_EVERY / HZ : 0;
    longest = Math.max(longest, run);
  }
  return {
    meanVisible: frames.reduce((sum, frame) => sum + frame.fraction, 0) / frames.length,
    fractionAtLeastHalfVisible: frames.filter((frame) => frame.fraction >= .5).length / frames.length,
    severeOcclusionSeconds: bins.filter((frame) => frame.fraction < .2).length * PROBE_EVERY / HZ,
    longestSevereSampleRunSeconds: longest,
    samplesAtLeastHalfVisible: frames.filter((frame) => frame.fraction >= .5).length,
    sampleCount: frames.length,
  };
}

async function sourceDigest(path) {
  return { path, sha256: createHash('sha256').update(await readFile(resolve(path))).digest('hex') };
}

try {
  const current = await server.ssrLoadModule('/src/scene/vascular/ProceduralVascularAdapter.ts');
  const currentCamera = await server.ssrLoadModule('/src/scene/vascular/camera.ts');
  const baseline = await server.ssrLoadModule('/artifacts/local/g4a1-baseline/src/scene/vascular/ProceduralVascularAdapter.ts');
  const baselineCamera = await server.ssrLoadModule('/artifacts/local/g4a1-baseline/src/scene/vascular/camera.ts');
  const { VascularVisibilityProbe } = await server.ssrLoadModule('/src/scene/vascular/visibility.ts');
  const { createVascularSample } = await server.ssrLoadModule('/src/simulation/vascular.ts');

  for (const { count, seed } of cases) {
    const pair = [], id = `rc:${seed}:0`;
    for (const [label, Adapter, Camera] of [
      ['before', baseline.ProceduralVascularAdapter, baselineCamera.VascularCameraRig],
      ['after', current.ProceduralVascularAdapter, currentCamera.VascularCameraRig],
    ]) {
      const adapter = new Adapter({ count, seed }), rig = new Camera(), probe = new VascularVisibilityProbe();
      const camera = new PerspectiveCamera(58, WIDTH / HEIGHT, .06, 60), sample = createVascularSample();
      const frames = [];
      let positionDigest = 2166136261, minimumCellBoundGap = Infinity, minimumOtherCellBoundGap = Infinity;
      let minimumSelectedDistance = Infinity, maximumSelectedDistance = 0, nearCameraCellFrames = 0, nearCameraOtherCellFrames = 0;
      let maxSpeed = 0, sumSpeed = 0, maxAcceleration = 0, sumAcceleration = 0, minimumUpDot = 1;
      let previousPosition = null, previousVelocity = null, previousUp = null;
      try {
        for (let step = 0; step <= STEPS; step++) {
          const seconds = step / HZ;
          adapter.apply(seconds, id);
          adapter.getSample(id, seconds, sample);
          const obstacles = adapter.getCameraObstacles?.(id);
          // Both runs begin with their real static tracking reference, then use ordinary eased playback.
          const pose = rig.update(step === 0 ? 0 : 1 / HZ, 'tracking', seconds, sample, false, step === 0, obstacles);
          const x = pose.position[0], y = pose.position[1], z = pose.position[2];
          let minimumGap = Infinity, minimumOtherGap = Infinity, rbcIndex = 0, rcIndex = 0;
          // Read the actual matrices already written by each adapter. Baseline has no obstacle API.
          for (let entityIndex = 0; entityIndex < adapter.entities.length; entityIndex++) {
            const entity = adapter.entities[entityIndex];
            const mesh = entity.kind === 'rc' ? adapter.rcMesh : adapter.rbcMesh;
            const instance = entity.kind === 'rc' ? rcIndex++ : rbcIndex++;
            const values = mesh.instanceMatrix.array, offset = instance * 16;
            const cx = values[offset + 12], cy = values[offset + 13], cz = values[offset + 14];
            const gap = Math.hypot(x - cx, y - cy, z - cz) - entity.boundingRadius;
            minimumGap = Math.min(minimumGap, gap);
            if (entity.id !== id) minimumOtherGap = Math.min(minimumOtherGap, gap);
            positionDigest = Math.imul(positionDigest ^ Math.round(cx * 1e6), 16777619);
            positionDigest = Math.imul(positionDigest ^ Math.round(cy * 1e6), 16777619);
            positionDigest = Math.imul(positionDigest ^ Math.round(cz * 1e6), 16777619);
          }
          minimumCellBoundGap = Math.min(minimumCellBoundGap, minimumGap);
          minimumOtherCellBoundGap = Math.min(minimumOtherCellBoundGap, minimumOtherGap);
          const selectedDistance = Math.hypot(x - sample.position[0], y - sample.position[1], z - sample.position[2]);
          minimumSelectedDistance = Math.min(minimumSelectedDistance, selectedDistance);
          maximumSelectedDistance = Math.max(maximumSelectedDistance, selectedDistance);
          if (step > 0) {
            if (minimumGap < NEAR_CELL_GAP) nearCameraCellFrames++;
            if (minimumOtherGap < NEAR_CELL_GAP) nearCameraOtherCellFrames++;
            const velocity = [(x - previousPosition[0]) * HZ, (y - previousPosition[1]) * HZ, (z - previousPosition[2]) * HZ];
            const speed = Math.hypot(...velocity);
            maxSpeed = Math.max(maxSpeed, speed); sumSpeed += speed;
            if (previousVelocity) {
              const acceleration = Math.hypot(...velocity.map((value, axis) => (value - previousVelocity[axis]) * HZ));
              maxAcceleration = Math.max(maxAcceleration, acceleration); sumAcceleration += acceleration;
            }
            minimumUpDot = Math.min(minimumUpDot, pose.up.reduce((sum, value, axis) => sum + value * previousUp[axis], 0));
            previousVelocity = velocity;
          }
          previousPosition = [...pose.position]; previousUp = [...pose.up];
          if (step % PROBE_EVERY === 0) {
            camera.position.fromArray(pose.position); camera.up.fromArray(pose.up);
            camera.lookAt(...pose.target); camera.updateMatrixWorld(true);
            const visibility = probe.measure(adapter, camera, id, WIDTH, HEIGHT);
            frames.push({ step, seconds, fraction: visibility.visibleFraction, inFrame: visibility.inFrameFraction,
              rays: visibility.surfaceRays, blockers: visibility.blockingIds, position: [...pose.position], target: [...pose.target],
              up: [...pose.up], selectedDistance, minimumCellBoundGap: minimumGap, minimumOtherCellBoundGap: minimumOtherGap,
              hash: adapter.inspect().positionHash });
          }
        }
        pair.push({ label, ...visibilitySummary(frames),
          allFramePositionDigest: (positionDigest >>> 0).toString(16).padStart(8, '0'),
          motion: { maxSpeed, meanSpeed: sumSpeed / STEPS, maxAcceleration, meanAcceleration: sumAcceleration / (STEPS - 1), minimumConsecutiveUpDot: minimumUpDot,
            minimumSelectedDistance, maximumSelectedDistance, minimumCellBoundGap, minimumOtherCellBoundGap,
            nearCameraCellFrames, nearCameraCellSeconds: nearCameraCellFrames / HZ,
            nearCameraOtherCellFrames, nearCameraOtherCellSeconds: nearCameraOtherCellFrames / HZ, playbackFrameCount: STEPS }, frames });
      } finally { adapter.dispose(); }
    }
    const sampledMatrixHashesMatch = pair[0].frames.every((frame, index) => frame.hash === pair[1].frames[index].hash);
    const trajectoryHashesMatch = sampledMatrixHashesMatch && pair[0].allFramePositionDigest === pair[1].allFramePositionDigest;
    const record = { count, seed, id, trajectoryHashesMatch, sampledMatrixHashesMatch, before: pair[0], after: pair[1], improvement: pair[1].meanVisible - pair[0].meanVisible };
    records.push(record);
    console.log(JSON.stringify({ count, seed, trajectoryHashesMatch, before: pair[0].meanVisible, after: pair[1].meanVisible,
      improvement: record.improvement, beforeNearCameraFrames: pair[0].motion.nearCameraCellFrames, afterNearCameraFrames: pair[1].motion.nearCameraCellFrames }));
  }

  const sources = await Promise.all([
    'artifacts/local/g4a1-baseline/src/scene/vascular/ProceduralVascularAdapter.ts',
    'artifacts/local/g4a1-baseline/src/scene/vascular/camera.ts',
    'src/scene/vascular/ProceduralVascularAdapter.ts', 'src/scene/vascular/camera.ts',
    'src/scene/vascular/tracking.ts', 'src/scene/vascular/visibility.ts', 'src/simulation/vascular.ts',
  ].map(sourceDigest));
  await mkdir('test-results/atlas-evidence/g4a1', { recursive: true });
  await writeFile(resolve('test-results/atlas-evidence/g4a1/playback-occlusion-study.json'), `${JSON.stringify({ createdAt: new Date().toISOString(),
    method: 'Paired actual eased tracking playback at 60 Hz, with each version initialized to its static t=0 tracking pose. Identical seed, entity, time, population, FOV and viewport. Actual selected-cell triangle silhouette rays sampled every 30 playback frames on the same 9x9 image-space grid. Camera distances use actual instance-matrix centers and conservative full-cell bounding radii, not requested camera targets.',
    limitations: 'CPU diagnostic, not GPU FPS, pixel-perfect area, continuous occlusion timing or physiology. Negative bound gap means overlap of the conservative bounding sphere, not a proven surface intersection. Initial t=0 is included in minima and visibility means; duration bins exclude the final t=40 endpoint. Visibility durations have 0.5 s resolution. Motion and near-camera duration measurements use all 2400 playback steps at 60 Hz.',
    fps: HZ, interval: [0, DURATION], probeEveryFrames: PROBE_EVERY, sampleIntervalSeconds: PROBE_EVERY / HZ,
    nearCameraCellGapThreshold: NEAR_CELL_GAP, viewport: { width: WIDTH, height: HEIGHT, fov: 58, near: .06, far: 60 },
    meanImprovement: records.reduce((sum, record) => sum + record.improvement, 0) / records.length,
    allTrajectoryHashesMatch: records.every((record) => record.trajectoryHashesMatch), sources, records }, null, 2)}\n`);
} finally { await server.close(); }
