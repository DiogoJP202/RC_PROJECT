import type { BodyCameraSnapshot } from '../scene/bodyContext';
import type { VascularConfig } from '../simulation/vascular';
import type { VascularCameraMode } from '../state/vascular';

export interface VascularInspectionSnapshot {
  seconds: number;
  wasPlaying: boolean;
  speed: number;
  multiplier: number;
  config: VascularConfig;
  selectedId: string | null;
  highlightRC: boolean;
  cameraMode: VascularCameraMode;
  cameraRevision: number;
  camera: BodyCameraSnapshot | null;
  scroll: number;
  panel: 'controls' | 'inspect' | null;
  tab: 'structure' | 'evidence';
}

export interface VascularInspectionController {
  owner: object;
  /** undefined indicates a command waiting for its first rendered frame. */
  capture: () => VascularInspectionSnapshot | null | undefined;
  restore: (snapshot: VascularInspectionSnapshot) => void;
}

/** Installed by the lazy Micro UI. The app shell owns navigation, never GPU resources. */
export const vascularInspection = {
  controller: null as VascularInspectionController | null,
};

export async function captureInspection(signal: AbortSignal): Promise<VascularInspectionSnapshot | null> {
  const controller = vascularInspection.controller;
  if (!controller) return null;
  while (!signal.aborted && vascularInspection.controller === controller) {
    const snapshot = controller.capture();
    if (snapshot !== undefined) return snapshot;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return null;
}
