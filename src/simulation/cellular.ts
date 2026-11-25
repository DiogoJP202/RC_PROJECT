import type { CellEntityRef } from '../app/routes';

export type CellRepresentation = 'schematic' | 'interpretive';
export const CELL_MODEL_REVISION = 1;

export interface CellularModel {
  kind: 'rc' | 'rbc';
  title: string;
  revision: number;
  representation: CellRepresentation;
  asymmetry: number;
}

export interface SurfaceSample { x: number; y: number; z: number; shade: number }

export function rcCellModel(entity: CellEntityRef, representation: CellRepresentation): CellularModel {
  const hash = Math.imul(entity.seed ^ entity.index, 0x9e3779b1) >>> 0;
  return { kind: 'rc', title: 'Célula RC', revision: CELL_MODEL_REVISION, representation, asymmetry: hash / 4294967296 - .5 };
}

export const redCellModel: CellularModel = {
  kind: 'rbc', title: 'Hemácia humana', revision: CELL_MODEL_REVISION, representation: 'schematic', asymmetry: 0,
};

/** Absolute surface coordinates in local display units. No kinetic or biological model. */
export function sampleCellSurface(model: CellularModel, polar: number, azimuth: number): SurfaceSample {
  const ring = Math.sin(polar), pole = Math.cos(polar);
  const x = ring * Math.cos(azimuth), z = ring * Math.sin(azimuth);
  if (model.kind === 'rbc') {
    return { x, y: -z, z: pole * (.108 + .45 * ring ** 2), shade: ring * .56 + .22 };
  }
  const lobes = Math.cos(3 * azimuth + .8 * pole + model.asymmetry * .35);
  const fold = .91 + .25 * lobes * ring ** 1.25 + .045 * Math.cos(5 * azimuth - 3 * polar) * ring ** 2;
  // Broad uneven lobes keep the same family as the vascular proxy at close range.
  const shoulder = Math.max(0, -.57 * x + .63 * pole + .53 * z) ** 6;
  const flank = Math.max(0, .53 * x - .62 * pole + .57 * z) ** 9;
  const notch = Math.max(0, .25 * x + .40 * pole + .88 * z) ** 14;
  const ridge = Math.cos(17 * polar + 3.9 * Math.sin(2 * azimuth)
    + 1.1 * Math.cos(5 * azimuth + polar * 4) + 1.5 * Math.sin(6 * polar));
  const creases = Math.max(0, -ridge) ** 3 * ring ** 2 * (.55 + .45 * Math.cos(azimuth - .6) ** 2);
  const relief = Math.sin(12 * azimuth + 17 * polar + Math.sin(4 * azimuth)) * Math.cos(29 * polar - 3 * azimuth);
  const detail = model.representation === 'interpretive' ? -.044 * creases + .011 * relief * ring ** 3 : 0;
  const radius = fold + .16 * shoulder + .14 * flank - .102 * notch + detail;
  const shade = model.representation === 'interpretive'
    ? .51 + .20 * lobes * ring - .22 * creases + .13 * pole + .12 * shoulder
    : .62 + .15 * lobes * ring;
  return { x: x * radius + .075 * pole, y: pole * radius * .90, z: z * radius * .76, shade };
}
