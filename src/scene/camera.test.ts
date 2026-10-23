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
});
