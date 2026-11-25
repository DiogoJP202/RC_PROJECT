export type VascularKind = 'rbc' | 'rc';

export interface VascularIdentity<K extends VascularKind = VascularKind> {
  id: string;
  kind: K;
  seed: number;
  index: number;
}

export function normalizedVascularSeed(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(0xffffffff, Math.trunc(value))) : 17;
}

export function parseVascularIdentity(id: string): VascularIdentity | null {
  const match = /^(rbc|rc):([0-9]{1,10}):([0-9]{1,4})$/.exec(id);
  if (!match) return null;
  const seed = Number(match[2]), index = Number(match[3]);
  if (seed > 0xffffffff || index > 1999 || String(seed) !== match[2] || String(index) !== match[3]) return null;
  const kind = index % 8 === 0 ? 'rc' : 'rbc';
  return kind === match[1] ? { id, kind, seed, index } : null;
}

export function entityIndexFromId(id: string, seed = 17): number | null {
  const identity = parseVascularIdentity(id);
  return identity && identity.seed === normalizedVascularSeed(seed) ? identity.index : null;
}
