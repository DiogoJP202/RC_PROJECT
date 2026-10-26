import { createVesselFrame, vesselAt, VESSEL_LENGTH, VESSEL_MIN_RADIUS,
  type VascularSample, type VascularVector, type VesselFrame } from '../../simulation/vascular';

/** Current rendered population in global entity order, never pool/instance order. */
export interface CameraObstacles { centers: Float32Array; radii: Float32Array; count: number; selectedIndex: number }
export interface TrackingViewMetrics { occlusion: number; proximity: number; clearance: number; occluders: number; score: number }
export interface TrackingPlan {
  phase: number; normalOffset: number; binormalOffset: number; targetNormal: number; targetBinormal: number; ahead: number;
  candidate: number; position: VascularVector; target: VascularVector;
  baseline: TrackingViewMetrics; adapted: TrackingViewMetrics;
  /** Caller-owned scratch buffers; never interpreted as a prior camera state. */
  scratch: { frame: VesselFrame; position: VascularVector; metrics: TrackingViewMetrics };
}

export const TRACKING_CAMERA_RADIUS = .15;
const SAFE_RADIUS = VESSEL_MIN_RADIUS - .32;
// Normal/binormal offsets relative to the selected lane, and backward arc distance.
// The nominal G4A view remains candidate zero; closer/lateral views shorten the
// foreground corridor without moving a particle or changing its rendered scale.
const CANDIDATES = new Float64Array([
  -.15, .45, 1.4,
  -.55, .45, 1.0,
  .25, .45, 1.0,
  -.15, .85, 1.1,
  -.15, -.2, 1.0,
  -.6, 0, .95,
  .35, 0, .95,
  -.45, .7, .85,
  .15, .7, .85,
  -.15, .45, 1.05,
  -.15, .45, 1.8,
]);

export function createTrackingViewMetrics(): TrackingViewMetrics { return { occlusion: 0, proximity: 0, clearance: 0, occluders: 0, score: 0 }; }
export function createTrackingPlan(): TrackingPlan {
  return { phase: 0, normalOffset: 0, binormalOffset: 0, targetNormal: 0, targetBinormal: 0, ahead: 0,
    candidate: 0, position: [0, 0, 0], target: [0, 0, 0], baseline: createTrackingViewMetrics(), adapted: createTrackingViewMetrics(),
    scratch: { frame: createVesselFrame(), position: [0, 0, 0], metrics: createTrackingViewMetrics() } };
}

/** Continuous sphere/finite viewing-cone proxy. It measures visual risk, not mesh visibility or physiology. */
export function evaluateTrackingView(position: readonly number[], target: readonly number[], selectedRadius: number,
  obstacles: CameraObstacles, output: TrackingViewMetrics): TrackingViewMetrics {
  const dx = target[0] - position[0], dy = target[1] - position[1], dz = target[2] - position[2];
  const distanceSquared = Math.max(1e-12, dx * dx + dy * dy + dz * dz);
  const distance = Math.sqrt(distanceSquared);
  const count = Math.max(0, Math.min(obstacles.count | 0, obstacles.radii.length, Math.floor(obstacles.centers.length / 3)));
  let occlusion = 0, proximity = 0, clearance = Infinity, occluders = 0;
  for (let index = 0; index < count; index++) {
    if (index === obstacles.selectedIndex) continue;
    const radius = obstacles.radii[index];
    if (!Number.isFinite(radius) || radius < 0) continue;
    const at = index * 3;
    const x = obstacles.centers[at] - position[0], y = obstacles.centers[at + 1] - position[1], z = obstacles.centers[at + 2] - position[2];
    const lengthSquared = x * x + y * y + z * z;
    // No distant or opposite-loop entity can affect this short viewing corridor.
    if (lengthSquared > (distance + radius + .8) ** 2) continue;
    const length = Math.sqrt(Math.max(0, lengthSquared));
    const gap = length - radius - TRACKING_CAMERA_RADIUS;
    clearance = Math.min(clearance, gap);
    const near = Math.max(0, (.4 - gap) / (.4 + radius + TRACKING_CAMERA_RADIUS));
    proximity += near * near;
    const along = (x * dx + y * dy + z * dz) / distanceSquared;
    // A cell behind the target must not make its camera evade the selected cell.
    if (along <= 0 || along >= 1 - selectedRadius * .2 / distance) continue;
    const perpendicularSquared = Math.max(0, lengthSquared - along * along * distanceSquared);
    const viewingRadius = radius + Math.max(0, selectedRadius) * along;
    const overlap = Math.max(0, 1 - Math.sqrt(perpendicularSquared) / Math.max(1e-6, viewingRadius));
    if (overlap > 0) {
      occluders++;
      occlusion += overlap * overlap * (1.2 - .4 * along);
    }
  }
  output.occlusion = occlusion; output.proximity = proximity;
  output.clearance = Number.isFinite(clearance) ? clearance : VESSEL_MIN_RADIUS;
  output.occluders = occluders; output.score = occlusion * 4 + proximity * 7;
  return output;
}

function copyMetrics(from: TrackingViewMetrics, to: TrackingViewMetrics): void {
  to.occlusion = from.occlusion; to.proximity = from.proximity; to.clearance = from.clearance;
  to.occluders = from.occluders; to.score = from.score;
}

/**
 * Stateless desired pose: identical absolute samples/volumes produce identical output.
 * Candidate preference is stable; playback easing belongs exclusively to camera.ts.
 */
export function planTrackingCamera(selected: VascularSample, obstacles: CameraObstacles, output: TrackingPlan): TrackingPlan {
  const sx = selected.position[0] - selected.center[0], sy = selected.position[1] - selected.center[1], sz = selected.position[2] - selected.center[2];
  const selectedNormal = sx * selected.normal[0] + sy * selected.normal[1] + sz * selected.normal[2];
  const selectedBinormal = sx * selected.binormal[0] + sy * selected.binormal[1] + sz * selected.binormal[2];
  output.targetNormal = selectedNormal; output.targetBinormal = selectedBinormal;
  output.target[0] = selected.position[0]; output.target[1] = selected.position[1]; output.target[2] = selected.position[2];
  let best = Infinity;
  const scratch = output.scratch;
  for (let candidate = 0; candidate < CANDIDATES.length / 3; candidate++) {
    const at = candidate * 3, behind = CANDIDATES[at + 2];
    let normal = selectedNormal + CANDIDATES[at], binormal = selectedBinormal + CANDIDATES[at + 1];
    const radial = Math.hypot(normal, binormal);
    if (radial > SAFE_RADIUS) { normal *= SAFE_RADIUS / radial; binormal *= SAFE_RADIUS / radial; }
    vesselAt(selected.phase - behind / VESSEL_LENGTH, scratch.frame);
    for (let axis = 0; axis < 3; axis++) scratch.position[axis] = scratch.frame.center[axis]
      + scratch.frame.normal[axis] * normal + scratch.frame.binormal[axis] * binormal;
    evaluateTrackingView(scratch.position, output.target, selected.boundingRadius, obstacles, scratch.metrics);
    if (candidate === 0) copyMetrics(scratch.metrics, output.baseline);
    // A finite preference for the nominal view avoids hunting over tiny score changes.
    // Fixed ordering resolves ties without a history-dependent side switch.
    const deviation = CANDIDATES[at] + .15;
    const elevation = CANDIDATES[at + 1] - .45;
    const cost = scratch.metrics.score + (candidate === 0 ? 0 : .045)
      + .025 * (deviation * deviation + elevation * elevation + (behind - 1.4) ** 2) + candidate * .0005;
    if (cost >= best) continue;
    best = cost;
    output.phase = scratch.frame.u; output.normalOffset = normal; output.binormalOffset = binormal;
    output.ahead = behind + .25; output.candidate = candidate;
    output.position[0] = scratch.position[0]; output.position[1] = scratch.position[1]; output.position[2] = scratch.position[2];
    copyMetrics(scratch.metrics, output.adapted);
  }
  return output;
}
