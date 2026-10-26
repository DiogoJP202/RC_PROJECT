import { beforeEach, describe, expect, it } from 'vitest';
import { useObservatory } from './observatory';
import { advanceVascularClock, DEFAULT_VASCULAR_SPEED, selectedVascularEntityPresent, useVascular, vascularClock, vascularSpeedMultiplier } from './vascular';

const initial = useVascular.getInitialState();
const observatory = useObservatory.getInitialState();
const available = { reducedMotion: false, hidden: false, available: true, active: true };
beforeEach(() => {
  useVascular.setState(initial, true); useObservatory.setState(observatory, true);
  vascularClock.seconds = 0; vascularClock.speed = 1; vascularClock.revision = 0;
});

describe('vascular event store and absolute transport clock', () => {
  it('starts paused, gates playback by readiness and preserves transient time on pause', () => {
    const commands = useVascular.getState();
    commands.play(); expect(useVascular.getState().playing).toBe(false);
    commands.setReady(true); commands.play(); advanceVascularClock(.4, available);
    expect(vascularClock.seconds).toBe(.4);
    expect(useVascular.getState().seconds).toBe(0);
    commands.pause(); expect(useVascular.getState()).toMatchObject({ playing: false, seconds: .4 });
    commands.play(); advanceVascularClock(.6, available);
    expect(vascularClock.seconds).toBe(1);
    commands.setReady(false);
    expect(useVascular.getState()).toMatchObject({ playing: false, seconds: 1, ready: false });
  });

  it('ticks without store notifications and is independent of frame partition', () => {
    const commands = useVascular.getState();
    commands.setReady(true); commands.play();
    let notifications = 0;
    const unsubscribe = useVascular.subscribe(() => { notifications++; });
    for (let index = 0; index < 180; index++) advanceVascularClock(1 / 60, available);
    expect(notifications).toBe(0);
    expect(vascularClock.seconds).toBeCloseTo(3, 12);
    unsubscribe();
    commands.scrub(0); commands.play(); advanceVascularClock(3, available);
    expect(vascularClock.seconds).toBe(3);
  });

  it('maps normalized artistic speed without changing the absolute pose', () => {
    const commands = useVascular.getState();
    commands.scrub(5);
    for (const [speed, multiplier] of [[0, .25], [DEFAULT_VASCULAR_SPEED, 1], [1, 2]]) {
      commands.setSpeed(speed);
      expect(vascularSpeedMultiplier(speed)).toBeCloseTo(multiplier, 13);
      expect(vascularClock.speed).toBeCloseTo(multiplier, 13);
      expect(vascularClock.seconds).toBe(5);
    }
    commands.setSpeed(9); expect(useVascular.getState().speed).toBe(1);
    commands.setSpeed(NaN); expect(useVascular.getState().speed).toBe(DEFAULT_VASCULAR_SPEED);
  });

  it('retains a removed selection explicitly and refuses to silently track a replacement', () => {
    const commands = useVascular.getState();
    commands.setConfig({ count: 2000 }); commands.select('rc:17:1600'); commands.setCameraMode('tracking');
    expect(selectedVascularEntityPresent()).toBe(true);
    commands.setConfig({ count: 100 });
    expect(useVascular.getState()).toMatchObject({ selectedId: 'rc:17:1600', cameraMode: 'free' });
    expect(selectedVascularEntityPresent()).toBe(false);
    commands.setCameraMode('tracking'); expect(useVascular.getState().cameraMode).toBe('free');
    commands.setConfig({ count: 2000 }); expect(selectedVascularEntityPresent()).toBe(true);
    commands.setCameraMode('tracking'); expect(useVascular.getState().cameraMode).toBe('tracking');
    commands.setConfig({ seed: 18 });
    expect(useVascular.getState().selectedId).toBe('rc:17:1600');
    expect(selectedVascularEntityPresent()).toBe(false);
  });

  it('supports finite manual scrub, discrete steps and reset without destroying configuration or identity', () => {
    const commands = useVascular.getState();
    commands.select('rc:17:0'); commands.setConfig({ count: 100 }); commands.setHighlightRC(true);
    commands.scrub(7.5); commands.step(-.5); expect(vascularClock.seconds).toBe(7);
    commands.step(Infinity); expect(vascularClock.seconds).toBe(7);
    commands.scrub(-2); expect(vascularClock.seconds).toBe(0);
    commands.scrub(NaN); expect(vascularClock.seconds).toBe(0);
    commands.setCameraMode('tracking');
    const revision = useVascular.getState().cameraRevision;
    commands.reset();
    expect(useVascular.getState()).toMatchObject({ seconds: 0, playing: false, selectedId: 'rc:17:0', highlightRC: true,
      cameraMode: 'free', cameraRevision: revision + 1, config: { count: 100 } });
    commands.setCameraMode('flow'); commands.resetCamera();
    expect(useVascular.getState()).toMatchObject({ cameraMode: 'free', cameraRevision: revision + 2 });
  });

  it.each([{ reducedMotion: true }, { hidden: true }, { available: false }, { active: false }])('pauses without changing pose when work is blocked: %j', (blocked) => {
    const commands = useVascular.getState();
    commands.scrub(2.3); commands.setReady(true); commands.play();
    advanceVascularClock(1, { ...available, ...blocked });
    expect(useVascular.getState()).toMatchObject({ playing: false, seconds: 2.3 });
    expect(vascularClock.seconds).toBe(2.3);
    advanceVascularClock(1, available); expect(vascularClock.seconds).toBe(2.3);
  });

  it('respects reduced motion while retaining all manual commands and rejects invalid deltas', () => {
    const commands = useVascular.getState();
    commands.setReady(true); useObservatory.getState().setReducedMotion(true); commands.play();
    expect(useVascular.getState().playing).toBe(false);
    commands.step(.5); expect(vascularClock.seconds).toBe(.5);
    useObservatory.getState().setReducedMotion(false); commands.play();
    for (const delta of [NaN, Infinity, -Infinity, 0, -1]) advanceVascularClock(delta, available);
    expect(vascularClock.seconds).toBe(.5);
  });
});
