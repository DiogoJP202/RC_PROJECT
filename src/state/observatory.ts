import { create } from 'zustand';
import type { AnatomyId, FocusTarget, LayerId, Mode, SceneMetrics } from '../app/types';
import { scanClock } from './scanClock';

const initialLayers = { surface: true, muscular: false, skeletal: false, internal: true };
export const anatomyLayer: Record<AnatomyId, LayerId> = {
  'human.surface': 'surface', 'human.head': 'surface', 'human.muscular': 'muscular',
  'human.skeletal': 'skeletal', 'human.thorax': 'internal', 'ghoul.kakuhou.rinkaku': 'internal',
};
interface ObservatoryState {
  mode: Mode;
  selectedId: AnatomyId;
  layers: Record<LayerId, boolean>;
  surfaceOpacity: number;
  isolated: boolean;
  savedLayers: Record<LayerId, boolean> | null;
  focus: { target: FocusTarget; nonce: number };
  reducedMotion: boolean;
  paused: boolean;
  scanT: number;
  scanRevision: number;
  canonOnly: boolean;
  inspectorOpen: boolean;
  metrics: SceneMetrics | null;
  setMode: (mode: Mode) => void;
  select: (id: AnatomyId, focus?: boolean) => void;
  focusOn: (target: FocusTarget) => void;
  reset: () => void;
  toggleLayer: (layer: LayerId) => void;
  setOpacity: (value: number) => void;
  toggleIsolate: () => void;
  setReducedMotion: (reduced: boolean) => void;
  setPaused: (paused: boolean) => void;
  scrub: (t: number) => void;
  setCanonOnly: (value: boolean) => void;
  setInspectorOpen: (value: boolean) => void;
  setMetrics: (metrics: SceneMetrics) => void;
}
const clamp = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
export const useObservatory = create<ObservatoryState>((set) => ({
  mode: 'body', selectedId: 'human.surface', layers: { ...initialLayers }, surfaceOpacity: 0.94,
  isolated: false, savedLayers: null, focus: { target: 'overview', nonce: 0 },
  reducedMotion: false, paused: false, scanT: 0.35, scanRevision: 0, canonOnly: false,
  inspectorOpen: true, metrics: null,
  setMode: (mode) => set({ mode }),
  select: (id, focus = true) => set((s) => ({
    selectedId: id, inspectorOpen: true, isolated: false, savedLayers: null,
    layers: { ...s.layers, [anatomyLayer[id]]: true },
    ...(anatomyLayer[id] !== 'surface' ? { surfaceOpacity: Math.min(s.surfaceOpacity, 0.2) } : {}),
    focus: focus ? { target: id, nonce: s.focus.nonce + 1 } : s.focus,
  })),
  focusOn: (target) => set((s) => ({ focus: { target, nonce: s.focus.nonce + 1 } })),
  reset: () => set((s) => ({ layers: { ...initialLayers }, isolated: false, savedLayers: null,
    surfaceOpacity: 0.94, focus: { target: 'overview', nonce: s.focus.nonce + 1 } })),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] }, isolated: false, savedLayers: null })),
  setOpacity: (value) => set({ surfaceOpacity: clamp(value) }),
  toggleIsolate: () => set((s) => s.isolated ? { isolated: false, layers: s.savedLayers ?? { ...initialLayers }, savedLayers: null }
    : { isolated: true, savedLayers: { ...s.layers }, layers: { surface: false, muscular: false, skeletal: false, internal: false, [anatomyLayer[s.selectedId]]: true } }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion, ...(reducedMotion ? { paused: true, scanT: clamp(scanClock.progress) } : {}) }),
  setPaused: (paused) => set({ paused, scanT: clamp(scanClock.progress) }),
  scrub: (value) => { scanClock.progress = clamp(value); set((s) => ({ scanT: clamp(value), scanRevision: s.scanRevision + 1, paused: true })); },
  setCanonOnly: (canonOnly) => set({ canonOnly }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setMetrics: (metrics) => set({ metrics }),
}));
