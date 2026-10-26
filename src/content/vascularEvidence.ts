import type { Claim } from '../../contracts/atlas-schema';
import { anatomyIds } from '../app/types';
import type { AtlasContent, Citation, EvidenceClaim } from './catalog';

/** Editorial supplement only: no new anatomical node, asset or biological parameter. */
export interface VascularEvidenceBundle { claims: Claim[]; citations: Citation[] }
export type VascularEvidenceTarget = 'vessel' | 'rbc' | 'rc';
export interface VascularEvidenceCards { claims: EvidenceClaim[]; citations: Citation[] }

export const VASCULAR_MODEL_DISCLOSURE = 'MODELO DIDÁTICO / PROXY · Escala, trajetórias e células RC conceituais.';
const kinds = ['official', 'manga_needs_verification', 'real_anatomy', 'inference', 'hypothetical_model', 'unknown'];
const sourceTypes = ['publisher', 'manga', 'official_anime', 'textbook', 'secondary', 'production_vfx'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(hasText);
const dateValid = (value: unknown): boolean => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validUrl = (value: unknown): boolean => {
  if (!hasText(value)) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname); }
  catch { return false; }
};

/** Same claim/source rules as the runtime catalogue, at a separate explicit boundary.
 * A supplement cannot claim to register a mesh or bypass asset/catalog validation.
 */
export function validateVascularEvidence(value: unknown): VascularEvidenceBundle {
  const issues: string[] = [];
  const check = (condition: boolean, message: string) => { if (!condition) issues.push(message); };
  if (!isRecord(value) || !Array.isArray(value.claims) || !Array.isArray(value.citations)) throw new Error('Evidência vascular inválida: claims/citations obrigatórios.');
  check(value.claims.length > 0 && value.citations.length > 0, 'listas de evidência não podem ser vazias');
  const sources = new Map<string, Record<string, unknown>>();
  const claimIds = new Set<string>();
  for (const candidate of value.citations) {
    if (!isRecord(candidate) || !hasText(candidate.id)) { issues.push('fonte: id obrigatório'); continue; }
    const source = candidate;
    const id = candidate.id;
    check(id.startsWith('src.g4a.'), `${id}: namespace src.g4a obrigatório`);
    check(!sources.has(id), `fonte duplicada: ${id}`);
    sources.set(id, source);
    check(hasText(source.title) && hasText(source.locator) && hasText(source.note), `${source.id}: título, locator e nota obrigatórios`);
    check(validUrl(source.url), `${source.id}: URL HTTPS inválida`);
    check(typeof source.sourceType === 'string' && sourceTypes.includes(source.sourceType), `${source.id}: sourceType inválido`);
    check(source.verifiedAt === null || dateValid(source.verifiedAt), `${source.id}: verifiedAt inválido`);
  }
  for (const candidate of value.claims) {
    if (!isRecord(candidate) || !hasText(candidate.id)) { issues.push('claim: id obrigatório'); continue; }
    const claim = candidate;
    const id = candidate.id;
    check(id.startsWith('claim.g4a.'), `${id}: namespace claim.g4a obrigatório`);
    check(!claimIds.has(id), `claim duplicado: ${id}`);
    claimIds.add(id);
    check(hasText(claim.text) && hasText(claim.scope), `${claim.id}: texto e escopo obrigatórios`);
    check(typeof claim.kind === 'string' && kinds.includes(claim.kind), `${claim.id}: kind inválido`);
    check(typeof claim.confidence === 'string' && ['high', 'medium', 'low'].includes(claim.confidence), `${claim.id}: confidence inválida`);
    check(typeof claim.isLoreClaim === 'boolean', `${claim.id}: isLoreClaim obrigatório`);
    check(stringList(claim.relatedAnatomyIds) && claim.relatedAnatomyIds.every((id) => (anatomyIds as readonly string[]).includes(id)), `${claim.id}: anatomia inexistente`);
    if (!stringList(claim.citationIds)) { issues.push(`${claim.id}: citationIds obrigatórios`); continue; }
    claim.citationIds.forEach((id) => check(sources.has(id), `${claim.id}: fonte inexistente ${id}`));
    if (claim.kind === 'hypothetical_model' || claim.kind === 'inference') check(hasText(claim.disclaimer), `${claim.id}: disclaimer obrigatório`);
    if (claim.kind === 'manga_needs_verification') check(hasText(claim.verificationTodo), `${claim.id}: verificação do mangá pendente obrigatória`);
    if (claim.kind === 'official' || claim.kind === 'real_anatomy') {
      const allowed = claim.kind === 'official' ? ['publisher', 'manga', 'official_anime'] : ['textbook'];
      const eligible = claim.citationIds.map((id) => sources.get(id)).filter((source) => source && allowed.includes(String(source.sourceType)));
      check(eligible.length > 0, `${claim.id}: fonte direta elegível obrigatória`);
      check(eligible.some((source) => source && dateValid(source.verifiedAt) && hasText(source.locator) && hasText(source.note)), `${claim.id}: fonte direta conferida obrigatória`);
    }
  }
  if (issues.length) throw new Error(`Evidência vascular inválida: ${issues.join('; ')}`);
  // Cast only after the structural/referential boundary; clones protect source
  // records and nested arrays from changes in inspector consumers.
  return structuredClone(value) as unknown as VascularEvidenceBundle;
}

const supplemental = validateVascularEvidence({
  citations: [
    {
      id: 'src.g4a.openstax.erythrocytes', title: 'OpenStax — Anatomy and Physiology 2e, 18.3 Erythrocytes',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/18-3-erythrocytes', sourceType: 'textbook', verifiedAt: '2026-10-25',
      locator: 'Abertura; Shape and Structure of Erythrocytes, parágrafo de discos bicôncavos e legenda Figure 18.6.',
      note: 'Conferência textual direta em 25/10/2026: formato e função gerais de hemácias humanas. Sem copiar figuras, fotografias ou malhas. Não valida escala, cor, deformação física ou transporte RC da microcena.',
    },
    {
      id: 'src.g4a.openstax.vessels', title: 'OpenStax — Anatomy and Physiology 2e, 20.1 Structure and Function of Blood Vessels',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels', sourceType: 'textbook', verifiedAt: '2026-10-25',
      locator: 'Shared Structures, parágrafo sobre lumen; Tunica Intima, primeiro parágrafo sobre endothelium.',
      note: 'Conferência textual direta em 25/10/2026, limitada ao lúmen e revestimento interno. Não identifica o proxy como artéria, veia ou capilar específico; não autentica rugosidade, medidas, malha ou dinâmica ficcional.',
    },
    {
      id: 'src.g4a.youngjump.rc', title: 'Young Jump — Tokyo Ghoul, 資料集 / 喰種',
      url: 'https://youngjump.jp/tokyoghoul/tg/data/', sourceType: 'publisher', verifiedAt: '2026-10-25',
      locator: 'Seção 喰種（グール）, parágrafo que menciona Rc細胞 e 赫包.',
      note: 'Texto oficial reconferido diretamente em 25/10/2026: menciona acúmulo de células RC no kakuhou. Não foram lidos painéis nesta consulta; esse parágrafo não comprova histologia, tamanho ou trajetórias vasculares RC.',
    },
  ],
  claims: [
    {
      id: 'claim.g4a.rbc.shape', text: 'Hemácias humanas têm formato de disco bicôncavo e participam do transporte de oxigênio.',
      kind: 'real_anatomy', citationIds: ['src.g4a.openstax.erythrocytes'], isLoreClaim: false, relatedAnatomyIds: [], confidence: 'high',
      scope: 'Referência anatômica humana; não certifica a malha procedural, proporções ou dinâmica desta cena.',
    },
    {
      id: 'claim.g4a.vessel.lumen', text: 'O sangue percorre o lúmen dos vasos; seu revestimento interno inclui endotélio.',
      kind: 'real_anatomy', citationIds: ['src.g4a.openstax.vessels'], isLoreClaim: false, relatedAnatomyIds: [], confidence: 'high',
      scope: 'Estrutura humana geral. O vaso didático não representa um segmento anatômico identificado nem medidas clínicas.',
    },
    {
      id: 'claim.g4a.rc.context', text: 'O guia oficial de Tokyo Ghoul menciona células RC acumuladas no kakuhou.',
      kind: 'official', citationIds: ['src.g4a.youngjump.rc'], isLoreClaim: true, relatedAnatomyIds: ['ghoul.kakuhou.rinkaku'], confidence: 'high',
      scope: 'Somente a menção textual e o acúmulo. Não autentica a forma, brilho, escala ou circulação desenhados nesta microcena.',
    },
    {
      id: 'claim.g4a.transport.model', text: 'Trajetórias, velocidades, escalas relativas e quantidades são escolhas desta simulação visual.',
      kind: 'hypothetical_model', citationIds: [], isLoreClaim: false, relatedAnatomyIds: [], confidence: 'high',
      disclaimer: 'MODELO DIDÁTICO: não são concentração fisiológica, fluxo clínico, hemodinâmica validada ou fórmula quantitativa RC.',
      scope: 'Transporte cinematográfico por curvas, sem CFD, metabolismo ou acoplamento quantitativo ao Rinkaku.',
    },
    {
      id: 'claim.g4a.rc.visual', text: 'A silhueta e o destaque das células RC são recursos didáticos originais.',
      kind: 'hypothetical_model', citationIds: [], isLoreClaim: true, relatedAnatomyIds: [], confidence: 'high',
      disclaimer: 'RECONSTRUÇÃO CONCEITUAL: não é uma imagem oficial, histologia comprovada ou fluorescência biológica real.',
      scope: 'Nenhuma organela ou dimensão micrométrica RC é estabelecida pela geometria ou pelo material.',
    },
    {
      id: 'claim.g4a.rc.unknown', text: 'Histologia completa, escala exata e dinâmica vascular RC não foram demonstradas nas fontes oficiais consultadas.',
      kind: 'unknown', citationIds: ['src.g4a.youngjump.rc'], isLoreClaim: true, relatedAnatomyIds: [], confidence: 'high',
      scope: 'Limite desta consulta ao guia textual; não é uma afirmação sobre inexistência desses detalhes em toda a obra.',
    },
  ],
});

const cards: Record<VascularEvidenceTarget, readonly string[]> = {
  vessel: ['claim.g4a.vessel.lumen', 'claim.g4a.transport.model'],
  rbc: ['claim.g4a.rbc.shape', 'claim.g4a.transport.model'],
  rc: ['claim.g4a.rc.context', 'claim.g4a.rc.visual', 'claim.g4a.transport.model', 'claim.g4a.rc.unknown'],
};

/** Return existing evidence types for the inspector; never mutate/shadow base content. */
export function evidenceFor(kind: VascularEvidenceTarget, content: AtlasContent): VascularEvidenceCards {
  const selected = cards[kind];
  if (!selected) throw new Error('Alvo de evidência vascular inválido.');
  if (content.claims.some((claim) => supplemental.claims.some((extra) => extra.id === claim.id))
    || content.citations.some((source) => supplemental.citations.some((extra) => extra.id === source.id))) {
    throw new Error('Namespace vascular conflita com o catálogo; revisar a migração editorial explicitamente.');
  }
  const claims = supplemental.claims.filter((claim) => selected.includes(claim.id));
  const usedSources = new Set(claims.flatMap((claim) => claim.citationIds));
  return structuredClone({ claims, citations: supplemental.citations.filter((source) => usedSources.has(source.id)) });
}

/** Copies for audit/tests; consumers cannot mutate the validated module records. */
export function inspectVascularEvidence(): VascularEvidenceBundle { return structuredClone(supplemental); }
