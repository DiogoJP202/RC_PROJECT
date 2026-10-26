import {
  createVesselFrame, vesselAt, vesselProgressAtAngle, VESSEL_LENGTH, VESSEL_MIN_RADIUS,
  type VascularSample, type VascularVector, type VesselFrame,
} from '../../simulation/vascular';
import { createTrackingPlan, planTrackingCamera, type CameraObstacles } from './tracking';

const CAMERA_CLEARANCE = .3;
const SAFE_RADIUS = VESSEL_MIN_RADIUS - CAMERA_CLEARANCE;
const TRANSFER_SPEED = 8;
const RADIAL_SPEED = 1.2;
const RADIAL_ACCELERATION = 4;
const PHASE_ACCELERATION = 6;

export interface VascularCameraPoint { x: number; y: number; z: number }
export interface VascularCameraPose { position: VascularVector; target: VascularVector; up: VascularVector; phase: number }

function wrap(value: number): number { return value - Math.floor(value); }
function shortestArc(from: number, to: number): number { return wrap(to - from + .5) - .5; }
function finitePoint(point: VascularCameraPoint): boolean { return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z); }

/**
 * Closest point on the authored centreline, refining normalized ARC progress.
 * atan2 supplies an initial geometric angle only; it is never passed directly
 * to vesselAt as if angle fraction and arc fraction were interchangeable.
 */
export function nearestVesselFrame(point: VascularCameraPoint, output: VesselFrame): VesselFrame {
  if (!finitePoint(point)) return vesselAt(0, output);
  let phase = vesselProgressAtAngle(Math.atan2(point.z, point.x));
  // Orthogonal projection converges rapidly inside this tube (radius << bend radius).
  // Keeping all work in caller-owned storage avoids a per-frame temporary curve/frame.
  for (let iteration = 0; iteration < 14; iteration++) {
    vesselAt(phase, output);
    const correction = ((point.x - output.center[0]) * output.tangent[0]
      + (point.y - output.center[1]) * output.tangent[1]
      + (point.z - output.center[2]) * output.tangent[2]) / VESSEL_LENGTH;
    phase += correction;
    if (Math.abs(correction) < 1e-13) break;
  }
  return vesselAt(phase, output);
}

/** Clamp a free camera to the conservative inner wall, including camera clearance. */
export function constrainVascularCamera(point: VascularCameraPoint, frame: VesselFrame, clearance = CAMERA_CLEARANCE): boolean {
  nearestVesselFrame(point, frame);
  if (!finitePoint(point)) { point.x = frame.center[0]; point.y = frame.center[1]; point.z = frame.center[2]; return true; }
  const x = point.x - frame.center[0], y = point.y - frame.center[1], z = point.z - frame.center[2];
  const distance = Math.hypot(x, y, z);
  const allowed = Math.max(.1, VESSEL_MIN_RADIUS - (Number.isFinite(clearance) ? Math.max(0, clearance) : CAMERA_CLEARANCE));
  if (distance <= allowed) return false;
  const scale = allowed / distance;
  point.x = frame.center[0] + x * scale; point.y = frame.center[1] + y * scale; point.z = frame.center[2] + z * scale;
  return true;
}

/**
 * Renderer-independent, allocation-free camera transport. Only camera easing
 * has history; particle samples remain absolute and are never modified.
 * Transfers travel through the vessel by the shortest periodic arc, never by
 * a Cartesian chord across the empty centre of the illustrative circuit.
 */
export class VascularCameraRig {
  readonly pose: VascularCameraPose = { position: [0, 0, 0], target: [0, 0, 1], up: [0, 1, 0], phase: 0 };
  private readonly frame = createVesselFrame();
  private readonly targetFrame = createVesselFrame();
  readonly trackingPlan = createTrackingPlan();
  private initialized = false;
  private phase = 0;
  private normalOffset = .12;
  private binormalOffset = 1.7;
  private targetNormal = 0;
  private targetBinormal = 0;
  private ahead = 4.2;
  // Correction velocities only. The exact selected-cell drift is transported
  // separately so following a cell does not accumulate longitudinal easing lag.
  private readonly velocity = new Float64Array(6);
  readonly transport = { phaseCorrectionSpeed: 0, radialCorrectionSpeed: 0 };
  private selectedId: string | null = null;
  private selectedPhase = 0;
  private selectedNormal = 0;
  private selectedBinormal = 0;

  /** Capture an actual manual orbit before entering an automatic camera mode. */
  seed(position: VascularCameraPoint, target: VascularCameraPoint): void {
    this.resetTransport();
    nearestVesselFrame(position, this.frame);
    this.phase = this.frame.u;
    let x = position.x - this.frame.center[0], y = position.y - this.frame.center[1], z = position.z - this.frame.center[2];
    this.normalOffset = x * this.frame.normal[0] + y * this.frame.normal[1] + z * this.frame.normal[2];
    this.binormalOffset = x * this.frame.binormal[0] + y * this.frame.binormal[1] + z * this.frame.binormal[2];
    const radial = Math.hypot(this.normalOffset, this.binormalOffset);
    if (radial > SAFE_RADIUS) { this.normalOffset *= SAFE_RADIUS / radial; this.binormalOffset *= SAFE_RADIUS / radial; }
    nearestVesselFrame(target, this.targetFrame);
    this.ahead = Math.max(-6, Math.min(6, shortestArc(this.phase, this.targetFrame.u) * VESSEL_LENGTH));
    x = target.x - this.targetFrame.center[0]; y = target.y - this.targetFrame.center[1]; z = target.z - this.targetFrame.center[2];
    this.targetNormal = x * this.targetFrame.normal[0] + y * this.targetFrame.normal[1] + z * this.targetFrame.normal[2];
    this.targetBinormal = x * this.targetFrame.binormal[0] + y * this.targetFrame.binormal[1] + z * this.targetFrame.binormal[2];
    const targetRadial = Math.hypot(this.targetNormal, this.targetBinormal);
    if (targetRadial > SAFE_RADIUS) { this.targetNormal *= SAFE_RADIUS / targetRadial; this.targetBinormal *= SAFE_RADIUS / targetRadial; }
    this.initialized = true;
    this.writePose();
  }

  update(deltaSeconds: number, mode: 'flow' | 'tracking', seconds: number, selected: VascularSample | null,
    reducedMotion = false, snap = false, obstacles?: CameraObstacles): VascularCameraPose {
    if (mode === 'tracking' && !selected && this.initialized) return this.pose;
    const tracking = mode === 'tracking' && selected !== null;
    const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    let desiredPhase = wrap(tracking ? selected.phase - 1.4 / VESSEL_LENGTH : time * .012);
    let desiredNormal = .12;
    let desiredBinormal = 1.7;
    let desiredTargetNormal = 0, desiredTargetBinormal = 0;
    let desiredAhead = tracking ? 1.65 : 4.2;
    if (tracking) {
      const x = selected.position[0] - selected.center[0], y = selected.position[1] - selected.center[1], z = selected.position[2] - selected.center[2];
      desiredTargetNormal = x * selected.normal[0] + y * selected.normal[1] + z * selected.normal[2];
      desiredTargetBinormal = x * selected.binormal[0] + y * selected.binormal[1] + z * selected.binormal[2];
      desiredNormal = desiredTargetNormal - .15;
      desiredBinormal = desiredTargetBinormal + .45;
      const radial = Math.hypot(desiredNormal, desiredBinormal);
      if (radial > SAFE_RADIUS - .02) { desiredNormal *= (SAFE_RADIUS - .02) / radial; desiredBinormal *= (SAFE_RADIUS - .02) / radial; }
      if (obstacles) {
        const plan = planTrackingCamera(selected, obstacles, this.trackingPlan);
        desiredPhase = plan.phase; desiredNormal = plan.normalOffset; desiredBinormal = plan.binormalOffset;
        desiredTargetNormal = plan.targetNormal; desiredTargetBinormal = plan.targetBinormal; desiredAhead = plan.ahead;
      }
    }
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0;
    const immediate = reducedMotion || snap || !this.initialized;
    const alpha = immediate ? 1 : 1 - Math.exp(-delta * 4);
    if (tracking && obstacles && !immediate) {
      if (this.selectedId !== selected.id) this.resetTransport();
      else if (delta > 0) {
        // This is a periodic coordinate transport, never a Cartesian shortcut.
        this.phase = wrap(this.phase + shortestArc(this.selectedPhase, selected.phase));
        this.normalOffset += desiredTargetNormal - this.selectedNormal;
        this.binormalOffset += desiredTargetBinormal - this.selectedBinormal;
        this.targetNormal += desiredTargetNormal - this.selectedNormal;
        this.targetBinormal += desiredTargetBinormal - this.selectedBinormal;
      }
      this.phase = wrap(this.phase + this.advanceScalar(0, shortestArc(this.phase, desiredPhase) * VESSEL_LENGTH,
        delta, TRANSFER_SPEED, PHASE_ACCELERATION) / VESSEL_LENGTH);
      this.advanceRadial(desiredNormal, desiredBinormal, delta);
      this.targetNormal += this.advanceScalar(3, desiredTargetNormal - this.targetNormal, delta, RADIAL_SPEED, RADIAL_ACCELERATION);
      this.targetBinormal += this.advanceScalar(4, desiredTargetBinormal - this.targetBinormal, delta, RADIAL_SPEED, RADIAL_ACCELERATION);
      this.ahead += this.advanceScalar(5, desiredAhead - this.ahead, delta, RADIAL_SPEED, RADIAL_ACCELERATION);
    } else {
      this.resetTransport();
      const arc = shortestArc(this.phase, desiredPhase);
      const maximumStep = TRANSFER_SPEED * delta / VESSEL_LENGTH;
      this.phase = immediate ? desiredPhase : wrap(this.phase + Math.max(-maximumStep, Math.min(maximumStep, arc * alpha)));
      this.normalOffset = immediate ? desiredNormal : this.normalOffset + (desiredNormal - this.normalOffset) * alpha;
      this.binormalOffset = immediate ? desiredBinormal : this.binormalOffset + (desiredBinormal - this.binormalOffset) * alpha;
      this.targetNormal = immediate ? desiredTargetNormal : this.targetNormal + (desiredTargetNormal - this.targetNormal) * alpha;
      this.targetBinormal = immediate ? desiredTargetBinormal : this.targetBinormal + (desiredTargetBinormal - this.targetBinormal) * alpha;
      this.ahead = immediate ? desiredAhead : this.ahead + (desiredAhead - this.ahead) * alpha;
    }
    if (tracking && obstacles && (immediate || delta > 0)) {
      this.selectedId = selected.id; this.selectedPhase = selected.phase;
      this.selectedNormal = desiredTargetNormal; this.selectedBinormal = desiredTargetBinormal;
    }
    this.transport.phaseCorrectionSpeed = this.velocity[0];
    this.transport.radialCorrectionSpeed = Math.hypot(this.velocity[1], this.velocity[2]);
    this.initialized = true;
    return this.writePose();
  }

  private resetTransport(): void {
    this.velocity.fill(0); this.selectedId = null;
    this.transport.phaseCorrectionSpeed = 0; this.transport.radialCorrectionSpeed = 0;
  }

  /** Braking envelope starts before the target: bounded acceleration and no late, hard position snap. */
  private advanceScalar(index: number, error: number, delta: number, maximumSpeed: number, acceleration: number): number {
    const desired = Math.sign(error) * Math.min(maximumSpeed, Math.abs(error) * 4, Math.sqrt(acceleration * Math.abs(error)));
    this.velocity[index] += Math.max(-acceleration * delta, Math.min(acceleration * delta, desired - this.velocity[index]));
    return this.velocity[index] * delta;
  }

  private advanceRadial(normal: number, binormal: number, delta: number): void {
    const x = normal - this.normalOffset, y = binormal - this.binormalOffset, distance = Math.hypot(x, y);
    const speed = Math.min(RADIAL_SPEED, distance * 4, Math.sqrt(RADIAL_ACCELERATION * distance));
    const inverse = distance > 1e-12 ? speed / distance : 0;
    const vx = x * inverse - this.velocity[1], vy = y * inverse - this.velocity[2];
    const acceleration = Math.hypot(vx, vy), amount = acceleration > 0 ? Math.min(1, RADIAL_ACCELERATION * delta / acceleration) : 0;
    this.velocity[1] += vx * amount; this.velocity[2] += vy * amount;
    this.normalOffset += this.velocity[1] * delta; this.binormalOffset += this.velocity[2] * delta;
    const radial = Math.hypot(this.normalOffset, this.binormalOffset);
    if (radial > SAFE_RADIUS) {
      // An exceptional moving-lane/transfer combination still cannot cross the wall.
      this.normalOffset *= SAFE_RADIUS / radial; this.binormalOffset *= SAFE_RADIUS / radial;
      const outward = (this.velocity[1] * this.normalOffset + this.velocity[2] * this.binormalOffset) / SAFE_RADIUS ** 2;
      if (outward > 0) { this.velocity[1] -= outward * this.normalOffset; this.velocity[2] -= outward * this.binormalOffset; }
    }
  }

  private writePose(): VascularCameraPose {
    vesselAt(this.phase, this.frame);
    vesselAt(this.phase + this.ahead / VESSEL_LENGTH, this.targetFrame);
    const pose = this.pose;
    for (let axis = 0; axis < 3; axis++) {
      pose.position[axis] = this.frame.center[axis] + this.frame.normal[axis] * this.normalOffset + this.frame.binormal[axis] * this.binormalOffset;
      pose.target[axis] = this.targetFrame.center[axis] + this.targetFrame.normal[axis] * this.targetNormal + this.targetFrame.binormal[axis] * this.targetBinormal;
      pose.up[axis] = this.frame.binormal[axis];
    }
    pose.phase = this.phase;
    return pose;
  }
}
