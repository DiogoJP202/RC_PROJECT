/** CPU measurement against actual triangles; independent of GPU FPS benchmarking. */
import { createServer } from 'vite';
import { PerspectiveCamera } from 'three';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const records = [];
try {
  const current = await server.ssrLoadModule('/src/scene/vascular/ProceduralVascularAdapter.ts');
  const currentCamera = await server.ssrLoadModule('/src/scene/vascular/camera.ts');
  const baseline = await server.ssrLoadModule('/artifacts/local/g4a1-baseline/src/scene/vascular/ProceduralVascularAdapter.ts');
  const baselineCamera = await server.ssrLoadModule('/artifacts/local/g4a1-baseline/src/scene/vascular/camera.ts');
  const { VascularVisibilityProbe } = await server.ssrLoadModule('/src/scene/vascular/visibility.ts');
  const { createVascularSample } = await server.ssrLoadModule('/src/simulation/vascular.ts');
  for (const count of [100, 500, 2000]) for (const seed of [17, 31, 73]) {
    const pair = [];
    for (const [label, Adapter, Camera] of [['before', baseline.ProceduralVascularAdapter, baselineCamera.VascularCameraRig], ['after', current.ProceduralVascularAdapter, currentCamera.VascularCameraRig]]) {
      const adapter = new Adapter({ count, seed }), rig = new Camera(), probe = new VascularVisibilityProbe();
      const camera = new PerspectiveCamera(58, 896 / 638, .06, 60), sample = createVascularSample();
      const id = `rc:${seed}:0`, frames = [];
      for (let step = 0; step <= 80; step++) {
        const seconds = step * .5; adapter.apply(seconds, id);
        adapter.getSample(id, seconds, sample);
        const pose = rig.update(0, 'tracking', seconds, sample, true, true, adapter.getCameraObstacles?.(id));
        camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); camera.lookAt(...pose.target); camera.updateMatrixWorld(true);
        const visibility = probe.measure(adapter, camera, id, 896, 638);
        frames.push({ seconds, fraction: visibility.visibleFraction, inFrame: visibility.inFrameFraction,
          rays: visibility.surfaceRays, blockers: visibility.blockingIds, position: [...pose.position], target: [...pose.target], hash: adapter.inspect().positionHash });
      }
      let run = 0, longest = 0;
      for (const frame of frames) { run = frame.fraction < .2 ? run + .5 : 0; longest = Math.max(longest, run); }
      pair.push({ label, meanVisible: frames.reduce((sum, f) => sum + f.fraction, 0) / frames.length,
        fractionAtLeastHalfVisible: frames.filter((f) => f.fraction >= .5).length / frames.length,
        severeOcclusionSeconds: frames.filter((f) => f.fraction < .2).length * .5, longestSevereSampleRunSeconds: longest, frames });
      adapter.dispose();
    }
    const trajectoryHashesMatch = pair[0].frames.every((frame, index) => frame.hash === pair[1].frames[index].hash);
    records.push({ count, seed, id: `rc:${seed}:0`, trajectoryHashesMatch, before: pair[0], after: pair[1], improvement: pair[1].meanVisible - pair[0].meanVisible });
    console.log(JSON.stringify({ count, seed, hashes: trajectoryHashesMatch, before: pair[0].meanVisible, after: pair[1].meanVisible, improvement: pair[1].meanVisible - pair[0].meanVisible }));
  }
  const meanImprovement = records.reduce((sum, record) => sum + record.improvement, 0) / records.length;
  await mkdir('test-results/atlas-evidence/g4a1', { recursive: true });
  await writeFile(resolve('test-results/atlas-evidence/g4a1/occlusion-study.json'), `${JSON.stringify({ createdAt: new Date().toISOString(),
    method: 'Actual selected-cell triangle silhouettes sampled on a9x9 image-space grid; wall and other cell triangles raycast after conservative sphere broadphase. Static absolute camera references, paired same seed/id/time/profile/FOV. Not pixel-perfect area or physiology.',
    sampleIntervalSeconds: .5, interval: [0, 40], initialTargetMeanImprovement: .1, meanImprovement,
    durationsNote: 'Run durations have0.5s resolution and include endpoints; not continuous exact event timings.', records }, null, 2)}\n`);
} finally { await server.close(); }
