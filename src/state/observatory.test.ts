import { beforeEach, describe, expect, it } from 'vitest';
import { useObservatory } from './observatory';
import { scanClock } from './scanClock';

const initial = useObservatory.getInitialState();
beforeEach(() => { useObservatory.setState(initial, true); scanClock.progress = 0.35; });
describe('investigation context', () => {
  it('reveals the selected internal layer and leaves its placement conceptual', () => {
    const s = useObservatory.getState(); s.toggleLayer('internal'); s.select('ghoul.kakuhou.rinkaku');
    expect(useObservatory.getState()).toMatchObject({ selectedId: 'ghoul.kakuhou.rinkaku', layers: { internal: true }, focus: { target: 'ghoul.kakuhou.rinkaku' } });
    expect(useObservatory.getState().surfaceOpacity).toBeLessThanOrEqual(0.2);
  });
  it('restores the exact visibility configuration after isolation', () => {
    const s = useObservatory.getState(); s.toggleLayer('skeletal'); s.select('human.skeletal');
    const layers = { ...useObservatory.getState().layers };
    s.toggleIsolate(); expect(useObservatory.getState().layers.surface).toBe(false);
    s.toggleIsolate(); expect(useObservatory.getState().layers).toEqual(layers);
  });
  it('preserves selection, layers, opacity and scrub while changing modes', () => {
    const s = useObservatory.getState(); s.select('human.thorax'); s.scrub(0.67);
    const { selectedId, layers, surfaceOpacity, scanT } = useObservatory.getState();
    s.setMode('micro'); s.setMode('compare'); s.setMode('body');
    expect(useObservatory.getState()).toMatchObject({ selectedId, layers, surfaceOpacity, scanT });
  });
  it('clamps hostile scrub values and pauses playback', () => {
    const s = useObservatory.getState();
    s.scrub(NaN); expect(useObservatory.getState().scanT).toBe(0);
    s.scrub(8); expect(useObservatory.getState()).toMatchObject({ scanT: 1, paused: true });
    s.scrub(-8); expect(useObservatory.getState().scanT).toBe(0);
  });
  it('captures the actual transient frame on pause', () => {
    scanClock.progress = 0.81; useObservatory.getState().setPaused(true);
    expect(useObservatory.getState()).toMatchObject({ paused: true, scanT: 0.81 });
  });
  it('reduced motion stops playback and camera reset is repeatable', () => {
    scanClock.progress = 0.62;
    const s = useObservatory.getState(); s.setReducedMotion(true); s.select('human.head'); s.reset();
    const before = useObservatory.getState(); s.reset();
    expect(useObservatory.getState()).toMatchObject({ reducedMotion: true, paused: true, scanT: 0.62, focus: { target: 'overview' }, layers: initial.layers, surfaceOpacity: initial.surfaceOpacity });
    expect(useObservatory.getState().focus.nonce).toBe(before.focus.nonce + 1);
  });
});
