import type { Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import type { AnatomyId, FocusTarget, LayerId } from '../app/types';
import { useObservatory } from '../state/observatory';
import { scanClock } from '../state/scanClock';
import { rinkakuClock, useRinkaku } from '../state/rinkaku';
import { writeRinkakuAt, type RinkakuConfig } from '../simulation/rinkaku';
import { useAssets } from '../state/assets';
import { assetClock } from '../state/assetClock';

type Triplet = [number, number, number];
type QuaternionTuple = [number, number, number, number];
const isPerspective = (camera: Camera): camera is PerspectiveCamera => Boolean((camera as PerspectiveCamera).isPerspectiveCamera);
const isOrthographic = (camera: Camera): camera is OrthographicCamera => Boolean((camera as OrthographicCamera).isOrthographicCamera);

export interface BodyControls {
  target: Vector3;
  enabled: boolean;
  enableDamping: boolean;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  update: () => void;
}

export interface BodyCameraSnapshot {
  position: Triplet;
  quaternion: QuaternionTuple;
  up: Triplet;
  projection: { near: number; far: number; zoom: number; fov?: number; aspect?: number;
    left?: number; right?: number; top?: number; bottom?: number; filmGauge?: number; filmOffset?: number };
  controls: { target: Triplet; enabled: boolean; enableDamping: boolean; minDistance: number;
    maxDistance: number; minPolarAngle: number; maxPolarAngle: number };
}

export function captureBodyCamera(camera: Camera, controls: BodyControls): BodyCameraSnapshot {
  const projection = camera as PerspectiveCamera | OrthographicCamera;
  return {
    position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), up: camera.up.toArray(),
    projection: { near: projection.near, far: projection.far, zoom: projection.zoom,
      ...(isPerspective(camera) ? { fov: camera.fov, aspect: camera.aspect, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset }
        : isOrthographic(camera) ? { left: camera.left, right: camera.right, top: camera.top, bottom: camera.bottom } : {}) },
    controls: { target: controls.target.toArray(), enabled: controls.enabled, enableDamping: controls.enableDamping,
      minDistance: controls.minDistance, maxDistance: controls.maxDistance,
      minPolarAngle: controls.minPolarAngle, maxPolarAngle: controls.maxPolarAngle },
  };
}

/** Flush residual OrbitControls deltas, then restore the actual camera without a preset. */
export function restoreBodyCamera(camera: Camera, controls: BodyControls, saved: BodyCameraSnapshot): void {
  controls.enableDamping = false;
  controls.update();
  camera.position.fromArray(saved.position); camera.quaternion.fromArray(saved.quaternion); camera.up.fromArray(saved.up);
  controls.target.fromArray(saved.controls.target);
  controls.minDistance = saved.controls.minDistance; controls.maxDistance = saved.controls.maxDistance;
  controls.minPolarAngle = saved.controls.minPolarAngle; controls.maxPolarAngle = saved.controls.maxPolarAngle;
  if (isPerspective(camera) || isOrthographic(camera)) {
    camera.near = saved.projection.near; camera.far = saved.projection.far; camera.zoom = saved.projection.zoom;
    if (isPerspective(camera)) {
      camera.fov = saved.projection.fov ?? camera.fov; camera.aspect = saved.projection.aspect ?? camera.aspect;
      camera.filmGauge = saved.projection.filmGauge ?? camera.filmGauge; camera.filmOffset = saved.projection.filmOffset ?? camera.filmOffset;
    } else {
      camera.left = saved.projection.left ?? camera.left; camera.right = saved.projection.right ?? camera.right;
      camera.top = saved.projection.top ?? camera.top; camera.bottom = saved.projection.bottom ?? camera.bottom;
    }
    camera.updateProjectionMatrix();
  }
  controls.update();
  // OrbitControls computes orientation from target; retain the captured orientation exactly.
  camera.position.fromArray(saved.position); camera.quaternion.fromArray(saved.quaternion);
  camera.updateMatrixWorld(true);
  // A motion preference changed in Micro takes precedence over saved inertia.
  controls.enableDamping = saved.controls.enableDamping && !useObservatory.getState().reducedMotion;
  controls.enabled = saved.controls.enabled;
}

export interface BodyContextSnapshot {
  camera: BodyCameraSnapshot | null;
  observatory: {
    selectedId: AnatomyId; layers: Record<LayerId, boolean>; surfaceOpacity: number; isolated: boolean;
    savedLayers: Record<LayerId, boolean> | null; focus: { target: FocusTarget; nonce: number };
    paused: boolean; scanT: number; canonOnly: boolean; inspectorOpen: boolean; inspectorTab: 'structure' | 'evidence';
  };
  rinkaku: { enabled: boolean; playing: boolean; direction: 1 | -1; t: number; elapsedSeconds: number; config: RinkakuConfig };
  assets: { requestedId: string; clip: string; playing: boolean; sample: number };
}

export interface BodySceneController {
  capture: () => BodyCameraSnapshot | null;
  restore: (camera: BodyCameraSnapshot) => void;
  prepareEntry: (onComplete: () => void) => void;
  cancelEntry: () => void;
}

let controller: BodySceneController | null = null;

/** Shared navigation boundary; owns serializable context, never renderer resources. */
export const bodySceneBridge = {
  saved: null as BodyContextSnapshot | null,
  entering: false,
  restoreRevision: 0,
  restoredCamera: false,
  requestEntry: null as (() => void) | null,
  bind(next: BodySceneController): () => void {
    controller = next;
    if (this.restoredCamera && this.saved?.camera) next.restore(this.saved.camera);
    return () => { if (controller === next) controller = null; };
  },
  capture(): BodyContextSnapshot {
    const state = useObservatory.getState(), rinkaku = useRinkaku.getState(), assets = useAssets.getState();
    const saved: BodyContextSnapshot = {
      camera: controller?.capture() ?? null,
      observatory: { selectedId: state.selectedId, layers: { ...state.layers }, surfaceOpacity: state.surfaceOpacity,
        isolated: state.isolated, savedLayers: state.savedLayers ? { ...state.savedLayers } : null,
        focus: { ...state.focus }, paused: state.paused, scanT: scanClock.progress, canonOnly: state.canonOnly,
        inspectorOpen: state.inspectorOpen, inspectorTab: state.inspectorTab },
      rinkaku: { enabled: rinkaku.enabled, playing: rinkaku.playing, direction: rinkaku.direction,
        t: rinkakuClock.t, elapsedSeconds: rinkakuClock.elapsedSeconds, config: { ...rinkaku.config } },
      assets: { requestedId: assets.requestedId, clip: assets.clip, playing: assets.playing,
        sample: assetClock.clip === assets.clip ? assetClock.normalized : assets.sample },
    };
    this.saved = saved; this.restoredCamera = false;
    return saved;
  },
  prepareEntry(onComplete: () => void): void {
    if (this.entering) return;
    this.capture();
    useObservatory.getState().setPaused(true);
    useRinkaku.getState().pause();
    useAssets.getState().setPlaying(false);
    this.entering = true;
    const complete = () => {
      if (!this.entering) return;
      this.entering = false;
      onComplete();
    };
    if (controller && useObservatory.getState().mode === 'body' && !useObservatory.getState().reducedMotion) controller.prepareEntry(complete);
    else complete();
  },
  cancelEntry(): void {
    this.entering = false;
    controller?.cancelEntry();
  },
  restore(): void {
    this.cancelEntry();
    const saved = this.saved;
    if (!saved) { useObservatory.getState().setMode('body'); return; }
    // Accessibility is global: a changed motion preference in Micro remains authoritative.
    const reduced = useObservatory.getState().reducedMotion;
    const hidden = typeof document !== 'undefined' && document.hidden;
    this.restoreRevision += 1;
    this.restoredCamera = saved.camera !== null;
    scanClock.progress = saved.observatory.scanT;
    useObservatory.setState({ ...saved.observatory, layers: { ...saved.observatory.layers },
      savedLayers: saved.observatory.savedLayers ? { ...saved.observatory.savedLayers } : null,
      focus: { ...saved.observatory.focus }, mode: 'body', paused: saved.observatory.paused || reduced || hidden,
      scanRevision: useObservatory.getState().scanRevision + 1 });
    rinkakuClock.t = saved.rinkaku.t; rinkakuClock.elapsedSeconds = saved.rinkaku.elapsedSeconds;
    rinkakuClock.revision += 1;
    writeRinkakuAt(saved.rinkaku.t, saved.rinkaku.config, rinkakuClock.snapshot);
    useRinkaku.setState({ enabled: saved.rinkaku.enabled, playing: saved.rinkaku.playing && !reduced && !hidden,
      direction: saved.rinkaku.direction, t: saved.rinkaku.t, config: { ...saved.rinkaku.config }, revision: rinkakuClock.revision });
    const assets = useAssets.getState();
    if (assets.requestedId === saved.assets.requestedId) useAssets.setState({ clip: saved.assets.clip,
      sample: saved.assets.sample, playing: saved.assets.playing && !reduced && !hidden,
      animationRevision: assets.animationRevision + 1 });
    if (saved.camera) controller?.restore(saved.camera);
  },
};
