/**
 * Contrato de runtime v2. O seed v1 é preservado como exemplo legado.
 * Validação executável: tools/validate_catalog.py e src/content/catalog.ts.
 * NÃO representa a verdade médica/canônica. Campos marcados como hipótese
 * devem sempre produzir rótulo público no visualizador.
 */
export type EvidenceKind =
  | 'official'
  | 'manga_needs_verification'
  | 'real_anatomy'
  | 'inference'
  | 'hypothetical_model'
  | 'unknown';

export type AnatomySystem =
  | 'surface'
  | 'skeletal'
  | 'muscular'
  | 'vascular'
  | 'digestive'
  | 'nervous'
  | 'rc'
  | 'kakuhou'
  | 'kagune'
  | 'sensory'
  | 'other';

export type SpecimenKind = 'human' | 'ghoul' | 'one_eyed' | 'quinx' | 'half_human';
export type VisualScale = 'body' | 'system' | 'organ' | 'tissue' | 'cell' | 'microstructure';
export type Visibility = 'hidden' | 'solid' | 'ghost' | 'isolated';

export interface Citation {
  id: string;
  title: string;
  url: string;
  sourceType: 'publisher' | 'manga' | 'official_anime' | 'textbook' | 'secondary' | 'production_vfx';
  locator?: string;             // cap./volume/seção, quando confirmado
  verifiedAt?: string | null;   // ISO date, após auditoria
  note?: string;
}

export interface Claim {
  id: string;
  text: string;
  kind: EvidenceKind;
  citationIds: string[];
  disclaimer?: string;
  verificationTodo?: string;
  isLoreClaim: boolean;
  relatedAnatomyIds: string[];
  confidence: 'high' | 'medium' | 'low';
  scope: string;                // proposição limitada; não autentica a representação 3D
}

export interface CameraBookmark {
  id: string;
  focusAnatomyId: string;
  // Coordenadas de layout de cena / OBJETO, NÃO localização médica absoluta.
  azimuthDeg?: number;
  elevationDeg?: number;
  distanceMultiplier?: number;
  transitionMs?: number;
}

export interface AnatomyNode {
  id: string;
  label: string;
  system: AnatomySystem;
  scale: VisualScale;
  parentId?: string;
  childIds?: string[];
  specimenKinds: SpecimenKind[];
  evidenceKind: EvidenceKind;
  claimIds: string[];
  modelStatus: 'licensed_asset' | 'original_asset' | 'conceptual_proxy' | 'not_available';
  locationNote?: string;
  locationPrecision: 'documented_region' | 'approximate' | 'unknown';
  assetId?: string;
  nodeName?: string;            // node GLB / scene graph
  cameraBookmarkId?: string;
  interactions: Array<'select' | 'focus' | 'isolate' | 'explode' | 'manifest' | 'follow'>;
  visibilityDefault: Visibility;
  function: string;
  description: string;
  layer: 'surface' | 'muscular' | 'skeletal' | 'internal';
  modelDisclosure: string;      // status da forma, independente de Claim.kind
}

export interface AssetRecord {
  id: string;
  path?: string;
  kind: 'glb' | 'texture' | 'svg' | 'shader' | 'procedural';
  status: 'ready' | 'proxy' | 'missing' | 'blocked_by_license';
  authorship: 'original' | 'third_party_open' | 'unknown';
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  nodeNames?: string[];
  note?: string;
  sourcePath?: string;          // código autoral real, obrigatório para procedural
  manifestPath?: string;        // manifesto verificável com nodeNames reais
}

/** Modelo ilustrativo, sem relação de proporcionalidade canônica. */
export interface PhysiologicalState {
  reserve: number;              // normalized 0..1, **MODEL VARIABLE**
  hunger: number;               // normalized 0..1
  activity: number;             // normalized 0..1
  integrity: number;            // normalized 0..1
  profile: SpecimenKind;
  kaguneType: 'ukaku' | 'koukaku' | 'rinkaku' | 'bikaku' | 'none';
}

export type KagunePhase =
  | 'rest' | 'activation' | 'release' | 'growth' | 'fixation' | 'active' | 'retract';

export interface KaguneFrame {
  t: number;                   // timeline [0..1], not biological time
  phase: KagunePhase;
  rootExposure: number;        // visual normalized value
  extension: number;           // visual normalized value
  stiffnessVisual: number;     // visual normalized value
  particleEmission: number;    // visual normalized value
}

export interface Catalog {
  schemaVersion: 2;
  citations: Citation[];
  claims: Claim[];
  anatomy: AnatomyNode[];
  assets: AssetRecord[];
  cameraBookmarks: CameraBookmark[];
}

export function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

export function getRequiredDisclosure(kind: EvidenceKind): string | null {
  switch (kind) {
    case 'hypothetical_model': return 'RECONSTRUÇÃO CONCEITUAL — não especificada no cânone';
    case 'inference': return 'INFERÊNCIA — interpretação a partir das fontes';
    case 'manga_needs_verification': return 'REFERÊNCIA AO MANGÁ — quadro original pendente de verificação';
    case 'unknown': return 'MECANISMO NÃO EXPLICADO NA OBRA';
    default: return null;
  }
}
