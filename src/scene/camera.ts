import type { FocusTarget } from '../app/types';

export type Triplet = [number, number, number];
export interface CameraPose { position: Triplet; target: Triplet }

/** Framing in world metres; the 1.85 m proxy is a design convention, not a ghoul measurement. */
export function overviewDistance(height: number, fovDegrees: number, aspect: number, occupancy = 0.68): number {
  if (!Number.isFinite(aspect) || aspect <= 0) aspect = 1.2;
  const vertical = height / (2 * Math.tan((fovDegrees * Math.PI) / 360) * occupancy);
  const horizontal = 0.76 / (2 * Math.tan((fovDegrees * Math.PI) / 360) * Math.max(aspect, 0.2) * 0.8);
  return Math.max(vertical, horizontal);
}

export function cameraPose(target: FocusTarget, aspect: number, fov = 36): CameraPose {
  const distance = overviewDistance(1.85, fov, aspect);
  if (target === 'overview' || target === 'human.surface' || target === 'human.muscular' || target === 'human.skeletal') {
    return { position: [distance * 0.28, 0.98, distance * 0.96], target: [0, 0.94, 0] };
  }
  if (target === 'posterior') return { position: [-distance * 0.25, 1.02, -distance * 0.97], target: [0, 0.96, 0] };
  if (target === 'ghoul.kakuhou.rinkaku') return { position: [-0.53, 1.1, -1.17], target: [0, 0.98, -0.12] };
  if (target === 'human.head') return { position: [0.34, 1.73, 1.05], target: [0, 1.7, 0] };
  return { position: [0.51, 1.41, 1.44], target: [0, 1.31, 0] };
}

export function smoothFocus(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}
