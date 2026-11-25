import { useMemo, useState } from 'react';
import type { CellEntityRef } from '../app/routes';
import { cellularEvidence, cutDisclosure } from '../content/cellularEvidence';
import type { EvidenceKind } from '../content/catalog';
import { rcCellModel, redCellModel, type CellRepresentation } from '../simulation/cellular';
import { useObservatory } from '../state/observatory';
import { EvidenceFilter, EvidenceSources } from './EvidenceSources';
import { InspectionTabs } from './InspectionTabs';
import { InspectionWorkspace, type InspectionReading } from './InspectionWorkspace';

const labels: Record<EvidenceKind, string> = {
  official: 'Canônico · texto', real_anatomy: 'Anatomia humana', hypothetical_model: 'Modelo conceitual',
  unknown: 'Desconhecido', inference: 'Inferência', manga_needs_verification: 'A conferir no mangá',
};
const comparisonNotice = 'Formas normalizadas para comparação visual. O tamanho relativo da célula RC é desconhecido.';

function CellReading({ reference, section, selection, select, representation }: InspectionReading & { representation: CellRepresentation }) {
  const [tab, setTab] = useState<'structure' | 'evidence'>('structure');
  const verified = useObservatory((state) => state.canonOnly);
  const evidence = useMemo(() => cellularEvidence(reference, section, verified), [reference, section, verified]);
  return <div className="cell-reading">
    <InspectionTabs prefix="cell-" value={tab} onChange={setTab} label="Detalhes da inspeção celular" />
    <div id="cell-inspection-content" role="tabpanel" tabIndex={0} aria-labelledby={'cell-' + tab + '-tab'}>
      {tab === 'structure' ? <>
        <div className="body-tool-group" role="group" aria-label="Seleção para leitura">
          <button aria-pressed={selection === 'surface'} onClick={() => select('surface')}>{reference ? 'Célula RC' : 'Superfície RC'}</button>
          {section && <button aria-pressed={selection === 'section'} onClick={() => select('section')}>Contorno do corte</button>}
          {reference && <button aria-pressed={selection === 'rbc'} onClick={() => select('rbc')}>Hemácia humana</button>}
        </div>
        <p>{selection === 'rbc'
          ? 'Disco bicôncavo. A depressão central é contínua e a borda é mais espessa.'
          : selection === 'section'
            ? cutDisclosure
            : representation === 'interpretive' ? 'Silhueta lobulada com pregas e relevo autorais.' : 'Contorno lobulado com superfície simplificada para leitura da forma.'}</p>
        {reference && <p>{comparisonNotice}</p>}
        <p className="cell-model-reading">Modelo conceitual · escala ilustrativa</p>
      </> : <>
        {evidence.claims.map((claim) => <article className="evidence-card" key={claim.id}>
          <span className={'evidence-badge ' + claim.kind}>{labels[claim.kind]}</span>
          <p>{claim.text}</p>
          {claim.disclaimer && <p className="claim-disclaimer">{claim.disclaimer}</p>}
        </article>)}
        <p className="cell-model-reading">A classificação da fonte se refere à afirmação textual. A geometria é uma reconstrução conceitual.</p>
        <EvidenceSources citations={evidence.citations} />
        <EvidenceFilter />
      </>}
    </div>
  </div>;
}

function CellSchematic({ reference, showReference, section }: { reference: boolean; showReference: boolean; section: boolean }) {
  const hemacia = reference && showReference;
  return <svg viewBox="0 0 240 134" width="240" height="134" role="img"
    aria-label={hemacia ? 'Esquema de hemácia com centro côncavo' : section ? 'Contorno lobulado com indicação do plano de corte' : 'Esquema da silhueta lobulada RC'}>
    {hemacia ? <>
      <ellipse cx="120" cy="67" rx="89" ry="45" fill="#5f313c" stroke="#e47784" strokeWidth="2" />
      <ellipse cx="120" cy="67" rx="46" ry="21" fill="none" stroke="#d3aeb1" strokeWidth="2" />
    </> : <path d="M27 79C19 65 27 45 48 39c22-7 38 3 56-7 19-11 28-21 50-17 23 5 18 22 38 32 18 8 26 16 23 32-3 18-25 21-46 20-18 0-22 19-43 20-20 2-36-10-45-15C61 93 42 105 27 79Z"
      fill="#424b43" stroke="#bfcbbc" strokeWidth="2" />}
    {section && <path d="M43 77 199 54" stroke="#dab47c" strokeWidth="2" strokeDasharray="5 5" />}
  </svg>;
}

export default function CellWorkspace({ entity, hasOrigin, webglOff, shortcutsEnabled, onReturn }: {
  entity: CellEntityRef; hasOrigin: boolean; webglOff: boolean; shortcutsEnabled: boolean; onReturn: () => void;
}) {
  const [representation, setRepresentation] = useState<CellRepresentation>('interpretive');
  const model = useMemo(() => rcCellModel(entity, representation), [entity, representation]);
  return <InspectionWorkspace title="Observatório celular" identifier={entity.id} context="Atlas / Micro / Célula RC"
    direct={!hasOrigin} webglOff={webglOff} shortcutsEnabled={shortcutsEnabled} onReturn={onReturn}
    subject={model} reference={redCellModel} cutNotice={cutDisclosure} comparisonNotice={comparisonNotice}
    representation={<select aria-label="Representação" value={representation}
      onChange={(event) => setRepresentation(event.target.value === 'schematic' ? 'schematic' : 'interpretive')}>
      <option value="interpretive">Interpretativo</option>
      <option value="schematic">Esquemático</option>
    </select>}
    reading={(reading) => <CellReading {...reading} representation={representation} />}
    schematic={(state) => <CellSchematic {...state} />}
  />;
}
