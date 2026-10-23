import { describe, expect, it } from 'vitest';
import { cameraPose, overviewDistance, smoothFocus } from './camera';

describe('camera framing', () => {
  it('frames the complete proxy at the declared occupancy', () => {
    const distance = overviewDistance(1.85, 36, 1.2);
    const occupancy = 1.85 / (2 * distance * Math.tan(18 * Math.PI / 180));
    expect(occupancy).toBeCloseTo(0.68, 3);
  });
  it('backs away in a narrow viewport and keeps all presets finite', () => {
    expect(overviewDistance(1.85, 36, 0.28)).toBeGreaterThan(overviewDistance(1.85, 36, 1.2));
    for (const target of ['overview', 'posterior', 'human.surface', 'human.head', 'human.thorax', 'human.muscular', 'human.skeletal', 'ghoul.kakuhou.rinkaku'] as const) {
      const pose = cameraPose(target, 0.7);
      expect([...pose.position, ...pose.target].every(Number.isFinite)).toBe(true);
    }
  });
  it('clamps focus easing and gives a repeatable midpoint', () => {
    expect(smoothFocus(-1)).toBe(0);
    expect(smoothFocus(0.5)).toBe(0.5);
    expect(smoothFocus(2)).toBe(1);
  });
  it('uses imported binding bounds instead of the fixed proxy landmark', () => {
    const volume = { center: [2, 1.5, -.3] as [number, number, number], size: [.4, .8, .2] as [number, number, number] };
    const pose = cameraPose('human.thorax', .5, 36, volume);
    expect(pose.target[0]).toBe(2);
    expect(pose.target[2]).toBe(-.3);
    expect(pose.target[1]).toBeGreaterThan(volume.center[1]);
    const larger = cameraPose('human.thorax', .5, 36, { ...volume, size: [.8, 1.6, .4] });
    expect(larger.position[2] - larger.target[2]).toBeGreaterThan(pose.position[2] - pose.target[2]);
    expect([...pose.position, ...larger.position].every(Number.isFinite)).toBe(true);
  });
});
