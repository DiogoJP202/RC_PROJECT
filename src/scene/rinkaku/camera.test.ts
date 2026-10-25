import { describe, expect, it } from 'vitest';
import { rinkakuCameraPose } from './camera';

describe('Rinkaku camera envelope', () => {
  const volume = { center: [0, 1.1, -.55] as [number, number, number], size: [2.36, 2.2, 1.5] as [number, number, number] };
  it('keeps deterministic posterior and lateral poses with finite mobile framing', () => {
    for (const aspect of [.45, 1, 1.6, 2]) for (const view of ['posterior', 'lateral', 'oblique'] as const) {
      const pose = rinkakuCameraPose(view, aspect, volume);
      expect(pose).toEqual(rinkakuCameraPose(view, aspect, volume));
      expect([...pose.position, ...pose.target].every(Number.isFinite)).toBe(true);
      expect(pose.position[2]).toBeLessThan(pose.target[2]);
    }
  });
  it('uses a deliberate oblique direction and tighter stable mobile composition', () => {
    const oblique = rinkakuCameraPose('oblique', 1.5, volume);
    expect(oblique.position[0]).toBeGreaterThan(oblique.target[0]);
    expect(oblique.position[2]).toBeLessThan(oblique.target[2]);
    const mobile = rinkakuCameraPose('posterior', 390 / 498, volume);
    expect(mobile.target[1]).toBeCloseTo(volume.center[1] - .08);
    expect(mobile).toEqual(rinkakuCameraPose('posterior', 390 / 498, volume));
  });
  it('changes direction without changing the envelope or target', () => {
    const a = rinkakuCameraPose('posterior', 1.5, volume), b = rinkakuCameraPose('lateral', 1.5, volume);
    expect(a.target).toEqual(b.target);
    expect(a.position[0]).toBeLessThan(0); expect(b.position[0]).toBeGreaterThan(0);
  });
});
