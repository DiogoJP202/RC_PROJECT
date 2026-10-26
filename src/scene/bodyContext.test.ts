import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { useObservatory } from '../state/observatory';
import { useRinkaku, rinkakuClock } from '../state/rinkaku';
import { useAssets } from '../state/assets';
import { scanClock } from '../state/scanClock';
import { assetClock } from '../state/assetClock';
import { bodySceneBridge, captureBodyCamera, restoreBodyCamera, type BodyControls, type BodySceneController } from './bodyContext';

function controls(): BodyControls {
  return { target: new Vector3(.14, 1.1, -.13), enabled: true, enableDamping: true,
    minDistance: .42, maxDistance: 6.8, minPolarAngle: .45, maxPolarAngle: 1.87, update() {} };
}
const initialObservatory = useObservatory.getInitialState();
const initialRinkaku = useRinkaku.getInitialState();
const initialAssets = useAssets.getInitialState();
let unbind: (() => void) | undefined;
beforeEach(() => {
  useObservatory.setState(initialObservatory, true); useRinkaku.setState(initialRinkaku, true); useAssets.setState(initialAssets, true);
  useRinkaku.getState().reset(); scanClock.progress = .35; assetClock.normalized = 0; assetClock.clip = '';
  bodySceneBridge.saved = null; bodySceneBridge.entering = false; bodySceneBridge.restoredCamera = false; bodySceneBridge.restoreRevision = 0;
});
afterEach(() => { unbind?.(); unbind = undefined; bodySceneBridge.cancelEntry(); });

describe('Body camera and scale-transition context', () => {
  it('roundtrips the real perspective orbit, orientation, up and projection without a camera preset', () => {
    const camera = new PerspectiveCamera(43, 1.6, .018, 68);
    camera.position.set(-1.3, 1.45, -2.2); camera.lookAt(.14, 1.1, -.13); camera.zoom = 1.17; camera.filmOffset = 2;
    camera.updateProjectionMatrix();
    const orbit = controls();
    const saved = captureBodyCamera(camera, orbit);
    camera.position.set(9, 8, 7); camera.up.set(1, 0, 0); camera.quaternion.set(0, 0, 0, 1);
    camera.fov = 80; camera.aspect = .5; camera.near = .2; camera.far = 10; camera.zoom = .5;
    orbit.target.set(0, 0, 0); orbit.maxDistance = 1;
    restoreBodyCamera(camera, orbit, saved);
    expect(captureBodyCamera(camera, orbit)).toEqual(saved);
  });

  it('preserves orthographic bounds without assuming a perspective camera', () => {
    const camera = new OrthographicCamera(-3, 4, 2, -2, .01, 90);
    camera.zoom = 1.3; camera.position.set(.2, 1, 4);
    const orbit = controls();
    const saved = captureBodyCamera(camera, orbit);
    camera.left = -1; camera.right = 1; camera.top = 1; camera.bottom = -1;
    restoreBodyCamera(camera, orbit, saved);
    expect(captureBodyCamera(camera, orbit)).toEqual(saved);
  });

  it('restores the actual camera while a new reduced-motion preference overrides saved inertia', () => {
    const camera = new PerspectiveCamera(); camera.position.set(1, 2, -3);
    const orbit = controls(), saved = captureBodyCamera(camera, orbit);
    expect(saved.controls.enableDamping).toBe(true);
    useObservatory.getState().setReducedMotion(true);
    camera.position.set(5, 6, 7);
    restoreBodyCamera(camera, orbit, saved);
    expect(camera.position.toArray()).toEqual(saved.position);
    expect(orbit.enableDamping).toBe(false);
    // Repeated layout restoration must not reintroduce the saved inertia.
    restoreBodyCamera(camera, orbit, saved);
    expect(orbit.enableDamping).toBe(false);
  });

  it('captures before cinematic entry and restores selection, layers, isolation, true clocks and playback context', () => {
    const camera = new PerspectiveCamera(); camera.position.set(1.1, 1.2, -2.3); camera.lookAt(0, 1, 0);
    const orbit = controls();
    let complete: (() => void) | undefined;
    const binding: BodySceneController = { capture: () => captureBodyCamera(camera, orbit),
      restore: (saved) => restoreBodyCamera(camera, orbit, saved),
      prepareEntry: (callback) => { complete = callback; camera.position.set(0, 1.2, .4); }, cancelEntry() {} };
    unbind = bodySceneBridge.bind(binding);
    useObservatory.getState().select('human.skeletal'); useObservatory.getState().toggleIsolate();
    useRinkaku.getState().setEnabled(true); useRinkaku.getState().setConfig({ appendageCount: 2, seed: 31 });
    useRinkaku.getState().scrub(.71); useRinkaku.getState().play(-1);
    scanClock.progress = .81;
    useAssets.setState({ clip: 'fixture_sway', playing: true }); assetClock.clip = 'fixture_sway'; assetClock.normalized = .63;
    const before = captureBodyCamera(camera, orbit);
    bodySceneBridge.prepareEntry(() => useObservatory.getState().setMode('micro'));
    const saved = bodySceneBridge.saved!;
    expect(saved.camera).toEqual(before);
    expect(saved.rinkaku).toMatchObject({ playing: true, direction: -1, t: .71 });
    expect(useRinkaku.getState().playing).toBe(false);
    expect(useAssets.getState().playing).toBe(false);
    expect(bodySceneBridge.entering).toBe(true);
    complete?.(); expect(useObservatory.getState().mode).toBe('micro');
    useObservatory.getState().reset(); useObservatory.getState().select('human.head');
    useRinkaku.getState().scrub(.1); scanClock.progress = .2;
    bodySceneBridge.restore();
    expect(captureBodyCamera(camera, orbit)).toEqual(before);
    expect(useObservatory.getState()).toMatchObject({ ...saved.observatory, mode: 'body' });
    expect(scanClock.progress).toBe(.81);
    expect(useRinkaku.getState()).toMatchObject({ enabled: true, playing: true, t: .71, direction: -1, config: { appendageCount: 2, seed: 31 } });
    expect(rinkakuClock.elapsedSeconds).toBe(saved.rinkaku.elapsedSeconds);
    expect(useAssets.getState()).toMatchObject({ playing: true, sample: .63, clip: 'fixture_sway' });
  });

  it('supports direct Micro/fallback entry without a mounted Body renderer and retains changed accessibility preference', () => {
    useRinkaku.getState().scrub(.53); useRinkaku.getState().play();
    bodySceneBridge.prepareEntry(() => useObservatory.getState().setMode('micro'));
    expect(bodySceneBridge.saved?.camera).toBeNull();
    expect(bodySceneBridge.entering).toBe(false);
    useObservatory.getState().setReducedMotion(true);
    bodySceneBridge.restore();
    expect(useObservatory.getState()).toMatchObject({ mode: 'body', reducedMotion: true, paused: true });
    expect(useRinkaku.getState()).toMatchObject({ t: .53, playing: false });
  });

  it('cancels a pending cinematic callback without entering the next scale', () => {
    let complete: (() => void) | undefined;
    unbind = bodySceneBridge.bind({ capture: () => null, restore() {}, cancelEntry() {}, prepareEntry: (callback) => { complete = callback; } });
    bodySceneBridge.prepareEntry(() => useObservatory.getState().setMode('micro'));
    bodySceneBridge.cancelEntry(); complete?.();
    expect(useObservatory.getState().mode).toBe('body');
  });
});
