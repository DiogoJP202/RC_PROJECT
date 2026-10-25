import { clampRinkakuT, RINKAKU_DURATION_SECONDS } from './rinkaku';

/**
 * Cinematic transport only. The sampler keeps its original normalized phases
 * and motionTime; neither consumes elapsed playback seconds.
 */
export const RINKAKU_PLAYBACK_DURATION_SECONDS = 21;

const SLOWDOWN_START = 0.93;
const SLOWDOWN_END = 0.95;
const SLOWDOWN_WIDTH = SLOWDOWN_END - SLOWDOWN_START;
const EXTRA_SECONDS_PER_T = (RINKAKU_PLAYBACK_DURATION_SECONDS - RINKAKU_DURATION_SECONDS)
  / (1 - (SLOWDOWN_START + SLOWDOWN_END) / 2);
const SLOWDOWN_START_SECONDS = SLOWDOWN_START * RINKAKU_DURATION_SECONDS;
const SLOWDOWN_END_SECONDS = SLOWDOWN_END * RINKAKU_DURATION_SECONDS
  + EXTRA_SECONDS_PER_T * SLOWDOWN_WIDTH / 2;

/**
 * Absolute pose -> seconds along one complete forward traversal.
 *
 * Its positive time density is 18 before .93, smoothly increases to 68 at
 * .95, then stays constant. Integrating smoothstep gives a strictly monotonic
 * C2 mapping with no velocity discontinuity entering retraction. The .95..1
 * interval takes 3.4 seconds; the complete cycle takes 21 seconds.
 */
export function playbackTimeAt(value: number): number {
  const t = clampRinkakuT(value);
  if (t === 1) return RINKAKU_PLAYBACK_DURATION_SECONDS;
  if (t <= SLOWDOWN_START) return t * RINKAKU_DURATION_SECONDS;
  if (t >= SLOWDOWN_END) {
    return SLOWDOWN_END_SECONDS
      + (t - SLOWDOWN_END) * (RINKAKU_DURATION_SECONDS + EXTRA_SECONDS_PER_T);
  }
  const u = (t - SLOWDOWN_START) / SLOWDOWN_WIDTH;
  const integratedSmoothstep = u * u * u * (1 - u / 2);
  return t * RINKAKU_DURATION_SECONDS
    + EXTRA_SECONDS_PER_T * SLOWDOWN_WIDTH * integratedSmoothstep;
}

/**
 * Seconds -> absolute pose, the deterministic inverse of playbackTimeAt.
 * No history, frame partition, playback direction or wall clock is consulted.
 * Invalid inputs return rest; finite values clamp to the complete cycle.
 */
export function rinkakuTAtPlaybackTime(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  if (seconds >= RINKAKU_PLAYBACK_DURATION_SECONDS) return 1;
  if (seconds <= SLOWDOWN_START_SECONDS) return seconds / RINKAKU_DURATION_SECONDS;
  if (seconds >= SLOWDOWN_END_SECONDS) {
    return SLOWDOWN_END
      + (seconds - SLOWDOWN_END_SECONDS) / (RINKAKU_DURATION_SECONDS + EXTRA_SECONDS_PER_T);
  }

  // Only the .93..95 transition needs inversion. A fixed bounded search is
  // allocation-free, monotonic and accurate to less than 2e-15 in t.
  let lower = SLOWDOWN_START;
  let upper = SLOWDOWN_END;
  for (let iteration = 0; iteration < 44; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (playbackTimeAt(midpoint) < seconds) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
}
