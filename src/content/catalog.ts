import type { Catalog, EvidenceKind as ContractEvidenceKind } from '../../contracts/atlas-schema';
import { anatomyIds, type AnatomyId, type LayerId } from '../app/types';
import proxyManifest from '../scene/proxy-manifest.json';

export type EvidenceKind = ContractEvidenceKind;
export interface Structure {
  id: AnatomyId;
  label: string;
  system: string;
  function: string;
  location: string;
  description: string;
  layer: LayerId;
  claimIds: string[];
  nodeName: string;
  modelStatus: string;
  modelDisclosure: string;
}
export interface EvidenceClaim {
  id: string;
  text: string;
  kind: EvidenceKind;
  citationIds: string[];
  disclaimer?: string;
  verificationTodo?: string;
  scope: string;
  confidence: 'high' | 'medium' | 'low';
}
export interface Citation {
  id: string;
  title: string;
  url: string;
  sourceType: 'publisher' | 'manga' | 'official_anime' | 'textbook' | 'secondary' | 'production_vfx';
  verifiedAt: string | null;
  locator: string;
  note: string;
}
export interface AtlasContent { structures: Structure[]; claims: EvidenceClaim[]; citations: Citation[] }

const evidenceKinds = ['official', 'manga_needs_verification', 'real_anatomy', 'inference', 'hypothetical_model', 'unknown'];
const systems = ['surface', 'skeletal', 'muscular', 'vascular', 'digestive', 'nervous', 'rc', 'kakuhou', 'kagune', 'sensory', 'other'];
const sourceTypes = ['publisher', 'manga', 'official_anime', 'textbook', 'secondary', 'production_vfx'];
const directSources = ['publisher', 'manga', 'official_anime'];
const layers = ['surface', 'muscular', 'skeletal', 'internal'];
type RecordValue = Record<string, unknown>;
const isRecord = (v: unknown): v is RecordValue => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const stringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const dateValid = (v: unknown): boolean => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const urlValid = (v: unknown): boolean => {
  if (!text(v)) return false;
  try { const url = new URL(v); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
};

export class CatalogValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Catálogo inválido: ${issues.join('; ')}`);
    this.name = 'CatalogValidationError';
    this.issues = issues;
  }
}

/** Checks untrusted JSON before any structure or claim enters the UI.
 * Physical file/GLB inspection is the Python build gate; this lightweight browser
 * validator cross-checks the bundled procedural manifest without loading the 3D engine.
 */
export function validateCatalog(value: unknown): AtlasContent {
  const issues: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) issues.push(message); };
  if (!isRecord(value)) throw new CatalogValidationError(['objeto JSON obrigatório']);
  check(value.schemaVersion === 2, 'schemaVersion: esperado 2; exemplo seed v1 exige migração');
  const index = (name: string): Map<string, RecordValue> => {
    const values = value[name];
    const result = new Map<string, RecordValue>();
    if (!Array.isArray(values) || values.length === 0) { issues.push(`${name}: lista não vazia obrigatória`); return result; }
    values.forEach((item: unknown, i: number) => {
      if (!isRecord(item) || !text(item.id)) { issues.push(`${name}[${i}]: id obrigatório`); return; }
      check(!result.has(item.id), `${name}: duplicate id ${item.id}`);
      result.set(item.id, item);
    });
    return result;
  };
  const sources = index('citations');
  const claims = index('claims');
  const anatomy = index('anatomy');
  const assets = index('assets');
  const cameras = index('cameraBookmarks');
  const fields = (record: RecordValue, names: string[], id: string) => names.forEach((field) => check(text(record[field]), `${id}.${field}: texto obrigatório`));
  const enumField = (record: RecordValue, field: string, values: readonly string[], id: string) => check(text(record[field]) && values.includes(record[field] as string), `${id}.${field}: enum inválido`);
  const refs = (record: RecordValue, field: string, target: Map<string, RecordValue>, id: string, required = false): string[] => {
    const ids = record[field];
    if (!stringList(ids)) { issues.push(`${id}.${field}: lista de referências obrigatória`); return []; }
    check(!required || ids.length > 0, `${id}.${field}: ao menos uma referência obrigatória`);
    ids.forEach((ref) => check(target.has(ref), `${id}.${field}: referência inexistente ${ref}`));
    return ids.filter((ref) => target.has(ref));
  };
  sources.forEach((source, id) => {
    fields(source, ['title', 'url'], id);
    check(urlValid(source.url), `${id}.url: URL HTTP(S) inválida`);
    enumField(source, 'sourceType', sourceTypes, id);
    check(source.verifiedAt === null || dateValid(source.verifiedAt), `${id}.verifiedAt: data ISO ou null obrigatória`);
  });
  claims.forEach((claim, id) => {
    fields(claim, ['text', 'scope'], id);
    enumField(claim, 'kind', evidenceKinds, id);
    enumField(claim, 'confidence', ['high', 'medium', 'low'], id);
    check(typeof claim.isLoreClaim === 'boolean', `${id}.isLoreClaim: booleano obrigatório`);
    const ids = refs(claim, 'citationIds', sources, id, ['official', 'real_anatomy'].includes(String(claim.kind)));
    refs(claim, 'relatedAnatomyIds', anatomy, id);
    if (['hypothetical_model', 'inference'].includes(String(claim.kind))) fields(claim, ['disclaimer'], id);
    if (claim.kind === 'manga_needs_verification') fields(claim, ['verificationTodo'], id);
    if (claim.kind === 'official' || claim.kind === 'real_anatomy') {
      const allowed = claim.kind === 'official' ? directSources : ['textbook'];
      const eligible = ids.map((sid) => sources.get(sid)).filter((source): source is RecordValue => !!source && allowed.includes(String(source.sourceType)));
      check(eligible.length > 0, `${id}: fonte direta elegível obrigatória; secundária não autentica evidência`);
      check(eligible.some((source) => dateValid(source.verifiedAt) && ['title', 'url', 'locator', 'note'].every((field) => text(source[field]))), `${id}: fonte direta exige verifiedAt, locator e note de conferência`);
    }
  });
  assets.forEach((asset, id) => {
    enumField(asset, 'kind', ['glb', 'texture', 'svg', 'shader', 'procedural'], id);
    enumField(asset, 'status', ['ready', 'proxy', 'missing', 'blocked_by_license'], id);
    enumField(asset, 'authorship', ['original', 'third_party_open', 'unknown'], id);
    check(stringList(asset.nodeNames) && new Set(asset.nodeNames).size === asset.nodeNames.length, `${id}.nodeNames: nomes únicos obrigatórios`);
    if (asset.status === 'ready' || asset.status === 'proxy') {
      fields(asset, ['license', 'attribution'], id);
      check(asset.authorship !== 'unknown', `${id}: origem desconhecida indisponível`);
      if (asset.authorship === 'third_party_open') check(urlValid(asset.sourceUrl), `${id}.sourceUrl: fonte de terceiro obrigatória`);
      if (asset.kind === 'procedural') {
        check(asset.sourcePath === 'src/scene/proxyGeometry.ts', `${id}.sourcePath: gerador não registrado no runtime`);
        check(asset.manifestPath === 'src/scene/proxy-manifest.json', `${id}.manifestPath: manifesto não registrado`);
        check(stringList(asset.nodeNames) && asset.nodeNames.length === proxyManifest.nodeNames.length && asset.nodeNames.every((node) => proxyManifest.nodeNames.includes(node)), `${id}: nodeNames divergem do manifesto compilado`);
      } else fields(asset, ['path'], id);
    }
  });
  anatomy.forEach((node, id) => {
    fields(node, ['label', 'function', 'description', 'locationNote', 'modelDisclosure', 'nodeName', 'assetId', 'cameraBookmarkId'], id);
    check((anatomyIds as readonly string[]).includes(id), `${id}: anatomyId não registrado no aplicativo G1`);
    enumField(node, 'system', systems, id);
    enumField(node, 'layer', layers, id);
    enumField(node, 'scale', ['body', 'system', 'organ', 'tissue', 'cell', 'microstructure'], id);
    enumField(node, 'evidenceKind', evidenceKinds, id);
    enumField(node, 'modelStatus', ['licensed_asset', 'original_asset', 'conceptual_proxy', 'not_available'], id);
    enumField(node, 'locationPrecision', ['documented_region', 'approximate', 'unknown'], id);
    enumField(node, 'visibilityDefault', ['hidden', 'solid', 'ghost', 'isolated'], id);
    check(stringList(node.specimenKinds) && node.specimenKinds.length > 0 && node.specimenKinds.every((kind) => ['human', 'ghoul', 'one_eyed', 'quinx', 'half_human'].includes(kind)), `${id}.specimenKinds: enum inválido`);
    check(stringList(node.interactions) && node.interactions.length > 0 && node.interactions.every((kind) => ['select', 'focus', 'isolate', 'explode', 'manifest', 'follow'].includes(kind)), `${id}.interactions: enum inválido`);
    refs(node, 'claimIds', claims, id, true);
    if (node.childIds !== undefined) refs(node, 'childIds', anatomy, id);
    if (node.parentId !== undefined) check(text(node.parentId) && anatomy.has(node.parentId) && node.parentId !== id, `${id}.parentId: parent órfão ou cíclico`);
    const visited = new Set([id]);
    let parent: unknown = node.parentId;
    while (text(parent) && anatomy.has(parent)) {
      if (visited.has(parent)) { issues.push(`${id}.parentId: ciclo de anatomia`); break; }
      visited.add(parent); parent = anatomy.get(parent)?.parentId;
    }
    check(text(node.cameraBookmarkId) && cameras.has(node.cameraBookmarkId), `${id}.cameraBookmarkId: câmera inexistente`);
    const asset = text(node.assetId) ? assets.get(node.assetId) : undefined;
    check(!!asset, `${id}.assetId: asset inexistente`);
    check(!!asset && ['ready', 'proxy'].includes(String(asset.status)), `${id}: asset indisponível para seleção`);
    check(!!asset && stringList(asset.nodeNames) && text(node.nodeName) && asset.nodeNames.includes(node.nodeName), `${id}.nodeName: node inexistente no asset/manifesto`);
  });
  anatomyIds.forEach((id) => check(anatomy.has(id), `${id}: estrutura essencial ausente`));
  cameras.forEach((camera, id) => {
    check(text(camera.focusAnatomyId) && anatomy.has(camera.focusAnatomyId), `${id}.focusAnatomyId: foco inexistente`);
    const ranges: [string, number, number][] = [['azimuthDeg', -360, 360], ['elevationDeg', -89, 89], ['distanceMultiplier', 0.01, 100], ['transitionMs', 0, 10000]];
    ranges.forEach(([field, min, max]) => { const n = camera[field]; check(typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max, `${id}.${field}: intervalo [${min}, ${max}] obrigatório`); });
  });
  if (issues.length) throw new CatalogValidationError(issues);
  // The cast is confined to this boundary, after structural and referential checks.
  const catalog = value as unknown as Catalog;
  return {
    structures: catalog.anatomy.map((node) => ({ id: node.id as AnatomyId, label: node.label, system: node.system, function: node.function, location: node.locationNote ?? '', description: node.description, layer: node.layer, claimIds: node.claimIds, nodeName: node.nodeName ?? '', modelStatus: node.modelStatus, modelDisclosure: node.modelDisclosure })),
    claims: catalog.claims,
    citations: catalog.citations.map((source) => ({ ...source, verifiedAt: source.verifiedAt ?? null, locator: source.locator ?? '', note: source.note ?? '' })),
  };
}

/** No inline success fallback: fetch/parse/validation failures surface to the app. */
export async function loadCatalog(signal?: AbortSignal): Promise<AtlasContent> {
  const response = await fetch(`${import.meta.env.BASE_URL}catalog.json`, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`Falha ao carregar catálogo (HTTP ${response.status}). Tente novamente.`);
  let raw: unknown;
  try { raw = await response.json(); }
  catch { throw new Error('O catálogo recebido não contém JSON válido.'); }
  return validateCatalog(raw);
}

export const evidenceLabel: Record<EvidenceKind, string> = {
  official: 'Canônico · texto oficial conferido',
  manga_needs_verification: 'Mangá · verificação pendente',
  real_anatomy: 'Anatomia humana · referência',
  inference: 'Inferência',
  hypothetical_model: 'Hipótese · reconstrução conceitual',
  unknown: 'Desconhecido nas fontes consultadas',
};
