import { beforeEach, describe, expect, it } from 'vitest';
import { sampleRinkakuAt, PHASES } from '../simulation/rinkaku';
import {
  playbackTimeAt, RINKAKU_PLAYBACK_DURATION_SECONDS, rinkakuTAtPlaybackTime,
} from '../simulation/rinkakuPlayback';
import { useObservatory } from './observatory';
import { advanceRinkakuClock, rinkakuClock, useRinkaku } from './rinkaku';
import { scanClock } from './scanClock';

const initialRinkaku = useRinkaku.getInitialState();
const initialObservatory = useObservatory.getInitialState();
const available = { reducedMotion: false, hidden: false, bodyMode: true, available: true };
beforeEach(() => {
  useRinkaku.setState(initialRinkaku, true);
  useObservatory.setState(initialObservatory, true);
  rinkakuClock.t = 0;
  rinkakuClock.elapsedSeconds = 0;
  rinkakuClock.revision = 0;
  Object.assign(rinkakuClock.snapshot, sampleRinkakuAt(0));
  scanClock.progress = 0.35;
});

describe('Rinkaku event store and renderer clock', () => {
  it('enters manifestation by pausing scan without changing anatomical context', () => {
    useObservatory.getState().select('human.thorax');
    useObservatory.getState().toggleLayer('skeletal');
    scanClock.progress = 0.78;
    const { selectedId, layers, surfaceOpacity, focus } = useObservatory.getState();
    useRinkaku.getState().setEnabled(true);
    expect(useObservatory.getState()).toMatchObject({ selectedId, layers, surfaceOpacity, focus, paused: true, scanT: 0.78 });
    expect(useRinkaku.getState()).toMatchObject({ enabled: true, playing: false });
  });

  it('advances and reverses the same pose without React/store notifications per frame', () => {
    useRinkaku.getState().setEnabled(true);
    useRinkaku.getState().scrub(0.5);
    useRinkaku.getState().play(1);
    let updates = 0;
    const unsubscribe = useRinkaku.subscribe(() => { updates += 1; });
    for (let i = 0; i < 180; i += 1) advanceRinkakuClock(1 / 60, available);
    expect(rinkakuClock.t).toBeCloseTo(2 / 3);
    expect(useRinkaku.getState().t).toBe(0.5);
    expect(updates).toBe(0);
    useRinkaku.getState().play(-1);
    for (let i = 0; i < 180; i += 1) advanceRinkakuClock(1 / 60, available);
    expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(rinkakuClock.t));
    expect(rinkakuClock.t).toBeCloseTo(0.5);
    expect(updates).toBe(1);
    unsubscribe();
  });

  it('pauses exactly on the transient frame and handles rapid play/pause/scrub', () => {
    const commands = useRinkaku.getState();
    for (const t of [0.9, 0.2, 0.7, 0.1]) {
      commands.scrub(t); commands.play(); advanceRinkakuClock(0.15, available); commands.pause();
      expect(useRinkaku.getState().t).toBe(rinkakuClock.t);
      expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(rinkakuClock.t));
      commands.play(-1); commands.scrub(t);
      expect(useRinkaku.getState()).toMatchObject({ t, playing: false });
      expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(t));
    }
  });

  it('stops at both endpoints and requires an explicit restart', () => {
    const commands = useRinkaku.getState();
    commands.play(); advanceRinkakuClock(RINKAKU_PLAYBACK_DURATION_SECONDS, available);
    expect(useRinkaku.getState()).toMatchObject({ playing: false, t: 1 });
    expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(1));
    commands.play(); expect(useRinkaku.getState().playing).toBe(false);
    commands.play(-1); advanceRinkakuClock(RINKAKU_PLAYBACK_DURATION_SECONDS, available);
    expect(useRinkaku.getState()).toMatchObject({ playing: false, t: 0 });
    commands.play(-1); expect(useRinkaku.getState().playing).toBe(false);
  });

  it('selects all seven phases and manually steps with clamped finite values', () => {
    const commands = useRinkaku.getState();
    for (const phase of PHASES) {
      commands.selectPhase(phase.key);
      expect(rinkakuClock.snapshot.phase).toBe(phase.key);
      expect(rinkakuClock.snapshot.localPhaseProgress).toBeCloseTo(0.5);
      expect(useRinkaku.getState().playing).toBe(false);
    }
    commands.step(10); expect(rinkakuClock.t).toBe(1);
    commands.step(-10); expect(rinkakuClock.t).toBe(0);
    commands.scrub(0.4); commands.step(Infinity); expect(rinkakuClock.t).toBe(0.4);
    commands.scrub(NaN); expect(rinkakuClock.t).toBe(0);
  });

  it('changes representation config without changing time, direction or anatomical selection', () => {
    const commands = useRinkaku.getState();
    useObservatory.getState().select('human.skeletal');
    commands.scrub(0.9); commands.play(-1);
    for (const appendageCount of [1, 2, 3, 4] as const) {
      commands.setConfig({ appendageCount });
      expect(rinkakuClock.snapshot).toMatchObject({ t: 0.9, appendageCount });
      expect(useRinkaku.getState()).toMatchObject({ t: 0.9, playing: true, direction: -1 });
    }
    commands.setConfig({ particles: false, quality: 'low', seed: NaN });
    expect(rinkakuClock.snapshot).toMatchObject({ t: 0.9, particles: false, particleEmission: 0, quality: 'low', seed: 17 });
    expect(useObservatory.getState().selectedId).toBe('human.skeletal');
  });

  it('reset returns to the same frame while retaining chosen configuration', () => {
    const commands = useRinkaku.getState();
    commands.setEnabled(true); commands.setConfig({ appendageCount: 2, seed: 11, particles: false });
    commands.scrub(0.93); commands.play(-1); commands.reset();
    const expected = sampleRinkakuAt(0, useRinkaku.getState().config);
    expect(rinkakuClock.snapshot).toEqual(expected);
    expect(useRinkaku.getState()).toMatchObject({ t: 0, playing: false, direction: 1, enabled: true });
    commands.reset(); expect(rinkakuClock.snapshot).toEqual(expected);
  });

  it('disabling and reentering conserve pose and stop playback', () => {
    const commands = useRinkaku.getState();
    commands.scrub(0.63); commands.play(); advanceRinkakuClock(0.5, available);
    const expected = { ...rinkakuClock.snapshot };
    commands.setEnabled(false); advanceRinkakuClock(8, available); commands.setEnabled(true);
    expect(rinkakuClock.snapshot).toEqual(expected);
    expect(useRinkaku.getState().playing).toBe(false);
  });

  it.each([
    { reducedMotion: true }, { hidden: true }, { bodyMode: false }, { available: false },
  ])('preserves pose and cancels playback when blocked: %j', (condition) => {
    const commands = useRinkaku.getState();
    commands.scrub(0.6); commands.play();
    advanceRinkakuClock(2, { ...available, ...condition });
    expect(useRinkaku.getState()).toMatchObject({ playing: false, t: 0.6 });
    expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(0.6));
    advanceRinkakuClock(2, available); expect(rinkakuClock.t).toBe(0.6);
  });

  it('reduced motion refuses autoplay while allowing all manual poses', () => {
    useObservatory.getState().setReducedMotion(true);
    useRinkaku.getState().play();
    expect(useRinkaku.getState().playing).toBe(false);
    useRinkaku.getState().selectPhase('active');
    expect(rinkakuClock.snapshot.phase).toBe('active');
    useRinkaku.getState().step(-0.1); expect(rinkakuClock.t).toBeCloseTo(0.8);
  });

  it('ignores invalid frame deltas instead of corrupting or reversing the clock', () => {
    useRinkaku.getState().scrub(0.5); useRinkaku.getState().play();
    for (const delta of [0, -1, Infinity, -Infinity, NaN]) advanceRinkakuClock(delta, available);
    expect(rinkakuClock.t).toBe(0.5);
    expect(useRinkaku.getState().playing).toBe(true);
  });

  it('keeps playback seconds separate and rederives them after arbitrary manual commands', () => {
    const commands = useRinkaku.getState();
    for (const t of [0.98, 0.14, 0.95, 0.7, 0.94]) {
      commands.scrub(t);
      expect(rinkakuClock.elapsedSeconds).toBe(playbackTimeAt(t));
      commands.play(-1); advanceRinkakuClock(0.4, available); commands.pause();
      expect(rinkakuClock.t).toBeCloseTo(rinkakuTAtPlaybackTime(playbackTimeAt(t) - 0.4), 13);
      expect(rinkakuClock.elapsedSeconds).toBeCloseTo(playbackTimeAt(rinkakuClock.t), 13);
      expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(rinkakuClock.t));
      commands.step(0.02);
      expect(rinkakuClock.elapsedSeconds).toBe(playbackTimeAt(rinkakuClock.t));
    }
    commands.reset();
    expect(rinkakuClock.elapsedSeconds).toBe(0);
  });

  it('preserves pose across pause/resume and retraces the same slowdown curve in reverse', () => {
    const commands = useRinkaku.getState();
    commands.scrub(0.92); commands.play(1);
    advanceRinkakuClock(1.8, available);
    const midT = rinkakuClock.t;
    const midSeconds = rinkakuClock.elapsedSeconds;
    const midSnapshot = { ...rinkakuClock.snapshot };
    commands.pause(); advanceRinkakuClock(4, available);
    expect(rinkakuClock.snapshot).toEqual(midSnapshot);
    expect(rinkakuClock.elapsedSeconds).toBeCloseTo(midSeconds, 13);
    commands.play(); advanceRinkakuClock(0.6, available);
    commands.play(-1); advanceRinkakuClock(0.6, available);
    expect(rinkakuClock.t).toBeCloseTo(midT, 13);
    advanceRinkakuClock(1.8, available);
    expect(rinkakuClock.t).toBeCloseTo(0.92, 13);
    expect(rinkakuClock.elapsedSeconds).toBeCloseTo(playbackTimeAt(0.92), 12);
  });

  it('is independent of frame partition in both directions through retraction', () => {
    const commands = useRinkaku.getState();
    for (const direction of [1, -1] as const) {
      const start = direction === 1 ? 0.9 : 0.995;
      commands.scrub(start); commands.play(direction);
      advanceRinkakuClock(2.4, available);
      const singleT = rinkakuClock.t;
      const singleSeconds = rinkakuClock.elapsedSeconds;
      commands.scrub(start); commands.play(direction);
      for (let index = 0; index < 144; index += 1) advanceRinkakuClock(1 / 60, available);
      expect(rinkakuClock.t).toBeCloseTo(singleT, 12);
      expect(rinkakuClock.elapsedSeconds).toBeCloseTo(singleSeconds, 11);
      expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(rinkakuClock.t));
    }
  });

  it('repeats ten complete manifestation/retraction cycles with identical final frames', () => {
    const commands = useRinkaku.getState();
    const snapshotIdentity = rinkakuClock.snapshot;
    for (let cycle = 0; cycle < 10; cycle += 1) {
      commands.reset(); commands.play();
      for (let step = 0; step < RINKAKU_PLAYBACK_DURATION_SECONDS / 0.2; step += 1) {
        advanceRinkakuClock(0.2, available);
      }
      // Floating point accumulation is clamped by the final explicit tail.
      advanceRinkakuClock(0.001, available);
      expect(rinkakuClock.t).toBe(1);
      expect(rinkakuClock.snapshot).toBe(snapshotIdentity);
      expect(rinkakuClock.snapshot).toEqual(sampleRinkakuAt(1));
      expect(useRinkaku.getState().playing).toBe(false);
    }
  });
});
