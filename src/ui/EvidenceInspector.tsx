import type { AtlasContent } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { Icon } from './Icon';
import { EvidenceSources } from './EvidenceSources';
import { InspectionTabs } from './InspectionTabs';

const labels: Record<string, string> = { official: 'CANÔNICO', real_anatomy: 'BASE HUMANA', inference: 'INFERÊNCIA', hypothetical_model: 'HIPÓTESE VISUAL', unknown: 'DESCONHECIDO', manga_needs_verification: 'MANGÁ · A CONFERIR' };
const systemLabels: Record<string, string> = { surface: 'Sistema tegumentar · base humana', muscular: 'Sistema muscular · base humana', skeletal: 'Sistema esquelético · base humana', vascular: 'Sistema cardiovascular · base humana', kakuhou: 'Sistema RC · anatomia ficcional', other: 'Organização corporal · esquema', rc: 'Sistema RC · anatomia ficcional' };
export function EvidenceInspector({ content, onSceneAction, inPanel = false, viewAvailable = true }: { content: AtlasContent; onSceneAction?: () => void; inPanel?: boolean; viewAvailable?: boolean }) {
  const tab = useObservatory((s) => s.inspectorTab);
  const setTab = useObservatory((s) => s.setInspectorTab);
  const selectedId = useObservatory((s) => s.selectedId);
  const open = useObservatory((s) => s.inspectorOpen);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const isolated = useObservatory((s) => s.isolated);
  const structure = content.structures.find((s) => s.id === selectedId)!;
  const allClaims = content.claims.filter((c) => structure.claimIds.includes(c.id));
  const claims = allClaims.filter((c) => !canonOnly || c.kind === 'official' || c.kind === 'real_anatomy');
  const citations = content.citations.filter((c) => claims.some((claim) => claim.citationIds.includes(c.id)));
  const revealStage = () => {
    if (inPanel) { onSceneAction?.(); return; }
    if (window.matchMedia('(max-width: 780px)').matches) document.querySelector('.stage')?.scrollIntoView({ block: 'start', behavior: useObservatory.getState().reducedMotion ? 'instant' : 'smooth' });
  };
  return <aside id="anatomy-inspector" className={`inspector ${open || inPanel ? 'is-open' : ''}`} data-testid="inspector" data-selected-id={selectedId} aria-label="Inspeção anatômica">
    {!inPanel ? <div className="panel-eyebrow"><span>02 / INSPEÇÃO</span><button className="icon-button inspector-collapse" data-testid="inspector-toggle" onClick={() => useObservatory.getState().setInspectorOpen(!open)} aria-expanded={open} aria-label={open ? 'Recolher inspeção' : 'Abrir inspeção'}><Icon name={open ? 'close' : 'expand'} /></button></div> : null}
    <div className="inspector-body">
      <div className="specimen-tag"><span className="diamond" /> ESTRUTURA SELECIONADA</div>
      <h2>{structure.label}</h2>
      <p className="system-label">{systemLabels[structure.system] ?? 'Anatomia humana · referência'}</p>
      <InspectionTabs value={tab} onChange={setTab} count={claims.length} label="Detalhes da seleção" />
      <div className="representation-notice"><span className="notice-symbol">△</span><div><strong>RECONSTRUÇÃO CONCEITUAL</strong><p>Forma provisória autoral. A geometria não representa anatomia validada.</p></div></div>
      <div id="inspection-content" role="tabpanel" tabIndex={0} aria-labelledby={tab === 'structure' ? 'structure-tab' : 'evidence-tab'}>
        {tab === 'structure' ? <>
          <dl className="anatomy-details"><div><dt>FUNÇÃO / CONTEXTO</dt><dd>{structure.function}</dd></div><div><dt>LOCALIZAÇÃO</dt><dd>{structure.location}</dd></div></dl>
          <p className="structure-description">{structure.description}</p>
          <div className="claim-preview"><span className="micro-label">ESTADO DO CONHECIMENTO</span>{claims.length ? claims.slice(0, 2).map((claim) => <div key={claim.id}><span className={`evidence-badge ${claim.kind}`}>{labels[claim.kind]}</span><p>{claim.text}</p></div>) : <p>Este filtro não tem afirmações elegíveis para a estrutura. A representação permanece conceitual.</p>}</div>
          <button className="text-button evidence-link" onClick={() => { setTab('evidence'); document.getElementById('evidence-tab')?.focus(); }}><Icon name="source" size={16} /> Consultar fontes e limites <Icon name="arrow" size={16} /></button>
        </> : <div className="evidence-content">
          {claims.length === 0 ? <p className="empty-message">Nenhuma afirmação canônica ou de anatomia humana para esta seleção. O filtro não transforma uma hipótese em fato.</p> : claims.map((claim) => <article className="evidence-card" key={claim.id}><span className={`evidence-badge ${claim.kind}`}>{labels[claim.kind]}</span><p>{claim.text}</p>{claim.disclaimer ? <p className="claim-disclaimer">{claim.disclaimer}</p> : null}{claim.verificationTodo ? <p className="claim-disclaimer">A conferir: {claim.verificationTodo}</p> : null}</article>)}
          <EvidenceSources citations={citations} />
        </div>}
      </div>
      <div className="inspection-actions"><button className="primary-button" data-testid="focus-selection" disabled={!viewAvailable} onClick={() => { useObservatory.getState().focusOn(selectedId); revealStage(); }}><Icon name="focus" size={16} /> Focar estrutura</button><button className="secondary-button" data-testid="isolate-selection" disabled={!viewAvailable} aria-pressed={isolated} onClick={() => { useObservatory.getState().toggleIsolate(); revealStage(); }}><Icon name="layers" size={16} />{isolated ? 'Restaurar contexto' : 'Isolar estrutura'}</button></div>
      <div className="node-id">REPRESENTAÇÃO / PROXY AUTORAL</div>
    </div>
  </aside>;
}
