import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { loadCatalog, type AtlasContent } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { Icon } from '../ui/Icon';
import { SystemsIndex } from '../ui/SystemsIndex';
import { EvidenceInspector } from '../ui/EvidenceInspector';
import { BODY_SHEET_QUERY, BodyToolbar, BodyToolPanel, type BodyPanel } from '../ui/BodyTools';
import { SceneFallback } from '../ui/Fallback';
import { SceneBoundary } from './SceneBoundary';
import { AssetLab } from '../ui/AssetLab';
import { MobileExplorer } from '../ui/MobileExplorer';
import { RinkakuEntry, RinkakuInspector, RinkakuTimeline } from '../ui/RinkakuControls';
import { useRinkaku } from '../state/rinkaku';
import { anatomyIds, type AnatomyId, type Mode } from './types';
import { bodySceneBridge } from '../scene/bodyContext';
import { useVascular } from '../state/vascular';
import { useAssets } from '../state/assets';
import { AtlasHeader } from '../ui/editorial/AtlasHeader';
import { atlasHref, type AtlasRoute, type NavigationKind } from './routes';

const Scene = lazy(() => import('../scene/ObservatoryScene'));
const MicroWorkspace = lazy(() => import('../ui/VascularWorkspace'));
const modeLabels: Record<Mode, string> = { body: 'Corpo', micro: 'Micro', compare: 'Comparar' };
function pauseBody() {
  const observatory = useObservatory.getState();
  if (!observatory.paused) observatory.setPaused(true);
  const rinkaku = useRinkaku.getState();
  if (rinkaku.playing) rinkaku.pause();
  const assets = useAssets.getState();
  if (assets.playing) assets.setPlaying(false);
}

interface WorkspaceProps {
  route: AtlasRoute;
  active: boolean;
  bodyVisited: boolean;
  navigationKind: NavigationKind;
  navigationRevision: number;
  navigate: (href: string) => void;
  returnFromVascular: () => void;
  returnsToRinkaku: boolean;
  onHelp: () => void;
}

export default function AtlasWorkspace({ route, active, bodyVisited, navigationKind, navigationRevision, navigate, returnFromVascular, returnsToRinkaku, onHelp }: WorkspaceProps) {
  const query = useMemo(() => new URLSearchParams(route.search), [route.search]);
  const catalogMissing = query.get('catalog') === 'missing';
  const assetMissing = query.get('asset') === 'missing';
  const webglOff = query.get('webgl') === 'off';
  const [content, setContent] = useState<AtlasContent | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [rendererError, setSceneError] = useState('');
  const [ready, setReady] = useState(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const sceneError = rendererError || (webglOff && sceneAttempt === 0 ? 'A visualização WebGL está desativada nesta sessão.' : '');
  const scenePlayable = useRef(false);
  const journey = useRef({ stage: 'body' as 'body' | 'entering' | 'vascular', bookmark: false });
  const wasActive = useRef(false);
  const parkedBody = useRef(false);
  const appliedQuery = useRef<{ selected: string | null; seed: string | null } | null>(null);
  const mode = useObservatory((s) => s.mode);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const reduced = useObservatory((s) => s.reducedMotion);
  const selectedId = useObservatory((s) => s.selectedId);
  const rinkakuEnabled = useRinkaku((s) => s.enabled);
  const [bodyPanel, setBodyPanel] = useState<{ kind: BodyPanel; revision: number; focusOnOpen: boolean } | null>(null);
  const panelOpener = useRef<HTMLElement | null>(null);
  const bodyDesign = !rinkakuEnabled && mode !== 'compare';
  const showBodyTools = bodyDesign && mode === 'body';
  const shownPanel = showBodyTools && active && bodyPanel?.revision === navigationRevision ? bodyPanel.kind : null;
  const dismissBodyPanel = useCallback(() => {
    setBodyPanel(null);
    const opener = panelOpener.current ?? document.querySelector<HTMLElement>('[data-testid="inspector-toggle"]');
    requestAnimationFrame(() => {
      if (opener?.isConnected && !opener.closest('[inert]') && !document.querySelector('dialog[open]')) opener.focus({ preventScroll: true });
    });
  }, []);
  const openBodyPanel = useCallback((kind: BodyPanel, opener: HTMLElement) => {
    if (shownPanel === kind) { dismissBodyPanel(); return; }
    panelOpener.current = opener;
    setBodyPanel({ kind, revision: navigationRevision, focusOnOpen: true });
  }, [dismissBodyPanel, navigationRevision, shownPanel]);
  const notifyBodyHit = useCallback(() => {
    if (!active || !showBodyTools || window.matchMedia(BODY_SHEET_QUERY).matches) return;
    panelOpener.current = null;
    setBodyPanel({ kind: 'inspect', revision: navigationRevision, focusOnOpen: false });
  }, [active, navigationRevision, showBodyTools]);
  const onReady = useCallback(() => { setReady(true); performance.mark('atlas-interactive'); }, []);
  const onSceneError = useCallback((message: string) => { useRinkaku.getState().pause(); setSceneError(message); setReady(false); }, []);

  const enterMicro = useCallback(() => {
    if (active) navigate(atlasHref('vascular', route.search));
  }, [active, navigate, route.search]);
  const changeMode = useCallback((next: Mode) => {
    if (next === 'micro') enterMicro();
    else if (next === 'compare') navigate(atlasHref('compare', route.search));
    else if (route.view === 'vascular') returnFromVascular();
    else navigate(atlasHref(useRinkaku.getState().enabled ? 'rinkaku' : 'body', route.search));
  }, [enterMicro, navigate, returnFromVascular, route.search, route.view]);
  const toggleRinkaku = useCallback(() => navigate(atlasHref(rinkakuEnabled ? 'body' : 'rinkaku', route.search)), [navigate, rinkakuEnabled, route.search]);

  const restoreJourney = useCallback(() => {
    if (journey.current.stage === 'body') return;
    if (useVascular.getState().playing) useVascular.getState().pause();
    if (journey.current.bookmark) bodySceneBridge.restore();
    else useObservatory.getState().setMode('body');
    journey.current = { stage: 'body', bookmark: false };
  }, []);

  useLayoutEffect(() => {
    useObservatory.getState().setPaused(true);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => useObservatory.getState().setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    if (window.matchMedia('(max-width: 780px)').matches) useObservatory.getState().setInspectorOpen(false);
    return () => preference.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    if (shownPanel !== 'scan') return;
    return () => {
      const state = useObservatory.getState();
      if (!state.paused) state.setPaused(true);
    };
  }, [shownPanel]);

  useLayoutEffect(() => {
    const previouslyVisible = wasActive.current;
    wasActive.current = active;
    if (!active) {
      if (!previouslyVisible) return;
      if (journey.current.stage === 'entering') restoreJourney();
      const flow = useVascular.getState();
      if (flow.playing) flow.pause();
      pauseBody();
      if (bodyVisited && useObservatory.getState().mode === 'body') {
        bodySceneBridge.capture();
        parkedBody.current = true;
      }
      return;
    }

    if (parkedBody.current) {
      bodySceneBridge.restore();
      parkedBody.current = false;
    }
    if (route.view !== 'vascular') restoreJourney();

    const state = useObservatory.getState();
    const selected = query.get('select');
    const seed = query.get('microSeed');
    if (seed !== appliedQuery.current?.seed && seed !== null && /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff) {
      useVascular.getState().setConfig({ seed: Number(seed) });
    }
    if (selected !== appliedQuery.current?.selected && selected && anatomyIds.includes(selected as AnatomyId)) {
      state.select(selected as AnatomyId);
    }
    appliedQuery.current = { selected, seed };

    if (route.view === 'vascular') {
      if (journey.current.stage !== 'body') return;
      journey.current = { stage: 'entering', bookmark: bodyVisited };
      const complete = () => {
        if (journey.current.stage !== 'entering') return;
        journey.current.stage = 'vascular';
        state.setMode('micro');
        if (previouslyVisible && navigationKind === 'link') requestAnimationFrame(() => {
          if (wasActive.current && journey.current.stage === 'vascular') {
            document.querySelector('[data-testid="micro-stage"]')?.scrollIntoView({ block: 'start', behavior: 'instant' });
          }
        });
      };
      if (bodyVisited && previouslyVisible && navigationKind === 'link' && state.mode === 'body') {
        bodySceneBridge.prepareEntry(complete);
      } else {
        if (bodyVisited) bodySceneBridge.capture();
        pauseBody();
        complete();
      }
      return;
    }

    if (route.view === 'compare') {
      state.setMode('compare');
      return;
    }
    if (state.mode !== 'body') state.setMode('body');
    const manifestation = useRinkaku.getState();
    const enabled = route.view === 'rinkaku';
    if (manifestation.enabled !== enabled) {
      manifestation.setEnabled(enabled);
      if (enabled && previouslyVisible && navigationKind === 'link') state.focusOn('posterior');
    }
  }, [active, bodyVisited, navigationKind, query, restoreJourney, route.view]);

  useEffect(() => {
    bodySceneBridge.requestEntry = active ? enterMicro : null;
    return () => { if (bodySceneBridge.requestEntry === enterMicro) bodySceneBridge.requestEntry = null; };
  }, [active, enterMicro]);

  useEffect(() => { scenePlayable.current = active && ready && !sceneError && mode === 'body'; }, [active, ready, sceneError, mode]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (catalogMissing && catalogAttempt === 0) {
          const response = await fetch('/catalog-unavailable.json', { signal: controller.signal });
          if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('O arquivo do catálogo não está disponível.');
        }
        const catalog = await loadCatalog(controller.signal);
        if (!controller.signal.aborted) { setContent(catalog); setCatalogError(''); }
      } catch (error) {
        if (!controller.signal.aborted) setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar o catálogo.');
      }
    }
    void load();
    return () => controller.abort();
  }, [catalogAttempt, catalogMissing]);

  useEffect(() => {
    if (!assetMissing || sceneAttempt !== 0) return;
    const controller = new AbortController();
    void fetch('/assets/models/body/missing.glb', { signal: controller.signal }).then((response) => {
      if (!response.ok || !response.headers.get('content-type')?.includes('model/')) onSceneError('O recurso 3D solicitado não foi encontrado. O conteúdo textual continua disponível.');
    }).catch(() => { if (!controller.signal.aborted) onSceneError('Falha de rede ao buscar o recurso 3D.'); });
    return () => controller.abort();
  }, [assetMissing, sceneAttempt, onSceneError]);

  useEffect(() => {
    if (!active) return;
    const shortcuts = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const dialog = document.querySelector('dialog[open]:modal') ?? document.querySelector('dialog[open]');
      if (dialog) {
        if (event.key === 'Escape' && dialog.id === 'body-tool-panel' && !dialog.matches(':modal')) {
          event.preventDefault(); dismissBodyPanel();
        }
        return;
      }
      const s = useObservatory.getState();
      if (event.key === 'Escape') {
        if (s.mode === 'micro') {
          if (useVascular.getState().cameraMode === 'tracking') useVascular.getState().setCameraMode('free');
          else returnFromVascular();
        } else if (s.mode === 'compare') changeMode('body');
        else if (journey.current.stage === 'entering') returnFromVascular();
        else s.reset();
        return;
      }
      if (target instanceof HTMLElement && (target.matches('input,textarea,select') || target.isContentEditable)) return;
      if (event.key.toLowerCase() === 'r') { if (s.mode === 'micro') useVascular.getState().resetCamera(); else s.reset(); }
      if (event.key === '1') changeMode('body');
      if (event.key === '2') changeMode('micro');
      if (event.key === '3') changeMode('compare');
      if (event.code === 'Space' && !(target instanceof HTMLElement && target.closest('button,a'))) {
        if (s.mode === 'body' && !useRinkaku.getState().enabled) return;
        event.preventDefault();
        if (!s.reducedMotion) {
          if (s.mode === 'micro') {
            const flow = useVascular.getState();
            if (flow.playing) flow.pause(); else if (flow.ready) flow.play();
            return;
          }
          const manifestation = useRinkaku.getState();
          if (manifestation.enabled) {
            if (manifestation.playing) manifestation.pause();
            else if (scenePlayable.current) {
              if (manifestation.t >= 1) { manifestation.reset(); manifestation.play(1); }
              else manifestation.play(manifestation.t <= 0 ? 1 : undefined);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [active, changeMode, dismissBodyPanel, returnFromVascular]);

  useEffect(() => {
    if (mode !== 'body' || reduced || sceneError) useRinkaku.getState().pause();
    const onVisibility = () => { if (document.hidden) useRinkaku.getState().pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, reduced, sceneError]);

  const retryScene = () => { setSceneError(''); setReady(false); setSceneAttempt((value) => value + 1); };
  const selected = content?.structures.find((s) => s.id === selectedId);
  return <main className={`observatory ${query.has('silhouette') ? 'silhouette-mode' : ''} ${rinkakuEnabled && mode !== 'micro' ? 'rinkaku-mode' : ''} ${mode === 'micro' ? 'micro-mode' : ''} ${showBodyTools ? 'body-mode-r2' : ''}`} data-testid="observatory">
    <a className="skip-link" href="#workspace">Ir para o observatório</a>
    <AtlasHeader current="atlas" atlasHref={route.view === 'compare' ? atlasHref('body', route.search) : route.href} onHelp={onHelp} atlasControls={<>
      <nav className="mode-nav" aria-label="Modos do observatório">{(['body', 'micro'] as const).map((item, i) => <button key={item} data-testid={'mode-' + item} className={mode === item ? 'active' : ''} aria-current={mode === item ? 'page' : undefined} onClick={() => changeMode(item)}><span>{(i + 1).toString().padStart(2, '0')}</span>{modeLabels[item]}</button>)}</nav>
      {content && mode === 'body' ? <RinkakuEntry onToggle={toggleRinkaku} /> : null}
    </>} />
    {!showBodyTools && <section className="specimen-bar"><div><span className="status-dot" /> AMBIENTE DE INVESTIGAÇÃO <span className="bar-divider">/</span><span className="specimen-caption">ESPÉCIME NEUTRO · RINKAKU</span></div><label className="canon-toggle"><input type="checkbox" data-testid="canon-filter" checked={canonOnly} onChange={(e) => useObservatory.getState().setCanonOnly(e.target.checked)} /><span className="toggle-track" /> Evidência verificada</label></section>}
    {catalogError ? <section className="catalog-error" data-testid="catalog-error" role="alert"><h1>Catálogo indisponível</h1><p>{catalogError}</p><button className="primary-button" data-testid="catalog-retry" onClick={() => setCatalogAttempt((value) => value + 1)}>Tentar novamente</button></section> : !content ? <section className="catalog-loading" role="status"><span className="loading-orbit" /><h1>Preparando o observatório</h1><p>Carregando catálogo e verificando evidências.</p></section> : <>
      {query.get('assets') === 'lab' ? <div hidden={mode === 'micro'} inert={mode === 'micro' ? true : undefined}><AssetLab /></div> : null}
      <div className="workspace-shell" id="workspace" tabIndex={-1}>
      {bodyVisited || mode === 'compare' ? <div className={`workspace body-workspace ${bodyDesign ? 'body-workbench' : ''}`} style={mode === 'micro' ? { visibility: 'hidden', pointerEvents: 'none', position: 'absolute', inset: 0 } : undefined} aria-hidden={mode === 'micro'} inert={mode === 'micro' ? true : undefined}>
        {bodyDesign ? <header className="body-heading"><div><span>Atlas / Corpo</span><h1>Espécime 001 <span>Anatomia ghoul</span></h1></div><p className="body-stage-status" data-testid="scene-status" role="status"><span className={ready && !sceneError ? 'status-dot' : 'status-dot amber'} />{sceneError ? 'Modo textual' : ready ? '3D conectado' : 'Carregando 3D'}</p></header> : <SystemsIndex content={content} />}
        <section className={`stage ${bodyDesign ? 'body-stage' : ''}`} data-testid="stage" aria-label="Visor anatômico tridimensional">
          {!bodyDesign && <div className="stage-header"><div><span className="micro-label">{rinkakuEnabled ? 'ESTUDO CINEMÁTICO / RINKAKU' : 'ATLAS EXPERIMENTAL / 001'}</span><h1>{rinkakuEnabled ? <>Matéria<br /><em>em movimento.</em></> : <>O que nos torna<br /><em>diferentes?</em></>}</h1></div><div className="stage-readout"><span className={ready && !sceneError ? 'status-dot' : 'status-dot amber'} /><span data-testid="scene-status" role="status">{sceneError ? 'Modo textual' : ready ? '3D conectado' : 'Carregando 3D'}</span><small>{rinkakuEnabled ? 'PROCEDURAL / G3A' : 'PROTÓTIPO G1'}</small></div></div>}
          <div className="scene-container" style={mode !== 'body' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined} aria-hidden={mode !== 'body'}>
            {sceneError ? <SceneFallback message={sceneError} onRetry={retryScene} /> : <SceneBoundary key={sceneAttempt} onError={onSceneError}><Suspense fallback={<div className="scene-loading" role="status"><span className="loading-orbit" />Carregando o renderizador 3D…</div>}>{bodyVisited ? <Scene onReady={onReady} onError={onSceneError} active={active} onAnatomyHit={notifyBodyHit} /> : null}</Suspense></SceneBoundary>}
          </div>
          {!bodyDesign && mode === 'body' ? <button className="secondary-button vascular-body-entry" data-testid="micro-entry" onClick={enterMicro}><Icon name="orbit" />Explorar transporte vascular</button> : null}
          {mode === 'compare' ? <div className="future-mode"><span className="micro-label">LEITURA COMPARADA / G6</span><Icon name="layers" size={48} /><h2>Comparação em desenvolvimento</h2><p>A comparação entre humano e ghoul ainda não está disponível.</p><span className="future-status">EM DESENVOLVIMENTO</span><button className="secondary-button" data-testid="mode-return" onClick={() => changeMode('body')}><Icon name="arrow" /> Voltar ao atlas</button></div> : null}
          {!bodyDesign && <><div className="stage-bottom"><div className="proxy-stamp"><span>△</span><div><strong>PROXY / CONCEPTUAL MODEL</strong><small>Geometria provisória · escala de cena ilustrativa</small></div></div><div className="scene-tools"><button className="icon-button" data-testid="camera-posterior" aria-label="Vista posterior" title="Vista posterior" disabled={!!sceneError || mode !== 'body'} onClick={() => useObservatory.getState().focusOn('posterior')}><Icon name="orbit" /></button><button className="icon-button" data-testid="camera-reset" aria-label="Reenquadrar corpo (R)" title="Reenquadrar corpo (R)" disabled={!!sceneError || mode !== 'body'} onClick={() => useObservatory.getState().reset()}><Icon name="reset" /></button></div></div>
          <div className="stage-caption"><span>{mode === 'body' ? selected?.label : modeLabels[mode]}</span><span>ARRASTE PARA ORBITAR <i /> ROLE PARA APROXIMAR</span></div></>}
        </section>
        {bodyDesign ? <BodyToolbar selected={selected?.label ?? 'Nenhuma estrutura'} panel={shownPanel} open={openBodyPanel} enterMicro={enterMicro} ready={ready && !sceneError} />
          : rinkakuEnabled ? <RinkakuInspector content={content} ready={ready && !sceneError && mode === 'body'} /> : <EvidenceInspector content={content} />}
        {shownPanel && <BodyToolPanel key={shownPanel} kind={shownPanel} content={content} ready={ready && !sceneError} dismiss={dismissBodyPanel}
          focusOnOpen={bodyPanel?.focusOnOpen ?? true} inspect={() => setBodyPanel({ kind: 'inspect', revision: navigationRevision, focusOnOpen: true })} />}
      </div> : null}
      {mode === 'micro' ? <Suspense fallback={<div className="scene-loading" role="status">Carregando o estudo vascular…</div>}><MicroWorkspace content={content} active={active} onReturn={returnFromVascular} returnLabel={returnsToRinkaku ? 'Voltar ao Rinkaku' : 'Voltar ao Corpo'} webglOff={webglOff} /></Suspense> : null}
      </div>
      {mode !== 'micro' && rinkakuEnabled && <RinkakuTimeline ready={ready && !sceneError && mode === 'body'} />}
      {mode !== 'micro' && !bodyDesign && <MobileExplorer content={content} />}
    </>}
    {!showBodyTools && <footer className="statusbar"><span><span className="status-dot small" /> GHOUL ATLAS <span className="footer-divider">/</span> ESTUDO FICCIONAL INDEPENDENTE</span><label><input type="checkbox" checked={reduced} onChange={(e) => useObservatory.getState().setReducedMotion(e.target.checked)} /> Movimento reduzido</label><span className="status-metrics">FONTES E RECONSTRUÇÕES IDENTIFICADAS</span></footer>}
  </main>;
}
