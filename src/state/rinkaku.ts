import { create } from 'zustand';
import {
  clampRinkakuT, createRinkakuSnapshot, normalizeRinkakuConfig, PHASES,
  writeRinkakuAt,
  type RinkakuConfig, type RinkakuPhase,
} from '../simulation/rinkaku';
import {
  playbackTimeAt, RINKAKU_PLAYBACK_DURATION_SECONDS, rinkakuTAtPlaybackTime,
} from '../simulation/rinkakuPlayback';
import { useObservatory } from './observatory';

/** Mutable frame data, sampled by UI at a low rate; never a React frame feed. */
export const rinkakuClock = { t: 0, elapsedSeconds: 0, snapshot: createRinkakuSnapshot(), revision: 0 };
writeRinkakuAt(0, normalizeRinkakuConfig(undefined), rinkakuClock.snapshot);

export interface RinkakuState {
  enabled: boolean;
  playing: boolean;
  direction: 1 | -1;
  t: number;
  revision: number;
  config: RinkakuConfig;
  setEnabled: (enabled: boolean) => void;
  play: (direction?: 1 | -1) => void;
  pause: () => void;
  scrub: (t: number) => void;
  step: (delta: number) => void;
  selectPhase: (phase: RinkakuPhase) => void;
  reset: () => void;
  setConfig: (partial: Partial<RinkakuConfig>) => void;
}

function sampleClock(t: number, config: RinkakuConfig, elapsedSeconds = playbackTimeAt(t)): void {
  rinkakuClock.t = clampRinkakuT(t);
  rinkakuClock.elapsedSeconds = elapsedSeconds;
  writeRinkakuAt(rinkakuClock.t, config, rinkakuClock.snapshot);
  rinkakuClock.revision += 1;
}

/** Commands only. Renderer ticks mutate rinkakuClock, not Zustand/React. */
export const useRinkaku = create<RinkakuState>((set, get) => ({
  enabled: false, playing: false, direction: 1, t: 0, revision: 0,
  config: normalizeRinkakuConfig(undefined),
  setEnabled: (enabled) => {
    if (enabled) useObservatory.getState().setPaused(true);
    sampleClock(rinkakuClock.t, get().config);
    set({ enabled, playing: false, t: rinkakuClock.t, revision: rinkakuClock.revision });
  },
  play: (requestedDirection) => {
    const state = get();
    const direction = requestedDirection === -1 ? -1 : requestedDirection === 1 ? 1 : state.direction;
    useObservatory.getState().setPaused(true);
    sampleClock(rinkakuClock.t, state.config);
    const atEnd = direction === 1 ? rinkakuClock.t >= 1 : rinkakuClock.t <= 0;
    set({ enabled: true, direction, playing: !atEnd && !useObservatory.getState().reducedMotion,
      t: rinkakuClock.t, revision: rinkakuClock.revision });
  },
  pause: () => {
    sampleClock(rinkakuClock.t, get().config);
    set({ playing: false, t: rinkakuClock.t, revision: rinkakuClock.revision });
  },
  scrub: (t) => {
    sampleClock(t, get().config);
    set({ playing: false, t: rinkakuClock.t, revision: rinkakuClock.revision });
  },
  step: (delta) => get().scrub(rinkakuClock.t + (Number.isFinite(delta) ? delta : 0)),
  selectPhase: (key) => {
    const phase = PHASES.find((entry) => entry.key === key);
    if (phase) get().scrub((phase.start + phase.end) / 2);
  },
  reset: () => {
    sampleClock(0, get().config);
    set({ playing: false, direction: 1, t: 0, revision: rinkakuClock.revision });
  },
  setConfig: (partial) => {
    const input = partial !== null && typeof partial === 'object' && !Array.isArray(partial) ? partial : {};
    const config = normalizeRinkakuConfig({ ...get().config, ...input });
    sampleClock(rinkakuClock.t, config);
    set({ config, t: rinkakuClock.t, revision: rinkakuClock.revision });
  },
}));

export interface RinkakuAdvanceOptions {
  reducedMotion: boolean;
  hidden: boolean;
  bodyMode: boolean;
  available: boolean;
}

/** Called by the scene once per frame. Pause conditions preserve the exact pose. */
export function advanceRinkakuClock(deltaSeconds: number, options: RinkakuAdvanceOptions): void {
  const state = useRinkaku.getState();
  if (!state.playing) return;
  if (!state.enabled || options.reducedMotion || options.hidden || !options.bodyMode || !options.available) {
    state.pause();
    return;
  }
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
  const seconds = Math.max(0, Math.min(RINKAKU_PLAYBACK_DURATION_SECONDS,
    rinkakuClock.elapsedSeconds + state.direction * deltaSeconds));
  sampleClock(rinkakuTAtPlaybackTime(seconds), state.config, seconds);
  if (rinkakuClock.t === 0 || rinkakuClock.t === 1) state.pause();
}
