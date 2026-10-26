import { describe, expect, it } from 'vitest';
import {
  createEntity, createParticles, createVascularSample, createVesselFrame, VESSEL_MIN_RADIUS, writeVascularAt,
  type VascularConfig, type VascularSample,
} from '../../simulation/vascular';
import { nearestVesselFrame } from './camera';
import {
  createTrackingPlan, createTrackingViewMetrics, evaluateTrackingView, planTrackingCamera,
  type CameraObstacles,
} from './tracking';

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function population(config: VascularConfig, selectedIndex = 0) {
  const entities = createParticles(config), scratch = createVascularSample(), selected = createVascularSample();
  const obstacles: CameraObstacles = { centers: new Float32Array(config.count * 3), radii: new Float32Array(config.count), count: config.count, selectedIndex };
  return {
    obstacles, selected,
    at(seconds: number): VascularSample {
      for (const entity of entities) {
        writeVascularAt(seconds, entity, config, scratch);
        obstacles.centers.set(scratch.position, entity.index * 3); obstacles.radii[entity.index] = scratch.boundingRadius;
      }
      return writeVascularAt(seconds, entities[selectedIndex], config, selected);
    },
  };
}

describe('deterministic volume-aware tracking plan', () => {
  it('avoids a foreground volume and a near-camera volume without changing the selected sample', () => {
    const config: VascularConfig = { count: 100, seed: 17 };
    const sample = writeVascularAt(3, createEntity(0), config, createVascularSample());
    const obstacles: CameraObstacles = { centers: new Float32Array(6), radii: new Float32Array([sample.boundingRadius, .3]), count: 1, selectedIndex: 0 };
    obstacles.centers.set(sample.position);
    const plan = planTrackingCamera(sample, obstacles, createTrackingPlan());
    const nominal = [...plan.position], before = structuredClone(sample);
    for (let axis = 0; axis < 3; axis++) obstacles.centers[axis + 3] = (nominal[axis] + sample.position[axis]) / 2;
    obstacles.count = 2;
    planTrackingCamera(sample, obstacles, plan);
    expect(plan.candidate).not.toBe(0);
    expect(plan.baseline.occlusion).toBeGreaterThan(.5);
    expect(plan.adapted.score).toBeLessThan(plan.baseline.score);
    expect(plan.adapted.occlusion).toBeLessThan(plan.baseline.occlusion);
    obstacles.centers.set(nominal, 3);
    planTrackingCamera(sample, obstacles, plan);
    expect(plan.baseline.clearance).toBeLessThan(0);
    expect(plan.adapted.clearance).toBeGreaterThan(plan.baseline.clearance);
    expect(sample).toEqual(before);
  });

  it('ignores the selected entity, cells beyond the selected volume, invalid radii and absent buffers', () => {
    const obstacles: CameraObstacles = {
      centers: new Float32Array([0, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 1]),
      radii: new Float32Array([50, .2, NaN, -1]), count: 20, selectedIndex: 0,
    };
    const output = createTrackingViewMetrics();
    expect(evaluateTrackingView([0, 0, 0], [0, 0, 2], .2, obstacles, output)).toBe(output);
    expect(output.occlusion).toBe(0);
    expect(output.proximity).toBe(0);
    expect(Number.isFinite(output.clearance)).toBe(true);
    obstacles.count = -1;
    expect(evaluateTrackingView([0, 0, 0], [0, 0, 0], .2, obstacles, output).score).toBe(0);
  });

  it('measures volumes touching the selected viewing cone even if their centres miss the centre ray', () => {
    const obstacles: CameraObstacles = { centers: new Float32Array([.25, 0, 1]), radii: new Float32Array([.2]), count: 1, selectedIndex: -1 };
    const output = evaluateTrackingView([0, 0, 0], [0, 0, 2], .4, obstacles, createTrackingViewMetrics());
    expect(output.occlusion).toBeGreaterThan(0);
    expect(output.occluders).toBe(1);
    expect(output.clearance).toBeGreaterThan(.5);
  });

  it('keeps poses bounded, immutable inputs and repeatable scores across all seeds and population profiles', () => {
    const frame = createVesselFrame(), plan = createTrackingPlan();
    const positionBuffer = plan.position, targetBuffer = plan.target, frameBuffer = plan.scratch.frame;
    let adaptedSamples = 0, baselineRisk = 0, adaptedRisk = 0;
    for (const seed of [17, 31, 73]) for (const count of [100, 500, 2000] as const) {
      const scene = population({ seed, count });
      for (let index = 0; index <= 80; index++) {
        const selected = scene.at(index * .5), before = structuredClone(selected);
        planTrackingCamera(selected, scene.obstacles, plan);
        expect(selected).toEqual(before);
        expect(plan.adapted.score).toBeLessThanOrEqual(plan.baseline.score + 1e-12);
        expect(Number.isFinite(plan.adapted.clearance)).toBe(true);
        nearestVesselFrame({ x: plan.position[0], y: plan.position[1], z: plan.position[2] }, frame);
        expect(distance(plan.position, frame.center)).toBeLessThanOrEqual(VESSEL_MIN_RADIUS - .32 + 1e-8);
        adaptedSamples += Number(plan.candidate !== 0); baselineRisk += plan.baseline.score; adaptedRisk += plan.adapted.score;
      }
      scene.at(7.001); planTrackingCamera(scene.selected, scene.obstacles, plan);
      const expected = structuredClone(plan);
      scene.at(31); planTrackingCamera(scene.selected, scene.obstacles, plan);
      scene.at(7.001); planTrackingCamera(scene.selected, scene.obstacles, plan);
      expect(plan).toEqual(expected);
    }
    expect(adaptedSamples).toBeGreaterThan(0);
    expect(adaptedRisk).toBeLessThan(baselineRisk);
    expect(plan.position).toBe(positionBuffer); expect(plan.target).toBe(targetBuffer); expect(plan.scratch.frame).toBe(frameBuffer);
  });
});
