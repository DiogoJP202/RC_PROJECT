import { useLayoutEffect, useRef } from 'react';
import type { AtlasContent } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { EvidenceInspector } from './EvidenceInspector';
import { Icon } from './Icon';
import { LayerControls, StructureButtons } from './SystemsIndex';
import { Timeline } from './Timeline';
import './body-workbench.css';

export type BodyPanel = 'structures' | 'layers' | 'inspect' | 'scan';
export const BODY_SHEET_QUERY = '(max-width: 780px)';
const titles: Record<BodyPanel, string> = {
  structures: 'Estruturas anatômicas', layers: 'Camadas', inspect: 'Ficha anatômica', scan: 'Varredura visual',
};

type PanelRequest = (next: BodyPanel, opener: HTMLElement) => void;

export function BodyToolbar({ selected, panel, ready, open, enterMicro }: {
  selected: string; panel: BodyPanel | null; ready: boolean; open: PanelRequest; enterMicro: () => void;
}) {
  const reduced = useObservatory((state) => state.reducedMotion);
  return <div className="body-toolbar">
    <div className="body-tool-group" aria-label="Ferramentas do corpo" role="group">
      <button data-testid="body-structures" aria-expanded={panel === 'structures'} aria-controls={panel === 'structures' ? 'body-tool-panel' : undefined} onClick={(event) => open('structures', event.currentTarget)}><Icon name="layers" size={17} /> Estruturas</button>
      <button data-testid="body-layers" aria-expanded={panel === 'layers'} aria-controls={panel === 'layers' ? 'body-tool-panel' : undefined} onClick={(event) => open('layers', event.currentTarget)}>Camadas</button>
      <button data-testid="body-scan" disabled={!ready} aria-expanded={panel === 'scan'} aria-controls={panel === 'scan' ? 'body-tool-panel' : undefined} onClick={(event) => open('scan', event.currentTarget)}>Varredura</button>
    </div>
    <div className="body-current" role="status" data-testid="body-selection"><span>Seleção</span><strong>{selected}</strong></div>
    <div className="body-tool-group body-view-actions" aria-label="Ações da cena" role="group">
      <button data-testid="camera-posterior" aria-label="Vista posterior" title="Vista posterior" disabled={!ready} onClick={() => useObservatory.getState().focusOn('posterior')}><Icon name="orbit" /></button>
      <button data-testid="camera-reset" aria-label="Reenquadrar corpo (R)" title="Reenquadrar corpo (R)" disabled={!ready} onClick={() => useObservatory.getState().reset()}><Icon name="reset" /></button>
      <button className="body-sheet-trigger" data-testid="inspector-toggle" aria-expanded={panel === 'inspect'} aria-controls={panel === 'inspect' ? 'body-tool-panel' : undefined} onClick={(event) => open('inspect', event.currentTarget)}>Ficha <Icon name="chevron" size={15} /></button>
    </div>
    <div className="body-meta">
      <span className="body-disclosure"><span aria-hidden="true">△</span><strong>PROXY / CONCEPTUAL MODEL</strong><span> · Geometria provisória</span></span>
      <button data-testid="micro-entry" onClick={enterMicro}>Explorar transporte vascular <Icon name="arrow" size={15} /></button>
      <label><input type="checkbox" checked={reduced} onChange={(event) => useObservatory.getState().setReducedMotion(event.target.checked)} /> Movimento reduzido</label>
    </div>
  </div>;
}

export function BodyToolPanel({ kind, content, ready, dismiss, inspect, focusOnOpen }: {
  kind: BodyPanel; content: AtlasContent; ready: boolean; dismiss: () => void; inspect: () => void; focusOnOpen: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const canonOnly = useObservatory((state) => state.canonOnly);

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const query = window.matchMedia(BODY_SHEET_QUERY);
    const update = () => {
      const previous = document.activeElement;
      if (node.open) node.close();
      if (query.matches) node.showModal(); else node.show();
      if (query.matches || focusOnOpen) close.current?.focus({ preventScroll: true });
      else if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
    update();
    query.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); if (node.open) node.close(); };
  }, [focusOnOpen]);

  return <dialog ref={dialog} id="body-tool-panel" className={`body-panel body-panel--${kind}`} data-testid="body-panel"
    aria-labelledby="body-panel-title" onCancel={(event) => { event.preventDefault(); dismiss(); }}>
    <header className="body-panel-head">
      <h2 id="body-panel-title">{titles[kind]}</h2>
      <button type="button" ref={close} onClick={dismiss} aria-label="Fechar painel" data-testid="body-panel-close"><Icon name="close" /></button>
    </header>
    <div className="body-panel-content" key={kind}>
      {kind === 'structures' && <>
        <StructureButtons content={content} onSelect={(id) => {
          useObservatory.getState().select(id);
          if (window.matchMedia(BODY_SHEET_QUERY).matches) dismiss(); else inspect();
        }} />
        <button className="body-evidence-link" onClick={() => { useObservatory.getState().setInspectorTab('evidence'); inspect(); }}>Ler evidências da seleção <Icon name="arrow" size={15} /></button>
      </>}
      {kind === 'layers' && <LayerControls />}
      {kind === 'inspect' && <>
        <EvidenceInspector content={content} inPanel viewAvailable={ready} onSceneAction={() => { if (window.matchMedia(BODY_SHEET_QUERY).matches) dismiss(); }} />
        <label className="body-evidence-filter"><input type="checkbox" data-testid="canon-filter" checked={canonOnly} onChange={(event) => useObservatory.getState().setCanonOnly(event.target.checked)} /><span>Somente afirmações com fonte verificada<small>O filtro não altera o status do modelo.</small></span></label>
      </>}
      {kind === 'scan' && <Timeline ready={ready} />}
    </div>
  </dialog>;
}
