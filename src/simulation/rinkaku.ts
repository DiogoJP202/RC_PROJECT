import type { KagunePhase } from '../../contracts/atlas-schema';

/** Editorial animation coordinates. These are not biological measurements. */
export type RinkakuPhase = KagunePhase;
export interface RinkakuConfig {
  appendageCount: 1 | 2 | 3 | 4;
  seed: number;
  particles: boolean;
  quality: 'standard' | 'low';
}

export const DEFAULT_RINKAKU_CONFIG: Readonly<RinkakuConfig> = Object.freeze({
  appendageCount: 4, seed: 17, particles: true, quality: 'standard',
});

/** Artistic playback duration in seconds; no canonical chronology is implied. */
export const RINKAKU_DURATION_SECONDS = 18;
export const PHASES: ReadonlyArray<Readonly<{ key: RinkakuPhase; label: string; start: number; end: number }>> = [
  { key: 'rest', label: 'Repouso', start: 0, end: 0.08 },
  { key: 'activation', label: 'Ativação', start: 0.08, end: 0.2 },
  { key: 'release', label: 'Liberação', start: 0.2, end: 0.35 },
  { key: 'growth', label: 'Crescimento', start: 0.35, end: 0.67 },
  { key: 'fixation', label: 'Fixação visual', start: 0.67, end: 0.85 },
  { key: 'active', label: 'Ativo', start: 0.85, end: 0.95 },
  { key: 'retract', label: 'Retração', start: 0.95, end: 1 },
];

/** All visual channels and t are 0..1. motionTime is an arbitrary artistic phase. */
export interface RinkakuSnapshot extends RinkakuConfig {
  t: number;
  phase: RinkakuPhase;
  localPhaseProgress: number;
  rootExposure: number;
  kakuhouActivation: number;
  appendageExtension: number;
  appendageThickness: number;
  visualStiffness: number;
  particleEmission: number;
  appendageMotion: number;
  visualIntensity: number;
  motionTime: number;
}

export function clampRinkakuT(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** Defensive boundary for configuration imported from UI or replay JSON. */
export function normalizeRinkakuConfig(value: unknown): RinkakuConfig {
  const input = value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const count = typeof input.appendageCount === 'number' && Number.isFinite(input.appendageCount)
    ? Math.max(1, Math.min(4, Math.round(input.appendageCount))) as RinkakuConfig['appendageCount']
    : DEFAULT_RINKAKU_CONFIG.appendageCount;
  const seed = typeof input.seed === 'number' && Number.isFinite(input.seed)
    ? Math.max(0, Math.min(0xffffffff, Math.trunc(input.seed))) : DEFAULT_RINKAKU_CONFIG.seed;
  return {
    appendageCount: count, seed,
    particles: typeof input.particles === 'boolean' ? input.particles : DEFAULT_RINKAKU_CONFIG.particles,
    quality: input.quality === 'low' ? 'low' : 'standard',
  };
}

// Keyframes at phase boundaries, in this order:
// root, activation, extension, thickness, visual stiffness, emission, motion, intensity.
// Smoothstep keeps every visual channel and its first derivative continuous.
const KEYFRAMES = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0.12, 0.8, 0, 0, 0, 0, 0, 0.35],
  [1, 1, 0.06, 0.22, 0, 1, 0.12, 0.65],
  [1, 0.8, 1, 1, 0.32, 0.35, 0.5, 0.9],
  [1, 0.58, 1, 1, 1, 0.12, 0.65, 0.8],
  [1, 0.58, 1, 1, 1, 0.12, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
] as const;

export function createRinkakuSnapshot(): RinkakuSnapshot {
  return {
    ...DEFAULT_RINKAKU_CONFIG, t: 0, phase: 'rest', localPhaseProgress: 0,
    rootExposure: 0, kakuhouActivation: 0, appendageExtension: 0,
    appendageThickness: 0, visualStiffness: 0, particleEmission: 0,
    appendageMotion: 0, visualIntensity: 0,
    motionTime: DEFAULT_RINKAKU_CONFIG.seed / 65536 * Math.PI * 2,
  };
}

/**
 * Allocation-free renderer path. config must already be normalized at an event
 * boundary; output belongs to the caller and is overwritten completely.
 * No previous snapshot, frame delta or wall clock influences the result.
 */
export function writeRinkakuAt(value: number, config: RinkakuConfig, output: RinkakuSnapshot): RinkakuSnapshot {
  const t = clampRinkakuT(value);
  const index = t < 0.08 ? 0 : t < 0.2 ? 1 : t < 0.35 ? 2 : t < 0.67 ? 3 : t < 0.85 ? 4 : t < 0.95 ? 5 : 6;
  const phase = PHASES[index];
  const local = clampRinkakuT((t - phase.start) / (phase.end - phase.start));
  const blend = local * local * (3 - 2 * local);
  const a = KEYFRAMES[index];
  const b = KEYFRAMES[index + 1];
  output.t = t;
  output.phase = phase.key;
  output.localPhaseProgress = local;
  output.rootExposure = a[0] + (b[0] - a[0]) * blend;
  output.kakuhouActivation = a[1] + (b[1] - a[1]) * blend;
  output.appendageExtension = a[2] + (b[2] - a[2]) * blend;
  output.appendageThickness = a[3] + (b[3] - a[3]) * blend;
  output.visualStiffness = a[4] + (b[4] - a[4]) * blend;
  output.particleEmission = config.particles ? a[5] + (b[5] - a[5]) * blend : 0;
  output.appendageMotion = a[6] + (b[6] - a[6]) * blend;
  output.visualIntensity = a[7] + (b[7] - a[7]) * blend;
  output.motionTime = t * RINKAKU_DURATION_SECONDS + (config.seed % 65536) / 65536 * Math.PI * 2;
  output.appendageCount = config.appendageCount;
  output.seed = config.seed;
  output.particles = config.particles;
  output.quality = config.quality;
  return output;
}

/** Pure convenience sampler for tests, tools and discrete UI events. */
export function sampleRinkakuAt(t: number, config?: unknown): RinkakuSnapshot {
  return writeRinkakuAt(t, normalizeRinkakuConfig(config), createRinkakuSnapshot());
}
