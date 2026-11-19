import type { Citation } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { Icon } from './Icon';

export function EvidenceSources({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return <div className="source-list"><span className="micro-label">FONTES DA SELEÇÃO</span>{citations.map((source) => <article key={source.id}>
    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<Icon name="source" size={13} /></a>
    <p>{source.locator}</p><small>{source.verifiedAt ? `Texto consultado em ${source.verifiedAt}` : 'Conferência primária pendente'}</small><p>{source.note}</p>
  </article>)}</div>;
}

export function EvidenceFilter() {
  const canonOnly = useObservatory((state) => state.canonOnly);
  return <label className="body-evidence-filter"><input type="checkbox" data-testid="canon-filter" checked={canonOnly} onChange={(event) => useObservatory.getState().setCanonOnly(event.target.checked)} />
    <span>Somente afirmações com fonte verificada<small>O filtro não altera o status do modelo.</small></span>
  </label>;
}
