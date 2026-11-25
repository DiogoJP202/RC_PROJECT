import type { BodyCameraSnapshot } from '../bodyContext';

interface VascularInspectionCamera {
  /** undefined means the clock, selection or lens command has not reached the renderer. */
  capture: () => BodyCameraSnapshot | undefined;
  restore: (snapshot: BodyCameraSnapshot) => void;
}

export const vascularInspectionCamera = { controller: null as VascularInspectionCamera | null };
