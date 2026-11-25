import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SceneBoundary } from '../app/SceneBoundary';
import type { CellularModel } from '../simulation/cellular';
import type { InspectionViewCommand } from '../scene/inspection/InspectionScene';
import type { InspectionCut, InspectionHit } from '../scene/inspection/InspectionRendererAdapter';
import { useObservatory } from '../state/observatory';
import { BODY_SHEET_QUERY, ExplorerPanel } from './BodyTools';
import { Icon } from './Icon';
import './inspection.css';

const Scene = lazy(() => import('../scene/inspection/InspectionScene'));

type Panel = 'inspect' | 'cell-cut' | 'cell-view';
export interface InspectionReading { reference: boolean; section: boolean; selection: InspectionHit; select: (hit: InspectionHit) => void }
const motionQuery = '(prefers-reduced-motion: reduce)';
function observeMobile(update: () => void) {
  const media = window.matchMedia(BODY_SHEET_QUERY);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}
function observeMotion(update: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}
const narrow = () => window.matchMedia(BODY_SHEET_QUERY).matches;
const prefersReduction = () => window.matchMedia(motionQuery).matches;

interface Props {
  title: string; identifier: string; context: string; direct: boolean; subject: CellularModel; reference: CellularModel;
  webglOff: boolean; shortcutsEnabled: boolean; onReturn: () => void;
  cutNotice: string; comparisonNotice: string;
  representation: ReactNode;
  reading: (state: InspectionReading) => ReactNode;
  schematic: (state: { reference: boolean; showReference: boolean; section: boolean }) => ReactNode;
}

export function InspectionWorkspace({
  title, identifier, context, direct, subject, reference, webglOff, shortcutsEnabled, onReturn,
  cutNotice, comparisonNotice, representation, reading, schematic,
}: Props) {
  const mobile = useSyncExternalStore(observeMobile, narrow);
  const osReduction = useSyncExternalStore(observeMotion, prefersReduction);
  const preference = useObservatory((state) => state.reducedMotion);
  const reduced = preference || osReduction;
  const [error, setError] = useState(webglOff ? 'WebGL indisponível nesta sessão.' : '');
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [comparison, setComparison] = useState(false);
  const [selection, setSelection] = useState<InspectionHit>('surface');
  const beforeComparison = useRef<InspectionHit>('surface');
  const [section, setSection] = useState(false);
  const [axis, setAxis] = useState<InspectionCut['axis']>('z');
  const [position, setPosition] = useState(0);
  const cut = useMemo(() => section && !comparison ? { axis, position } : null, [axis, comparison, position, section]);
  const [command, setCommand] = useState<{ value: InspectionViewCommand; revision: number }>({ value: 'oblique', revision: 0 });
  const panelOpener = useRef<HTMLElement | null>(null);
  const compareTrigger = useRef<HTMLButtonElement>(null);
  const move = useCallback((value: InspectionViewCommand) => setCommand((current) => ({ value, revision: current.revision + 1 })), []);
  const fail = useCallback((message: string) => { setReady(false); setError(message); }, []);
  const markReady = useCallback(() => {
    setReady(true);
    performance.mark('atlas-cell-interactive');
  }, []);
  const retry = () => { setError(''); setReady(false); setAttempt((value) => value + 1); };
  const dismiss = useCallback(() => {
    setPanel(null);
    const opener = panelOpener.current;
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
  }, []);
  const showPanel = (next: Panel, opener: HTMLElement) => {
    if (panel === next) { dismiss(); return; }
    panelOpener.current = opener;
    setPanel(next);
  };
  const finishComparison = useCallback(() => {
    setComparison(false);
    setSelection(beforeComparison.current);
    window.requestAnimationFrame(() => compareTrigger.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (comparison) finishComparison(); else onReturn();
      } else if (shortcutsEnabled && ready && event.key.toLowerCase() === 'r'
        && !(event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable]'))) {
        event.preventDefault();
        move('oblique');
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [comparison, finishComparison, move, onReturn, ready, shortcutsEnabled]);

  const chooseSurface = () => {
    setSection(false);
    setSelection('surface');
    if (panel === 'cell-cut') dismiss();
  };
  const chooseCut = (opener: HTMLElement) => {
    setSection(true);
    setSelection('section');
    showPanel('cell-cut', opener);
  };
  const compare = () => {
    if (comparison) { finishComparison(); return; }
    beforeComparison.current = selection;
    setPanel(null);
    setSelection('surface');
    setComparison(true);
  };
  const headline = comparison ? 'Comparação morfológica' : title;
  return <main id="editorial-content" tabIndex={-1} className="workspace body-workbench cell-workbench" data-testid="cell-workspace" data-reduced-motion={reduced || undefined}>
    <header className="cell-heading">
      <div>
        <span className="cell-path">{context}</span>
        <h1>{headline}</h1>
        <p className="cell-identity">{subject.title} · <span>{identifier}</span>{direct ? ' · acesso direto' : ''}</p>
      </div>
      <button className="ga-inline-link cell-return" type="button" onClick={onReturn} data-testid="cell-return">
        <Icon name="arrow" size={16} /> Voltar à circulação
      </button>
    </header>
    <section className="cell-stage" aria-label={comparison ? 'Comparação tridimensional' : 'Visor celular tridimensional'} data-testid="cell-stage" data-selection={selection}>
      <p className="cell-disclosure"><span aria-hidden="true">△ </span>PROXY / CONCEPTUAL MODEL · Escala ilustrativa</p>
      {comparison && <div className={'cell-subjects' + (mobile ? ' cell-subjects--single' : '')}>
        {mobile
          ? <p>{selection === 'rbc' ? reference.title : subject.title}</p>
          : <><p>{subject.title} <small>Reconstrução conceitual</small></p><p>{reference.title} <small>Referência de forma humana</small></p></>}
      </div>}
      {error ? <div className="cell-fallback" data-testid="cell-fallback">
        <div>{schematic({ reference: comparison, showReference: selection === 'rbc', section: !!cut })}</div>
        <h2>Visualização 3D indisponível</h2>
        <p>{error} A ficha e o retorno à circulação continuam disponíveis.</p>
        <button className="ga-action" onClick={retry} data-testid="cell-retry">Tentar novamente</button>
      </div> : <div className="cell-scene">
        <SceneBoundary key={attempt} onError={fail}>
          <Suspense fallback={<p role="status" className="cell-stage-loading">Preparando a cena 3D…</p>}>
            <Scene subject={subject} reference={comparison ? reference : null} paired={comparison && !mobile}
              showReference={selection === 'rbc'} cut={cut} command={command} reduced={reduced}
              select={setSelection} ready={markReady} fail={fail} />
          </Suspense>
        </SceneBoundary>
      </div>}
      <p className="cell-stage-state" role="status" data-testid="cell-status">{error ? 'Modo textual' : ready ? 'Cena 3D pronta' : 'Carregando 3D'}</p>
      {cut && <p className="cell-figure-note">Corte conceitual · eixo {axis.toUpperCase()} · posição {position.toFixed(2)}</p>}
      {comparison && <p className="cell-figure-note">Comparação de forma · escala visual normalizada</p>}
    </section>
    <div className="cell-toolbar">
      <div className="body-tool-group cell-views" role="group" aria-label="Modo de visualização">
        {comparison ? <>
          <button type="button" aria-pressed={selection !== 'rbc'} onClick={() => setSelection('surface')}>{subject.title}</button>
          <button type="button" aria-pressed={selection === 'rbc'} onClick={() => setSelection('rbc')}>{reference.title}</button>
        </> : <>
          <button type="button" aria-pressed={!section} onClick={chooseSurface}>Superfície</button>
          <button type="button" aria-pressed={section} aria-expanded={panel === 'cell-cut'} aria-controls={panel === 'cell-cut' ? 'cell-panel' : undefined}
            onClick={(event) => chooseCut(event.currentTarget)}>Corte</button>
          {representation}
        </>}
        <button ref={compareTrigger} type="button" data-testid="cell-compare" onClick={compare}>{comparison ? 'Sair da comparação' : 'Comparar com hemácia'}</button>
      </div>
      <div className="body-tool-group" role="group" aria-label="Ferramentas da inspeção">
        <button type="button" disabled={!ready} aria-expanded={panel === 'cell-view'} aria-controls={panel === 'cell-view' ? 'cell-panel' : undefined}
          onClick={(event) => showPanel('cell-view', event.currentTarget)}><Icon name="orbit" size={16} /> Vista</button>
        <button type="button" className="body-sheet-trigger" aria-expanded={panel === 'inspect'} aria-controls={panel === 'inspect' ? 'cell-panel' : undefined}
          onClick={(event) => showPanel('inspect', event.currentTarget)}>Ficha <Icon name="chevron" size={15} /></button>
      </div>
    </div>
    {(comparison || section || direct) && <p className="cell-footnote">
      {comparison ? comparisonNotice : section ? cutNotice : 'Acesso direto. Ao voltar, o fluxo abrirá no início com esta célula selecionada.'}
    </p>}
    {panel && <ExplorerPanel key={panel} id="cell-panel" kind={panel} testId="cell-panel" dismiss={dismiss}
      title={panel === 'inspect' ? 'Ficha celular' : panel === 'cell-cut' ? 'Plano de corte' : 'Vista e zoom'}>
      {panel === 'inspect' ? reading({ reference: comparison, section: !!cut, selection, select: setSelection }) : null}
      {panel === 'cell-cut' && <div className="cell-panel-fields">
        <p>{cutNotice}</p>
        <div role="group" aria-label="Eixo do corte" className="body-tool-group">
          {(['x', 'y', 'z'] as const).map((item) => <button key={item} type="button" aria-pressed={axis === item}
            onClick={() => setAxis(item)}>{item.toUpperCase()}</button>)}
        </div>
        <label htmlFor="cell-cut-position">Posição do plano <output>{position.toFixed(2)}</output></label>
        <input id="cell-cut-position" data-testid="cell-cut-position" type="range" min="-1" max="1" step=".02"
          value={position} onChange={(event) => setPosition(Number(event.target.value))} />
        <button className="secondary-button" type="button" onClick={() => setPosition(0)}>Centralizar plano</button>
      </div>}
      {panel === 'cell-view' && <div className="cell-panel-fields">
        <div className="body-tool-group" role="group" aria-label="Vistas do modelo">
          <button type="button" onClick={() => move('oblique')}>Oblíqua</button>
          <button type="button" onClick={() => move('front')}>Frontal</button>
          <button type="button" onClick={() => move('side')}>Lateral</button>
        </div>
        <div className="body-tool-group" role="group" aria-label="Zoom">
          <button type="button" onClick={() => move('nearer')}>Aproximar</button>
          <button type="button" onClick={() => move('farther')}>Afastar</button>
          <button type="button" onClick={() => move('oblique')}>Reenquadrar</button>
        </div>
      </div>}
    </ExplorerPanel>}
  </main>;
}
