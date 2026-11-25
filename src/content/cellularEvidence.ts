import type { Claim } from '../../contracts/atlas-schema';
import type { EvidenceClaim } from './catalog';
import { inspectVascularEvidence } from './vascularEvidence';

const vascular = inspectVascularEvidence();
export const cutDisclosure = 'Corte conceitual do modelo. A estrutura interna da célula RC não foi estabelecida nas fontes consultadas.';

const presentation: Claim[] = [
  {
    id: 'claim.g4b.cut', kind: 'hypothetical_model', isLoreClaim: false, citationIds: [], relatedAnatomyIds: [], confidence: 'high',
    text: 'O plano mostra a interseção com a geometria do projeto.',
    disclaimer: cutDisclosure, scope: 'A borda pertence à malha autoral.',
  },
  {
    id: 'claim.g4b.compare', kind: 'hypothetical_model', isLoreClaim: false, citationIds: [], relatedAnatomyIds: [], confidence: 'high',
    text: 'Os dois modelos usam o mesmo envelope visual máximo.',
    disclaimer: 'Comparação de forma em escala visual normalizada. O tamanho relativo da célula RC é desconhecido.',
    scope: 'Normalização exclusiva da visualização comparativa.',
  },
];

export function cellularEvidence(reference: boolean, cut: boolean, verifiedOnly: boolean) {
  const ids = reference ? ['claim.g4a.rc.context', 'claim.g4a.rc.visual', 'claim.g4a.rc.unknown', 'claim.g4a.rbc.shape']
    : ['claim.g4a.rc.context', 'claim.g4a.rc.visual', 'claim.g4a.rc.unknown'];
  const claims = vascular.claims.filter((claim) => ids.includes(claim.id)) as EvidenceClaim[];
  if (cut) claims.push(presentation[0]);
  if (reference) claims.push(presentation[1]);
  const applied = verifiedOnly ? claims.filter(({ kind }) => kind === 'official' || kind === 'real_anatomy') : claims;
  return {
    claims: applied,
    citations: vascular.citations.filter(({ id }) => applied.some(({ citationIds }) => citationIds.includes(id))),
  };
}
