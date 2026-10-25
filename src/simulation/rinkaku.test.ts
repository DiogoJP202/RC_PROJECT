import { describe, expect, it } from 'vitest';
import {
  createRinkakuSnapshot, DEFAULT_RINKAKU_CONFIG, normalizeRinkakuConfig,
  PHASES, sampleRinkakuAt, writeRinkakuAt,
  type RinkakuSnapshot,
} from './rinkaku';

const channels = [
  'rootExposure', 'kakuhouActivation', 'appendageExtension', 'appendageThickness',
  'visualStiffness', 'particleEmission', 'appendageMotion', 'visualIntensity',
] as const satisfies ReadonlyArray<keyof RinkakuSnapshot>;

describe('deterministic editorial Rinkaku sampler', () => {
  it('reproduces arbitrary poses after forward, backward and repeated sampling', () => {
    const config = { appendageCount: 3, seed: 155, particles: true, quality: 'low' };
    const reference = sampleRinkakuAt(0.7, config);
    for (const t of [0.2, 0.99, 0, 1, 0.7, 0.35, 0.1, 0.7]) sampleRinkakuAt(t, config);
    expect(sampleRinkakuAt(0.7, config)).toEqual(reference);
    const output = createRinkakuSnapshot();
    for (const t of [0.7, 0.2, 0.99, 0.7]) writeRinkakuAt(t, normalizeRinkakuConfig(config), output);
    expect(output).toEqual(reference);
    expect(config).toEqual({ appendageCount: 3, seed: 155, particles: true, quality: 'low' });
  });

  it('uses seven exact half-open intervals, with t=1 finishing retract', () => {
    expect(PHASES.map((phase) => [phase.start, phase.end])).toEqual([
      [0, 0.08], [0.08, 0.2], [0.2, 0.35], [0.35, 0.67], [0.67, 0.85], [0.85, 0.95], [0.95, 1],
    ]);
    for (const phase of PHASES) {
      expect(sampleRinkakuAt(phase.start).phase).toBe(phase.key);
      expect(sampleRinkakuAt(phase.start).localPhaseProgress).toBe(0);
      expect(sampleRinkakuAt((phase.start + phase.end) / 2).phase).toBe(phase.key);
      expect(sampleRinkakuAt(phase.end - 1e-10).phase).toBe(phase.key);
    }
    expect(sampleRinkakuAt(1)).toMatchObject({ phase: 'retract', localPhaseProgress: 1 });
  });

  it('keeps every visual channel continuous across phase boundaries', () => {
    for (const phase of PHASES.slice(1)) {
      const a = sampleRinkakuAt(phase.start - 1e-7);
      const b = sampleRinkakuAt(phase.start);
      const c = sampleRinkakuAt(phase.start + 1e-7);
      for (const channel of channels) {
        expect(Math.abs(a[channel] - b[channel])).toBeLessThan(1e-8);
        expect(Math.abs(c[channel] - b[channel])).toBeLessThan(1e-8);
      }
      expect(a.motionTime).toBeCloseTo(c.motionTime, 5);
    }
  });

  it('starts and ends in geometric rest and holds full extension before retraction', () => {
    for (const t of [0, 0.04, 0.08, 1]) {
      const sample = sampleRinkakuAt(t);
      for (const channel of channels) expect(sample[channel]).toBe(0);
    }
    expect(sampleRinkakuAt(0.9).appendageExtension).toBe(1);
    expect(sampleRinkakuAt(0.975).appendageExtension).toBeCloseTo(0.5);
    expect(sampleRinkakuAt(0.99).appendageThickness).toBeLessThan(sampleRinkakuAt(0.96).appendageThickness);
  });

  it('keeps every visual value finite and normalized across the whole timeline', () => {
    for (let i = 0; i <= 1000; i += 1) {
      const sample = sampleRinkakuAt(i / 1000);
      for (const channel of [...channels, 't', 'localPhaseProgress'] as const) {
        expect(Number.isFinite(sample[channel])).toBe(true);
        expect(sample[channel]).toBeGreaterThanOrEqual(0);
        expect(sample[channel]).toBeLessThanOrEqual(1);
      }
      expect(Number.isFinite(sample.motionTime)).toBe(true);
    }
  });

  it('clamps finite timeline values and rejects nonfinite inputs without NaN', () => {
    for (const value of [-1, -Infinity, Infinity, NaN]) expect(sampleRinkakuAt(value).t).toBe(0);
    expect(sampleRinkakuAt(9).t).toBe(1);
    expect(sampleRinkakuAt(NaN)).toEqual(sampleRinkakuAt(0));
  });

  it('normalizes absent, malformed and hostile configuration fields', () => {
    for (const input of [undefined, null, [], '4', 4, false]) expect(normalizeRinkakuConfig(input)).toEqual(DEFAULT_RINKAKU_CONFIG);
    expect(normalizeRinkakuConfig({ appendageCount: -9, seed: -10, particles: 'false', quality: 'ultra' }))
      .toEqual({ ...DEFAULT_RINKAKU_CONFIG, appendageCount: 1, seed: 0 });
    expect(normalizeRinkakuConfig({ appendageCount: 99, seed: 1e20, particles: false, quality: 'low' }))
      .toEqual({ appendageCount: 4, seed: 0xffffffff, particles: false, quality: 'low' });
    expect(normalizeRinkakuConfig({ appendageCount: 2.6, seed: 47.8 })).toMatchObject({ appendageCount: 3, seed: 47 });
    expect(normalizeRinkakuConfig({ appendageCount: NaN, seed: Infinity })).toEqual(DEFAULT_RINKAKU_CONFIG);
  });

  it('supports one to four appendages and disables only particle emission', () => {
    const base = sampleRinkakuAt(0.5);
    for (const appendageCount of [1, 2, 3, 4]) {
      const snapshot = sampleRinkakuAt(0.5, { appendageCount, particles: false });
      expect(snapshot.appendageCount).toBe(appendageCount);
      expect(snapshot.particleEmission).toBe(0);
      for (const channel of channels.filter((key) => key !== 'particleEmission')) expect(snapshot[channel]).toBe(base[channel]);
    }
  });

  it('overwrites a caller-owned snapshot without replacing it or preserving residual state', () => {
    const output = sampleRinkakuAt(0.99, { seed: 1, quality: 'low', particles: false, appendageCount: 1 });
    const identity = output;
    const result = writeRinkakuAt(0.3, normalizeRinkakuConfig(undefined), output);
    expect(result).toBe(identity);
    expect(output).toEqual(sampleRinkakuAt(0.3));
  });

  it('derives secondary motion time solely from timeline and seed', () => {
    expect(sampleRinkakuAt(0.5, { seed: 7 }).motionTime).toBe(sampleRinkakuAt(0.5, { seed: 7 }).motionTime);
    expect(sampleRinkakuAt(0.5, { seed: 8 }).motionTime).not.toBe(sampleRinkakuAt(0.5, { seed: 7 }).motionTime);
    expect(sampleRinkakuAt(0.6, { seed: 7 }).motionTime - sampleRinkakuAt(0.5, { seed: 7 }).motionTime).toBeCloseTo(1.8);
  });
});
