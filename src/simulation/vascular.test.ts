import { describe, expect, it } from 'vitest';
import {
  createEntity, createParticles, createVascularSample, createVesselFrame, entityIndexFromId, entityPresent,
  FLOW_PERIOD_SECONDS, normalizeVascularConfig, sampleVascularAt, vesselAt, vesselProgressAtAngle, vesselWallRadius,
  VESSEL_LENGTH, VESSEL_MIN_RADIUS, VESSEL_RADIUS, VESSEL_WALL_RELIEF, writeVascularAt,
} from './vascular';

const config = normalizeVascularConfig({ count: 2000, seed: 17 });
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, value, index) => sum + value * b[index], 0);

describe('absolute didactic vascular transport', () => {
  it('normalizes only the three supported population profiles without mutating input', () => {
    expect(normalizeVascularConfig(null)).toEqual({ count: 500, seed: 17 });
    expect(normalizeVascularConfig({ count: 999, seed: NaN })).toEqual({ count: 500, seed: 17 });
    expect(normalizeVascularConfig({ count: 100, seed: -100 })).toEqual({ count: 100, seed: 0 });
    expect(normalizeVascularConfig({ count: 2000, seed: Infinity })).toEqual({ count: 2000, seed: 17 });
    const original = Object.freeze({ count: 500, seed: 0xffffffff + 100 });
    expect(normalizeVascularConfig(original)).toEqual({ count: 500, seed: 0xffffffff });
    expect(original.seed).toBe(0xffffffff + 100);
  });

  it('preserves entity identities and authored parameters across population profiles', () => {
    const small = createParticles({ count: 100, seed: 17 });
    const medium = createParticles({ count: 500, seed: 17 });
    const large = createParticles(config);
    expect(large.slice(0, 100)).toEqual(small);
    expect(large.slice(0, 500)).toEqual(medium);
    expect(new Set(large.map((entity) => entity.id)).size).toBe(2000);
    expect(large[0].kind).toBe('rc');
    expect(entityPresent(large[800].id, 100)).toBe(false);
    expect(entityPresent(large[800].id, 2000)).toBe(true);
    expect(entityIndexFromId('rbc:17:0')).toBeNull();
    expect(entityIndexFromId('rc:18:0')).toBeNull();
    expect(entityIndexFromId('rc:17:2000')).toBeNull();
    expect(entityIndexFromId('rc:17:000')).toBeNull();
    expect(entityIndexFromId('rc:017:0')).toBeNull();
    expect(createEntity(0, 99).id).not.toBe(large[0].id);
  });

  it('samples the same absolute state after arbitrary time order and reuses every output tuple', () => {
    const entity = createEntity(16);
    const output = createVascularSample();
    const tuples = [output.center, output.position, output.tangent, output.normal, output.binormal, output.quaternion];
    const expected = sampleVascularAt(23.7, entity, config);
    for (const seconds of [23.7, 10000.1, 0, 38, 4, 23.7]) writeVascularAt(seconds, entity, config, output);
    expect(output).toEqual(expected);
    expect([output.center, output.position, output.tangent, output.normal, output.binormal, output.quaternion]).toEqual(tuples);
    expect(output.position).toBe(tuples[1]); expect(output.quaternion).toBe(tuples[5]);
    expect(sampleVascularAt(23.7, entity, { count: 100, seed: 17 })).toEqual(expected);
  });

  it('provides finite orthonormal periodic frames and near-uniform arc-length motion', () => {
    const frame = createVesselFrame(), origin = vesselAt(0, createVesselFrame());
    expect(vesselAt(1, frame)).toEqual(origin);
    let previous = [...origin.center], shortest = Infinity, longest = 0;
    for (let i = 0; i <= 1000; i++) {
      vesselAt(i / 1000, frame);
      expect([...frame.center, ...frame.normal, ...frame.binormal, ...frame.tangent, ...frame.quaternion].every(Number.isFinite)).toBe(true);
      expect(dot(frame.tangent, frame.normal)).toBeCloseTo(0, 12);
      expect(dot(frame.binormal, frame.normal)).toBeCloseTo(0, 12);
      expect(Math.hypot(...frame.tangent)).toBeCloseTo(1, 12);
      expect(Math.hypot(...frame.binormal)).toBeCloseTo(1, 12);
      expect(Math.hypot(...frame.quaternion)).toBeCloseTo(1, 12);
      if (i > 0) {
        const distance = Math.hypot(...frame.center.map((value, axis) => value - previous[axis]));
        shortest = Math.min(shortest, distance); longest = Math.max(longest, distance);
      }
      previous = [...frame.center];
    }
    expect(longest / shortest).toBeLessThan(1.001);
    expect(VESSEL_LENGTH).toBeGreaterThan(50);
    const nearEnd = vesselAt(1 - 1e-8, createVesselFrame());
    expect(Math.hypot(...nearEnd.center.map((value, axis) => value - origin.center[axis]))).toBeLessThan(.000001);
    expect(Math.abs(dot(nearEnd.quaternion, origin.quaternion))).toBeCloseTo(1, 10);
    for (const angle of [-3, -.2, 0, .74, 2, 3.4, 6.2, 10]) {
      const u = vesselProgressAtAngle(angle);
      const wrapped = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      expect(vesselAt(u, frame).angle).toBeCloseTo(wrapped, 12);
    }
  });

  it('closes each entity loop without relocating identity, orientation or lane', () => {
    for (const index of [0, 1, 16, 799, 1999]) {
      const entity = createEntity(index);
      const start = sampleVascularAt(0, entity, config);
      const loop = sampleVascularAt(FLOW_PERIOD_SECONDS / entity.speed, entity, config);
      expect(loop).toEqual(start);
      const epsilon = .000001;
      const before = sampleVascularAt(FLOW_PERIOD_SECONDS / entity.speed - epsilon, entity, config);
      expect(Math.hypot(...before.position.map((value, axis) => value - start.position[axis]))).toBeLessThan(.00001);
      expect(Math.abs(dot(before.quaternion, start.quaternion))).toBeCloseTo(1, 10);
    }
  });

  it('keeps the full bounding sphere within the most inward possible wall relief', () => {
    const entities = createParticles(config), output = createVascularSample();
    let minimumClearance = Infinity;
    for (const seconds of [0, 7.3, 31, 70, 9999.9]) for (const entity of entities) {
      writeVascularAt(seconds, entity, config, output);
      const radial = Math.hypot(...output.position.map((value, axis) => value - output.center[axis]));
      minimumClearance = Math.min(minimumClearance, output.clearance);
      expect(radial + entity.boundingRadius).toBeLessThan(VESSEL_MIN_RADIUS - .119);
      expect(Math.hypot(...output.quaternion)).toBeCloseTo(1, 10);
      expect([...output.position, ...output.quaternion].every(Number.isFinite)).toBe(true);
    }
    expect(minimumClearance).toBeGreaterThan(.12);
    for (let u = 0; u <= 32; u++) for (let a = 0; a <= 24; a++) {
      const radius = vesselWallRadius(u / 32, a / 24 * Math.PI * 2);
      expect(radius).toBeGreaterThanOrEqual(VESSEL_MIN_RADIUS - 1e-12);
      expect(radius).toBeLessThanOrEqual(VESSEL_RADIUS + VESSEL_WALL_RELIEF + 1e-12);
    }
    expect(Number.isFinite(vesselWallRadius(NaN, Infinity))).toBe(true);
  });

  it('moves coherently forward and treats invalid time as its reset pose', () => {
    for (const index of [0, 1, 16, 55]) {
      const entity = createEntity(index), before = sampleVascularAt(3.4, entity, config), after = sampleVascularAt(3.401, entity, config);
      const displacement = after.position.map((value, axis) => value - before.position[axis]);
      expect(dot(displacement, before.tangent)).toBeGreaterThan(.0008);
      for (const invalid of [-1, NaN, Infinity, -Infinity]) expect(sampleVascularAt(invalid, entity, config)).toEqual(sampleVascularAt(0, entity, config));
      expect(sampleVascularAt(Number.MAX_VALUE, entity, config).position.every(Number.isFinite)).toBe(true);
    }
  });
});
