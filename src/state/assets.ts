import { create } from 'zustand';
import { assetClock } from './assetClock';

interface AssetState {
  requestedId: string;
  attempt: number;
  status: 'proxy' | 'loading' | 'ready' | 'error';
  message: string;
  clip: string;
  clips: string[];
  sample: number;
  animationRevision: number;
  playing: boolean;
  choose: (id: string) => void;
  retry: () => void;
  report: (status: AssetState['status'], message?: string) => void;
  setClip: (clip: string) => void;
  setClips: (clips: string[]) => void;
  scrub: (sample: number) => void;
  setPlaying: (playing: boolean) => void;
}

/** Asset events only. Mixer time, skeleton poses and bounds do not tick React. */
export const useAssets = create<AssetState>((set) => ({
  requestedId: 'proxy', attempt: 0, status: 'proxy', message: '',
  clip: '', clips: [], sample: 0, animationRevision: 0, playing: false,
  choose: (requestedId) => set((s) => ({ requestedId, attempt: s.attempt + 1,
    status: requestedId === 'proxy' ? 'proxy' : 'loading', message: '', clip: '', clips: [], sample: 0, playing: false, animationRevision: s.animationRevision + 1 })),
  retry: () => set((s) => ({ attempt: s.attempt + 1, status: 'loading', message: '' })),
  report: (status, message = '') => set({ status, message }),
  setClip: (clip) => set((s) => ({ clip, sample: 0, playing: false, animationRevision: s.animationRevision + 1 })),
  setClips: (clips) => set({ clips }),
  scrub: (sample) => set((s) => ({ sample: Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0, playing: false, animationRevision: s.animationRevision + 1 })),
  setPlaying: (playing) => set((s) => ({ playing, ...(!playing && assetClock.clip === s.clip ? { sample: assetClock.normalized } : {}) })),
}));
