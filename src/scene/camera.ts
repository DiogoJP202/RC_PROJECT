import type { FocusTarget } from '../app/types';

export type Triplet = [number, number, number];
export interface CameraPose { position: Triplet; target: Triplet }
export interface FocusVolume { center: Triplet; size: Triplet }

/** Framing in world metres; the 1.85 m proxy is a design convention, not a ghoul measurement. */
export function overviewDistance(height: number, fovDegrees: number, aspect: number, occupancy = 0.68, width = 0.76): number {
  if (!Number.isFinite(aspect) || aspect <= 0) aspect = 1.2;
  const vertical = height / (2 * Math.tan((fovDegrees * Math.PI) / 360) * occupancy);
  const horizontal = width / (2 * Math.tan((fovDegrees * Math.PI) / 360) * Math.max(aspect, 0.2) * 0.8);
  return Math.max(vertical, horizontal);
}

export function cameraPose(target: FocusTarget, aspect: number, fov = 36, volume?: FocusVolume): CameraPose {
  if (volume && (target === 'overview' || target === 'posterior')) {
    const distance = overviewDistance(Math.max(volume.size[1], .1), fov, aspect, .68, Math.max(volume.size[0], .1));
    const center: Triplet = [...volume.center];
    if (aspect < .9) center[1] += .12;
    return { target: center, position: [center[0] + distance * (target === 'posterior' ? -.25 : .28), center[1] + .04, center[2] + distance * (target === 'posterior' ? -.97 : .96)] };
  }
  if (volume && target !== 'overview' && target !== 'posterior' && volume.size.every((n) => Number.isFinite(n) && n >= 0) && volume.center.every(Number.isFinite)) {
    const width = Math.max(volume.size[0], .08), height = Math.max(volume.size[1], .08), depth = Math.max(volume.size[2], .08);
    const distance = Math.max(height, width / Math.max(aspect, .2)) / (2 * Math.tan(fov * Math.PI / 360) * .56) + depth;
    const center: Triplet = [...volume.center];
    if (aspect < .9) center[1] += height * .16;
    const posterior = target === 'ghoul.kakuhou.rinkaku';
    return { target: center, position: [center[0] + (posterior ? -.24 : .19) * distance, center[1] + .07 * distance, center[2] + (posterior ? -.98 : .98) * distance] };
  }
  const distance = overviewDistance(1.85, fov, aspect);
  if (target === 'overview' || target === 'human.surface' || target === 'human.muscular' || target === 'human.skeletal') {
    const offset = aspect < .9 ? .12 : 0;
    return { position: [distance * 0.28, 0.98 + offset, distance * 0.96], target: [0, 0.94 + offset, 0] };
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
