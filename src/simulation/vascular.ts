import { entityIndexFromId, normalizedVascularSeed, type VascularKind } from './vascularIdentity';
export { entityIndexFromId, type VascularKind } from './vascularIdentity';

/** Original didactic transport. Scene units, counts and speeds are not clinical or RC measurements. */
export type VascularCount = 100 | 500 | 2000;
export interface VascularConfig { count: VascularCount; seed: number }
export const DEFAULT_VASCULAR_CONFIG: Readonly<VascularConfig> = Object.freeze({ count: 500, seed: 17 });
export const VESSEL_RADIUS = 2.25;
export const VESSEL_LOOP_RADIUS = 8;
export const VESSEL_WALL_RELIEF = .055;
export const VESSEL_MIN_RADIUS = VESSEL_RADIUS - VESSEL_WALL_RELIEF;
export const FLOW_PERIOD_SECONDS = 38;
export const RBC_UNIT_BOUND = 1.01;
export const RC_UNIT_BOUND = 1.2;
const TAU = Math.PI * 2;
const HEIGHT = .6;
const ARC_STEPS = 2048;
const arc = new Float64Array(ARC_STEPS + 1);
let length = 0;
let previousX = VESSEL_LOOP_RADIUS, previousY = 0, previousZ = 0;
for (let i = 1; i <= ARC_STEPS; i++) {
  const theta = i / ARC_STEPS * TAU;
  const x = VESSEL_LOOP_RADIUS * Math.cos(theta), y = HEIGHT * Math.sin(theta * 2), z = VESSEL_LOOP_RADIUS * Math.sin(theta);
  length += Math.hypot(x - previousX, y - previousY, z - previousZ);
  arc[i] = length;
  previousX = x; previousY = y; previousZ = z;
}
export const VESSEL_LENGTH = length;
for (let i = 1; i <= ARC_STEPS; i++) arc[i] /= VESSEL_LENGTH;

export type VascularVector = [number, number, number];
export type VascularQuaternion = [number, number, number, number];
export interface VesselFrame {
  u: number; angle: number; radius: number;
  center: VascularVector; tangent: VascularVector; normal: VascularVector; binormal: VascularVector;
  quaternion: VascularQuaternion;
}
export interface VascularEntity {
  readonly id: string; readonly kind: VascularKind; readonly index: number; readonly seed: number;
  readonly scale: number; readonly boundingRadius: number; readonly phase: number;
  readonly laneAngle: number; readonly laneRadius: number; readonly speed: number; readonly spin: number;
}
export interface VascularSample extends VesselFrame {
  id: string; kind: VascularKind; phase: number; position: VascularVector;
  boundingRadius: number; radialDistance: number; clearance: number;
}

function fraction(value: number): number { return value - Math.floor(value); }
export function normalizeVascularConfig(value: unknown): VascularConfig {
  const input = value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return { count: input.count === 100 || input.count === 2000 || input.count === 500 ? input.count : 500,
    seed: normalizedVascularSeed(input.seed) };
}
/** Stateless integer mixing; identity and all authored parameters are independent of pool size. */
function random(index: number, seed: number, channel: number): number {
  let value = (index ^ Math.imul(seed, 0x9e3779b1) ^ Math.imul(channel + 1, 0x85ebca6b)) >>> 0;
  value = Math.imul(value ^ value >>> 16, 0x7feb352d);
  value = Math.imul(value ^ value >>> 15, 0x846ca68b);
  return ((value ^ value >>> 16) >>> 0) / 4294967296;
}
export function createEntity(index: number, seed = 17): VascularEntity {
  const ordinal = Number.isFinite(index) ? Math.max(0, Math.min(1999, Math.trunc(index))) : 0;
  const normalized = normalizedVascularSeed(seed);
  const kind: VascularKind = ordinal % 8 === 0 ? 'rc' : 'rbc';
  const scale = kind === 'rc' ? .20 + random(ordinal, normalized, 0) * .08 : .14 + random(ordinal, normalized, 0) * .08;
  return { id: `${kind}:${normalized}:${ordinal}`, kind, index: ordinal, seed: normalized,
    scale, boundingRadius: scale * (kind === 'rc' ? RC_UNIT_BOUND : RBC_UNIT_BOUND),
    phase: random(ordinal, normalized, 1), laneAngle: random(ordinal, normalized, 2) * TAU,
    laneRadius: Math.sqrt(random(ordinal, normalized, 3)) * .87,
    speed: .95 + random(ordinal, normalized, 4) * .1, spin: random(ordinal, normalized, 5) * TAU };
}
export function createParticles(config: VascularConfig): VascularEntity[] {
  return Array.from({ length: config.count }, (_, index) => createEntity(index, config.seed));
}
export function entityPresent(id: string, count: VascularCount, seed = 17): boolean {
  const index = entityIndexFromId(id, seed);
  return index !== null && index < count;
}
export function createVesselFrame(): VesselFrame {
  return { u: 0, angle: 0, radius: VESSEL_RADIUS, center: [0, 0, 0], tangent: [0, 0, 1],
    normal: [1, 0, 0], binormal: [0, 1, 0], quaternion: [0, 0, 0, 1] };
}

/** Quaternion whose columns are normal, binormal, tangent. q and -q encode the same orientation. */
function frameQuaternion(output: VesselFrame): void {
  const n = output.normal, b = output.binormal, t = output.tangent, q = output.quaternion;
  const trace = n[0] + b[1] + t[2];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    q[0] = (b[2] - t[1]) / s; q[1] = (t[0] - n[2]) / s; q[2] = (n[1] - b[0]) / s; q[3] = s / 4;
  } else if (n[0] > b[1] && n[0] > t[2]) {
    const s = Math.sqrt(1 + n[0] - b[1] - t[2]) * 2;
    q[0] = s / 4; q[1] = (b[0] + n[1]) / s; q[2] = (t[0] + n[2]) / s; q[3] = (b[2] - t[1]) / s;
  } else if (b[1] > t[2]) {
    const s = Math.sqrt(1 + b[1] - n[0] - t[2]) * 2;
    q[0] = (b[0] + n[1]) / s; q[1] = s / 4; q[2] = (t[1] + b[2]) / s; q[3] = (t[0] - n[2]) / s;
  } else {
    const s = Math.sqrt(1 + t[2] - n[0] - b[1]) * 2;
    q[0] = (t[0] + n[2]) / s; q[1] = (t[1] + b[2]) / s; q[2] = s / 4; q[3] = (n[1] - b[0]) / s;
  }
}

/** Closed, periodic frame sampled by normalized arc length. No previous frame or Frenet history. */
export function vesselAt(progress: number, output: VesselFrame): VesselFrame {
  const u = Number.isFinite(progress) ? fraction(progress) : 0;
  let lower = 0, upper = ARC_STEPS;
  while (upper - lower > 1) {
    const middle = (lower + upper) >>> 1;
    if (arc[middle] <= u) lower = middle; else upper = middle;
  }
  const blend = (u - arc[lower]) / (arc[upper] - arc[lower]);
  const theta = (lower + blend) / ARC_STEPS * TAU;
  const cosine = Math.cos(theta), sine = Math.sin(theta);
  const tx = -VESSEL_LOOP_RADIUS * sine, ty = HEIGHT * 2 * Math.cos(theta * 2), tz = VESSEL_LOOP_RADIUS * cosine;
  const inverseLength = 1 / Math.hypot(tx, ty, tz);
  output.u = u; output.angle = theta; output.radius = VESSEL_RADIUS;
  output.center[0] = VESSEL_LOOP_RADIUS * cosine; output.center[1] = HEIGHT * Math.sin(theta * 2); output.center[2] = VESSEL_LOOP_RADIUS * sine;
  output.tangent[0] = tx * inverseLength; output.tangent[1] = ty * inverseLength; output.tangent[2] = tz * inverseLength;
  output.normal[0] = cosine; output.normal[1] = 0; output.normal[2] = sine;
  output.binormal[0] = output.tangent[1] * sine;
  output.binormal[1] = output.tangent[2] * cosine - output.tangent[0] * sine;
  output.binormal[2] = -output.tangent[1] * cosine;
  frameQuaternion(output);
  return output;
}

/** Inverse arc-LUT lookup for camera projection; angle is geometric radians, not arc fraction. */
export function vesselProgressAtAngle(angle: number): number {
  const index = (Number.isFinite(angle) ? fraction(angle / TAU) : 0) * ARC_STEPS;
  const lower = Math.floor(index), blend = index - lower;
  return arc[lower] + (arc[lower + 1] - arc[lower]) * blend;
}

/** The rendered inner wall never crosses the conservative VESSEL_MIN_RADIUS. */
export function vesselWallRadius(u: number, angle: number): number {
  const theta = (Number.isFinite(u) ? fraction(u) : 0) * TAU;
  const radialAngle = Number.isFinite(angle) ? angle % TAU : 0;
  return VESSEL_RADIUS + .028 * Math.sin(theta * 7 + radialAngle * 3)
    + .017 * Math.cos(theta * 11 - radialAngle * 5) + .01 * Math.sin(theta * 3 + radialAngle * 9);
}
export function createVascularSample(): VascularSample {
  return { ...createVesselFrame(), id: '', kind: 'rbc', phase: 0, position: [0, 0, 0],
    boundingRadius: 0, radialDistance: 0, clearance: VESSEL_MIN_RADIUS };
}

/** Allocation-free absolute evaluator. Count controls population, never an existing entity's trajectory. */
export function writeVascularAt(seconds: number, entity: VascularEntity, config: VascularConfig, output: VascularSample): VascularSample {
  void config; // Representation/profile commands cannot remap this stable entity.
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const period = FLOW_PERIOD_SECONDS / entity.speed;
  const phase = fraction((time % period) / period + entity.phase);
  vesselAt(phase, output);
  const lane = entity.laneAngle + .065 * Math.sin(phase * TAU + entity.spin);
  const safeRadius = VESSEL_MIN_RADIUS - entity.boundingRadius - .12;
  const radial = safeRadius * (entity.laneRadius + .035 * Math.sin(phase * TAU * 2 + entity.spin));
  const x = Math.cos(lane) * radial, y = Math.sin(lane) * radial;
  for (let axis = 0; axis < 3; axis++) output.position[axis] = output.center[axis] + output.normal[axis] * x + output.binormal[axis] * y;
  // A bounded roll and tilt give orientation without spinning or random velocity.
  const tilt = .65 + .4 * Math.sin(phase * TAU + entity.spin);
  const roll = entity.spin + .65 * Math.sin(phase * TAU * 2 + entity.laneAngle);
  const sx = Math.sin(tilt / 2), cx = Math.cos(tilt / 2), sz = Math.sin(roll / 2), cz = Math.cos(roll / 2);
  const bx = sx * cz, by = -sx * sz, bz = cx * sz, bw = cx * cz;
  const q = output.quaternion, ax = q[0], ay = q[1], az = q[2], aw = q[3];
  q[0] = ax * bw + aw * bx + ay * bz - az * by;
  q[1] = ay * bw + aw * by + az * bx - ax * bz;
  q[2] = az * bw + aw * bz + ax * by - ay * bx;
  q[3] = aw * bw - ax * bx - ay * by - az * bz;
  output.id = entity.id; output.kind = entity.kind; output.phase = phase;
  output.boundingRadius = entity.boundingRadius; output.radialDistance = Math.abs(radial);
  output.clearance = VESSEL_MIN_RADIUS - Math.abs(radial) - entity.boundingRadius;
  return output;
}
export function sampleVascularAt(seconds: number, entity: VascularEntity, config: VascularConfig = DEFAULT_VASCULAR_CONFIG): VascularSample {
  return writeVascularAt(seconds, entity, config, createVascularSample());
}
