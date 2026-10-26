import { create } from 'zustand';
import { entityIndexFromId, entityPresent, normalizeVascularConfig, type VascularConfig } from '../simulation/vascular';
import { useObservatory } from './observatory';

export type VascularCameraMode = 'free' | 'flow' | 'tracking';
export const DEFAULT_VASCULAR_SPEED = 3 / 7;

function normalized(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : DEFAULT_VASCULAR_SPEED; }
function time(value: number): number { return Number.isFinite(value) ? Math.max(0, value) : 0; }

/** Artistic animation multiplier, not a blood-flow measurement. */
export function vascularSpeedMultiplier(speed: number): number { return .25 + normalized(speed) * 1.75; }

/** Renderer-owned absolute time. Commands publish snapshots; frames never notify React. */
export const vascularClock = { seconds: 0, speed: 1, revision: 0 };

export interface VascularState {
  config: VascularConfig;
  playing: boolean;
  seconds: number;
  speed: number;
  revision: number;
  selectedId: string | null;
  cameraMode: VascularCameraMode;
  cameraRevision: number;
  highlightRC: boolean;
  ready: boolean;
  play: () => void;
  pause: () => void;
  scrub: (seconds: number) => void;
  step: (seconds: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  setConfig: (config: Partial<VascularConfig>) => void;
  select: (id: string | null) => void;
  setCameraMode: (mode: VascularCameraMode) => void;
  resetCamera: () => void;
  setHighlightRC: (highlight: boolean) => void;
  setReady: (ready: boolean) => void;
}

function publishTime(seconds: number): void {
  vascularClock.seconds = time(seconds);
  vascularClock.revision += 1;
}

export const useVascular = create<VascularState>((set, get) => ({
  config: normalizeVascularConfig(undefined), playing: false, seconds: 0,
  speed: DEFAULT_VASCULAR_SPEED, revision: 0, selectedId: null, cameraMode: 'free', cameraRevision: 0, highlightRC: false, ready: false,
  play: () => {
    publishTime(vascularClock.seconds);
    set({ playing: get().ready && !useObservatory.getState().reducedMotion,
      seconds: vascularClock.seconds, revision: vascularClock.revision });
  },
  pause: () => {
    publishTime(vascularClock.seconds);
    set({ playing: false, seconds: vascularClock.seconds, revision: vascularClock.revision });
  },
  scrub: (seconds) => {
    publishTime(seconds);
    set({ playing: false, seconds: vascularClock.seconds, revision: vascularClock.revision });
  },
  step: (seconds) => get().scrub(vascularClock.seconds + (Number.isFinite(seconds) ? seconds : 0)),
  reset: () => {
    publishTime(0);
    set({ playing: false, seconds: 0, cameraMode: 'free', cameraRevision: get().cameraRevision + 1, revision: vascularClock.revision });
  },
  setSpeed: (value) => {
    const speed = normalized(value);
    vascularClock.speed = vascularSpeedMultiplier(speed);
    set({ speed });
  },
  setConfig: (partial) => {
    const input = partial !== null && typeof partial === 'object' && !Array.isArray(partial) ? partial : {};
    const state = get();
    const config = normalizeVascularConfig({ ...state.config, ...input });
    publishTime(vascularClock.seconds);
    const missing = state.selectedId !== null && !entityPresent(state.selectedId, config.count, config.seed);
    set({ config, seconds: vascularClock.seconds, revision: vascularClock.revision,
      ...(missing && state.cameraMode === 'tracking' ? { cameraMode: 'free' as const } : {}) });
  },
  select: (value) => {
    const state = get();
    const id = typeof value === 'string' && entityIndexFromId(value, state.config.seed) !== null ? value : null;
    set({ selectedId: id, ...(!id && state.cameraMode === 'tracking' ? { cameraMode: 'free' as const } : {}) });
  },
  setCameraMode: (mode) => {
    if (mode !== 'free' && mode !== 'flow' && mode !== 'tracking') return;
    const state = get();
    set({ cameraMode: mode === 'tracking' && (!state.selectedId || !entityPresent(state.selectedId, state.config.count, state.config.seed)) ? 'free' : mode });
  },
  resetCamera: () => set((state) => ({ cameraMode: 'free', cameraRevision: state.cameraRevision + 1 })),
  setHighlightRC: (highlightRC) => set({ highlightRC: Boolean(highlightRC) }),
  setReady: (ready) => {
    if (!ready) get().pause();
    set({ ready });
  },
}));

export function selectedVascularEntityPresent(state: Pick<VascularState, 'selectedId' | 'config'> = useVascular.getState()): boolean {
  return state.selectedId !== null && entityPresent(state.selectedId, state.config.count, state.config.seed);
}

export interface VascularAdvanceOptions { reducedMotion: boolean; hidden: boolean; available: boolean; active: boolean }

/** Absolute simulation seconds are independent of configuration, renderer and sampler. */
export function advanceVascularClock(deltaSeconds: number, options: VascularAdvanceOptions): void {
  const state = useVascular.getState();
  if (!state.playing) return;
  if (!state.ready || options.reducedMotion || options.hidden || !options.available || !options.active) {
    state.pause();
    return;
  }
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
  const seconds = vascularClock.seconds + deltaSeconds * vascularClock.speed;
  if (!Number.isFinite(seconds)) { state.pause(); return; }
  vascularClock.seconds = seconds;
  vascularClock.revision += 1;
}
