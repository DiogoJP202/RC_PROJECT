import type { AssetRecord } from '../../../contracts/atlas-schema';
import type { AnatomyId } from '../../app/types';
import fixtureManifest from '../../../public/assets/fixtures/manifest.json';

export type AssetId = 'fixture.static.v1' | 'fixture.rigged.v1';
export type Point3 = readonly [number, number, number];
export interface AnatomyBinding { semanticIds: readonly string[]; anchor?: Point3 }
export interface AssetDefinition extends AssetRecord {
  id: AssetId; version: string; sha256: string; byteLength: number; maxBytes: number;
  representation: 'synthetic_fixture';
  bindings: Partial<Record<AnatomyId, AnatomyBinding>>;
  sockets: Readonly<Record<string, { semanticId: string; anatomyId: AnatomyId }>>;
  spatial: { rootSemanticId: string; metersPerUnit: 1; upAxis: 'Y'; forwardAxis: '+Z'; pivot: Point3; tolerance: number; bounds: { min: Point3; max: Point3 } };
}
const common = {
  kind: 'glb', status: 'proxy', authorship: 'original', license: 'PROJECT_ORIGINAL',
  attribution: 'Ghoul Atlas project — original synthetic test geometry; generator tools/generate_fixture_glbs.mjs',
  representation: 'synthetic_fixture', version: '1.0.0', maxBytes: 1024 * 1024,
  bindings: { 'human.head': { semanticIds: ['fixture.head'] }, 'human.thorax': { semanticIds: ['fixture.thorax'] }, 'ghoul.kakuhou.rinkaku': { semanticIds: ['fixture.kakuhou'] } },
  spatial: { rootSemanticId: 'fixture.root', metersPerUnit: 1, upAxis: 'Y', forwardAxis: '+Z', pivot: [0, 0, 0], tolerance: .015, bounds: { min: [-.185, .901, -.187], max: [.185, 1.85, .12] } },
} as const;
/** Approval is a committed, exact file + digest. Runtime URLs cannot add entries. */
export const assetRegistry: Readonly<Record<AssetId, AssetDefinition>> = {
  'fixture.static.v1': { ...common, id: 'fixture.static.v1', path: 'assets/fixtures/atlas-static-v1.glb', sha256: fixtureManifest.assets[0].sha256, byteLength: fixtureManifest.assets[0].byteLength, nodeNames: ['StaticFixtureOrigin'], sockets: { lumbar: { semanticId: 'socket.lumbar', anatomyId: 'ghoul.kakuhou.rinkaku' } } },
  'fixture.rigged.v1': { ...common, id: 'fixture.rigged.v1', path: 'assets/fixtures/atlas-rigged-v1.glb', sha256: fixtureManifest.assets[1].sha256, byteLength: fixtureManifest.assets[1].byteLength, nodeNames: ['RigFixtureOrigin'],
    spatial: { ...common.spatial, bounds: { min: [-.185, .906, -.172], max: [.185, 1.85, .12] } },
    sockets: { lumbar: { semanticId: 'socket.lumbar', anatomyId: 'ghoul.kakuhou.rinkaku' }, 'rig-tip': { semanticId: 'socket.rig-tip', anatomyId: 'ghoul.kakuhou.rinkaku' } } },
};
export const assetIds = Object.keys(assetRegistry) as AssetId[];
export function getAssetDefinition(id: string): AssetDefinition {
  if (!Object.hasOwn(assetRegistry, id)) throw new Error(`Asset não aprovado no registro: ${id}.`);
  return assetRegistry[id as AssetId];
}
