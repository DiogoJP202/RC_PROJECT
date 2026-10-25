import { describe, expect, it } from 'vitest';
import { PHASES, RINKAKU_DURATION_SECONDS, sampleRinkakuAt } from './rinkaku';
import { playbackTimeAt, RINKAKU_PLAYBACK_DURATION_SECONDS, rinkakuTAtPlaybackTime } from './rinkakuPlayback';

describe('Rinkaku cinematic transport mapping', () => {
  it('clamps finite values and sends invalid values to rest in either domain', () => {
    expect(playbackTimeAt(-1)).toBe(0);
    expect(playbackTimeAt(2)).toBe(RINKAKU_PLAYBACK_DURATION_SECONDS);
    expect(rinkakuTAtPlaybackTime(-1)).toBe(0);
    expect(rinkakuTAtPlaybackTime(100)).toBe(1);
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(playbackTimeAt(invalid)).toBe(0);
      expect(rinkakuTAtPlaybackTime(invalid)).toBe(0);
    }
  });

  it('preserves the early cadence and gives retraction 3.4 of 21 seconds', () => {
    expect(RINKAKU_DURATION_SECONDS).toBe(18);
    expect(RINKAKU_PLAYBACK_DURATION_SECONDS).toBe(21);
    for (const t of [0, 0.08, 0.2, 0.35, 0.67, 0.85, 0.9, 0.93]) {
      expect(playbackTimeAt(t)).toBeCloseTo(t * RINKAKU_DURATION_SECONDS, 13);
    }
    expect(playbackTimeAt(1) - playbackTimeAt(0.95)).toBeCloseTo(3.4, 13);
    expect(rinkakuTAtPlaybackTime(playbackTimeAt(0.95) + 1.7)).toBeCloseTo(0.975, 13);
  });

  it('is strictly monotonic and invertible across both domains, including every phase boundary', () => {
    let previousSeconds = -1;
    let previousT = -1;
    for (let index = 0; index <= 10000; index += 1) {
      const t = index / 10000;
      const seconds = index / 10000 * RINKAKU_PLAYBACK_DURATION_SECONDS;
      const mappedSeconds = playbackTimeAt(t);
      const mappedT = rinkakuTAtPlaybackTime(seconds);
      expect(mappedSeconds).toBeGreaterThan(previousSeconds);
      expect(mappedT).toBeGreaterThan(previousT);
      expect(rinkakuTAtPlaybackTime(mappedSeconds)).toBeCloseTo(t, 13);
      expect(playbackTimeAt(mappedT)).toBeCloseTo(seconds, 12);
      previousSeconds = mappedSeconds;
      previousT = mappedT;
    }
    for (const { start, end } of PHASES) {
      for (const t of [start, end]) expect(rinkakuTAtPlaybackTime(playbackTimeAt(t))).toBeCloseTo(t, 13);
    }
  });

  it('changes playback velocity smoothly across the slowdown boundaries', () => {
    const epsilon = 1e-6;
    for (const t of [0.93, 0.95]) {
      const seconds = playbackTimeAt(t);
      const velocityBefore = (t - rinkakuTAtPlaybackTime(seconds - epsilon)) / epsilon;
      const velocityAfter = (rinkakuTAtPlaybackTime(seconds + epsilon) - t) / epsilon;
      expect(velocityBefore).toBeGreaterThan(0);
      expect(velocityAfter).toBeGreaterThan(0);
      expect(velocityBefore).toBeCloseTo(velocityAfter, 7);
    }
  });

  it('traverses the same deterministic sampler poses in either playback direction', () => {
    for (const t of [0.04, 0.14, 0.275, 0.53, 0.76, 0.9, 0.94, 0.95, 0.98, 1]) {
      const seconds = playbackTimeAt(t);
      const forward = rinkakuTAtPlaybackTime(seconds);
      const reverse = rinkakuTAtPlaybackTime(RINKAKU_PLAYBACK_DURATION_SECONDS
        - (RINKAKU_PLAYBACK_DURATION_SECONDS - seconds));
      expect(forward).toBeCloseTo(reverse, 13);
      expect(sampleRinkakuAt(forward).motionTime).toBeCloseTo(sampleRinkakuAt(t).motionTime, 12);
      expect(sampleRinkakuAt(reverse).appendageExtension).toBeCloseTo(sampleRinkakuAt(t).appendageExtension, 12);
    }
  });
});
