import { describe, expect, it } from 'vitest';
import { createEntity, createParticles, createVascularSample, createVesselFrame, DEFAULT_VASCULAR_CONFIG, FLOW_PERIOD_SECONDS, VESSEL_MIN_RADIUS, writeVascularAt, type VascularConfig } from '../../simulation/vascular';
import { constrainVascularCamera, nearestVesselFrame, VascularCameraRig } from './camera';
import type { CameraObstacles } from './tracking';

const point = (v: number[]) => ({ x: v[0], y: v[1], z: v[2] });
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
function trackingPopulation(config: VascularConfig) {
  const entities = createParticles(config), sample = createVascularSample(), scratch = createVascularSample();
  const obstacles: CameraObstacles = { centers: new Float32Array(config.count * 3), radii: new Float32Array(config.count), count: config.count, selectedIndex: 0 };
  return { sample, obstacles, selected: entities[0], at(seconds: number) {
    for (const entity of entities) {
      writeVascularAt(seconds, entity, config, scratch);
      obstacles.centers.set(scratch.position, entity.index * 3); obstacles.radii[entity.index] = scratch.boundingRadius;
    }
    return writeVascularAt(seconds, entities[0], config, sample);
  } };
}
describe('vascular camera transport', () => {
  it('bounds the actual free camera against the curved conservative envelope', () => {
    const frame = createVesselFrame();
    for (const position of [{ x: 8, y: 9, z: 0 }, { x: -11, y: 2, z: -3 }, { x: NaN, y: 0, z: 0 }]) {
      expect(constrainVascularCamera(position, frame)).toBe(true);
      nearestVesselFrame(position, frame);
      expect(distance(Object.values(position), frame.center)).toBeLessThanOrEqual(VESSEL_MIN_RADIUS - .3 + 1e-8);
    }
  });
  it('tracks across a complete seam without particle mutation, cuts, inversions or wall crossings', () => {
    const entity = createEntity(104), sample = createVascularSample(), rig = new VascularCameraRig(), frame = createVesselFrame();
    const period = FLOW_PERIOD_SECONDS / entity.speed;
    let previous: number[] | null = null, previousUp: number[] | null = null;
    for (let i = 0; i <= 3000; i++) {
      const seconds = i / 60;
      writeVascularAt(seconds, entity, DEFAULT_VASCULAR_CONFIG, sample);
      const before = JSON.stringify(sample);
      const pose = rig.update(1 / 60, 'tracking', seconds, sample);
      expect(JSON.stringify(sample)).toBe(before);
      if (previous) expect(distance(pose.position, previous)).toBeLessThan(.06);
      if (previousUp) expect(pose.up.reduce((sum, v, axis) => sum + v * previousUp![axis], 0)).toBeGreaterThan(.999);
      nearestVesselFrame(point(pose.position), frame);
      expect(distance(pose.position, frame.center)).toBeLessThan(VESSEL_MIN_RADIUS - .3);
      previous = [...pose.position]; previousUp = [...pose.up];
    }
    expect(3000 / 60).toBeGreaterThan(period);
  });
  it('transfers to a distant entity along the vessel instead of cutting across its centre', () => {
    const rig = new VascularCameraRig(), frame = createVesselFrame();
    const sample = writeVascularAt(8, createEntity(0), DEFAULT_VASCULAR_CONFIG, createVascularSample());
    rig.update(0, 'flow', 0, null, true);
    for (let i = 0; i < 300; i++) {
      const pose = rig.update(1 / 60, 'tracking', 8, sample);
      nearestVesselFrame(point(pose.position), frame);
      expect(distance(pose.position, frame.center)).toBeLessThan(VESSEL_MIN_RADIUS - .3);
    }
  });
  it('reduced motion and explicit scrubbing evaluate static poses reproducibly', () => {
    const rig = new VascularCameraRig(), sample = createVascularSample();
    writeVascularAt(11, createEntity(0), DEFAULT_VASCULAR_CONFIG, sample);
    const before = structuredClone(rig.update(0, 'tracking', 11, sample, true));
    writeVascularAt(30, createEntity(0), DEFAULT_VASCULAR_CONFIG, sample); rig.update(.016, 'tracking', 30, sample, true);
    writeVascularAt(11, createEntity(0), DEFAULT_VASCULAR_CONFIG, sample);
    expect(rig.update(0, 'tracking', 11, sample, true)).toEqual(before);
  });
  it('reconstructs adaptive paused, reduced-motion and small-scrub poses independently of playback history', () => {
    const scene = trackingPopulation({ count: 2000, seed: 17 }), rig = new VascularCameraRig();
    const poseBuffer = rig.pose, positionBuffer = rig.pose.position, targetBuffer = rig.pose.target, planBuffer = rig.trackingPlan;
    const time = 11.001;
    const expected = structuredClone(rig.update(0, 'tracking', time, scene.at(time), false, true, scene.obstacles));
    for (const seconds of [30, 0, 11, 11.002, 200, 3]) rig.update(1 / 60, 'tracking', seconds, scene.at(seconds), false, false, scene.obstacles);
    expect(rig.update(0, 'tracking', time, scene.at(time), false, true, scene.obstacles)).toEqual(expected);
    expect(rig.update(.03, 'tracking', time, scene.at(time), true, false, scene.obstacles)).toEqual(expected);
    expect(rig.pose).toBe(poseBuffer); expect(rig.pose.position).toBe(positionBuffer);
    expect(rig.pose.target).toBe(targetBuffer); expect(rig.trackingPlan).toBe(planBuffer);
  });
  it('bounds the complete adaptive camera path and orientation at loop seams in every seed/profile', () => {
    const frame = createVesselFrame();
    let maximumStep = 0, minimumUpDot = 1, maximumAcceleration = 0;
    for (const seed of [17, 31, 73]) for (const count of [100, 500, 2000] as const) {
      const scene = trackingPopulation({ count, seed }), rig = new VascularCameraRig(), replay = new VascularCameraRig();
      const seam = (1 - scene.selected.phase) * FLOW_PERIOD_SECONDS / scene.selected.speed;
      let previous: number[] | null = null, previousUp: number[] | null = null, previousVelocity: number[] | null = null;
      let crossedSeam = false, lastPhase = 0;
      for (let index = 0; index <= 180; index++) {
        const seconds = seam - 1.5 + index / 60, sample = scene.at(seconds);
        if (index && sample.phase < lastPhase) crossedSeam = true;
        lastPhase = sample.phase;
        const pose = rig.update(1 / 60, 'tracking', seconds, sample, false, false, scene.obstacles);
        expect(pose).toEqual(replay.update(1 / 60, 'tracking', seconds, sample, false, false, scene.obstacles));
        if (previous) {
          maximumStep = Math.max(maximumStep, distance(pose.position, previous));
          const velocity = pose.position.map((value, axis) => (value - previous![axis]) * 60);
          if (previousVelocity) maximumAcceleration = Math.max(maximumAcceleration, distance(velocity, previousVelocity) * 60);
          previousVelocity = velocity;
          // The actual renderer connects consecutive positions; check that chord as well.
          for (let fraction = 0; fraction <= 1; fraction += .25) {
            const interpolated = pose.position.map((value, axis) => previous![axis] + (value - previous![axis]) * fraction);
            nearestVesselFrame(point(interpolated), frame);
            expect(distance(interpolated, frame.center)).toBeLessThan(VESSEL_MIN_RADIUS - .3);
          }
        }
        if (previousUp) minimumUpDot = Math.min(minimumUpDot, pose.up.reduce((sum, value, axis) => sum + value * previousUp![axis], 0));
        expect(rig.transport.radialCorrectionSpeed).toBeLessThanOrEqual(1.2 + 1e-12);
        expect(Math.abs(rig.transport.phaseCorrectionSpeed)).toBeLessThanOrEqual(8 + 1e-12);
        previous = [...pose.position]; previousUp = [...pose.up];
      }
      expect(crossedSeam).toBe(true);
    }
    expect(maximumStep).toBeLessThan(.2);
    expect(minimumUpDot).toBeGreaterThan(.999);
    expect(maximumAcceleration).toBeLessThan(15);
  }, 20000);
  it('removes longitudinal following lag and limits correction acceleration throughout a dense 40-second circuit', () => {
    const scene = trackingPopulation({ count: 2000, seed: 17 }), rig = new VascularCameraRig();
    let previous: number[] | null = null, previousVelocity: number[] | null = null;
    let maximumAcceleration = 0, maximumSpeed = 0, maximumPhaseCorrection = 0;
    for (let index = 0; index <= 2400; index++) {
      const seconds = index / 60, pose = rig.update(1 / 60, 'tracking', seconds, scene.at(seconds), false, false, scene.obstacles);
      if (previous) {
        const velocity = pose.position.map((value, axis) => (value - previous![axis]) * 60);
        maximumSpeed = Math.max(maximumSpeed, Math.hypot(...velocity));
        if (previousVelocity) maximumAcceleration = Math.max(maximumAcceleration, distance(velocity, previousVelocity) * 60);
        previousVelocity = velocity;
      }
      maximumPhaseCorrection = Math.max(maximumPhaseCorrection, Math.abs(rig.transport.phaseCorrectionSpeed));
      expect(rig.transport.radialCorrectionSpeed).toBeLessThanOrEqual(1.2 + 1e-12);
      previous = [...pose.position];
    }
    expect(maximumAcceleration).toBeLessThan(15);
    expect(maximumSpeed).toBeLessThan(4);
    expect(maximumPhaseCorrection).toBeLessThan(2);

    // An unobstructed moving target has no changing camera offset to ease:
    // camera/selected arc separation is exact even at varying frame intervals.
    const clear = new VascularCameraRig(), selected = createVascularSample(), entity = createEntity(0);
    const empty: CameraObstacles = { centers: new Float32Array(0), radii: new Float32Array(0), count: 0, selectedIndex: -1 };
    let time = 0, initialSeparation = 0;
    for (let index = 0; index < 500; index++) {
      const delta = index % 2 ? 1 / 120 : 1 / 30; time += delta;
      const sample = writeVascularAt(time, entity, DEFAULT_VASCULAR_CONFIG, selected);
      const pose = clear.update(delta, 'tracking', time, sample, false, false, empty);
      const separation = ((sample.phase - pose.phase + 1.5) % 1) - .5;
      if (index === 0) initialSeparation = separation;
      expect(separation).toBeCloseTo(initialSeparation, 12);
    }
  }, 20000);
  it('clears following velocity on entity/mode changes, preserves manual seeding and zeroes it on absolute scrubs', () => {
    const scene = trackingPopulation({ count: 500, seed: 17 }), rig = new VascularCameraRig();
    rig.update(0, 'tracking', 3, scene.at(3), false, true, scene.obstacles);
    for (let index = 1; index <= 120; index++) rig.update(1 / 60, 'tracking', 3 + index / 60, scene.at(3 + index / 60), false, false, scene.obstacles);
    const before = [...rig.pose.position];
    const different = writeVascularAt(5, createEntity(104), { count: 500, seed: 17 }, createVascularSample());
    scene.obstacles.selectedIndex = 104;
    expect(distance(before, rig.update(1 / 60, 'tracking', 5, different, false, false, scene.obstacles).position)).toBeLessThan(.05);
    expect(Math.abs(rig.transport.phaseCorrectionSpeed)).toBeLessThanOrEqual(6 / 60 + 1e-12);
    rig.update(0, 'tracking', 5, different, false, true, scene.obstacles);
    expect(rig.transport).toEqual({ phaseCorrectionSpeed: 0, radialCorrectionSpeed: 0 });
    rig.seed({ x: 8, y: 1, z: 0 }, { x: 8, y: 1, z: 1 });
    expect(rig.transport).toEqual({ phaseCorrectionSpeed: 0, radialCorrectionSpeed: 0 });
    expect(distance(rig.pose.position, [8, 1, 0])).toBeLessThan(1e-12);
    rig.update(1 / 60, 'flow', 5, null);
    expect(rig.transport).toEqual({ phaseCorrectionSpeed: 0, radialCorrectionSpeed: 0 });
  });
});
