import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { loadCatalog, type AtlasContent } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { Icon } from '../ui/Icon';
import { SystemsIndex } from '../ui/SystemsIndex';
import { EvidenceInspector } from '../ui/EvidenceInspector';
import { Timeline } from '../ui/Timeline';
import { SceneFallback } from '../ui/Fallback';
import { SceneBoundary } from './SceneBoundary';
import { AssetLab } from '../ui/AssetLab';
import { MobileExplorer } from '../ui/MobileExplorer';
import { RinkakuEntry, RinkakuInspector, RinkakuTimeline } from '../ui/RinkakuControls';
import { useRinkaku } from '../state/rinkaku';
import { anatomyIds, type Mode } from './types';
import { bodySceneBridge } from '../scene/bodyContext';
import { useVascular } from '../state/vascular';

const Scene = lazy(() => import('../scene/ObservatoryScene'));
const MicroWorkspace = lazy(() => import('../ui/VascularWorkspace'));
const modeLabels: Record<Mode, string> = { body: 'Corpo', micro: 'Micro', compare: 'Comparar' };
const query = new URLSearchParams(window.location.search);

export default function App() {
  const [content, setContent] = useState<AtlasContent | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [sceneError, setSceneError] = useState(query.get('webgl') === 'off' ? 'A visualização WebGL está desativada nesta sessão.' : '');
  const [ready, setReady] = useState(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const help = useRef<HTMLDialogElement>(null);
  const scenePlayable = useRef(false);
  const transition = useRef(false);
  const mode = useObservatory((s) => s.mode);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const reduced = useObservatory((s) => s.reducedMotion);
  const selectedId = useObservatory((s) => s.selectedId);
  const rinkakuEnabled = useRinkaku((s) => s.enabled);
  const onReady = useCallback(() => { setReady(true); performance.mark('atlas-interactive'); }, []);
  const onSceneError = useCallback((message: string) => { useRinkaku.getState().pause(); setSceneError(message); setReady(false); }, []);

  const returnToBody = useCallback(() => {
    useVascular.getState().pause();
    transition.current = false;
    bodySceneBridge.restore();
    useObservatory.getState().setMode('body');
  }, []);
  const enterMicro = useCallback(() => {
    if (useObservatory.getState().mode === 'micro' || transition.current) return;
    transition.current = true;
    bodySceneBridge.prepareEntry(() => {
      useObservatory.getState().setMode('micro'); transition.current = false;
      requestAnimationFrame(() => document.querySelector('[data-testid="micro-stage"]')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    });
  }, []);
  const changeMode = useCallback((next: Mode) => {
    if (next === 'micro') enterMicro();
    else { if (useObservatory.getState().mode === 'micro' || transition.current) returnToBody(); useObservatory.getState().setMode(next); }
  }, [enterMicro, returnToBody]);
  useEffect(() => { bodySceneBridge.requestEntry = enterMicro; return () => { bodySceneBridge.requestEntry = null; }; }, [enterMicro]);

  useEffect(() => { scenePlayable.current = ready && !sceneError && mode === 'body'; }, [ready, sceneError, mode]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (query.get('catalog') === 'missing' && catalogAttempt === 0) {
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
  }, [catalogAttempt]);

  useEffect(() => {
    if (query.get('asset') !== 'missing' || sceneAttempt !== 0) return;
    const controller = new AbortController();
    void fetch('/assets/models/body/missing.glb', { signal: controller.signal }).then((response) => {
      if (!response.ok || !response.headers.get('content-type')?.includes('model/')) onSceneError('O recurso 3D solicitado não foi encontrado. O conteúdo textual continua disponível.');
    }).catch(() => { if (!controller.signal.aborted) onSceneError('Falha de rede ao buscar o recurso 3D.'); });
    return () => controller.abort();
  }, [sceneAttempt, onSceneError]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => useObservatory.getState().setReducedMotion(preference.matches);
    update(); preference.addEventListener('change', update);
    if (window.matchMedia('(max-width: 780px)').matches) useObservatory.getState().setInspectorOpen(false);
    const requestedMode = query.get('mode');
    if (requestedMode && requestedMode in modeLabels) useObservatory.getState().setMode(requestedMode as Mode);
    const requestedId = query.get('select');
    const microSeed = query.get('microSeed');
    if (microSeed !== null && /^\d{1,10}$/.test(microSeed) && Number(microSeed) <= 0xffffffff) useVascular.getState().setConfig({ seed: Number(microSeed) });
    if (requestedId && anatomyIds.includes(requestedId as typeof anatomyIds[number])) useObservatory.getState().select(requestedId as typeof anatomyIds[number]);
    const shortcuts = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
      const s = useObservatory.getState();
      if (event.key === 'Escape') {
        if (s.mode === 'micro') {
          if (useVascular.getState().cameraMode === 'tracking') useVascular.getState().setCameraMode('free');
          else returnToBody();
        } else if (s.mode === 'compare') s.setMode('body');
        else if (transition.current) returnToBody();
        else s.reset();
        return;
      }
      if (target instanceof HTMLElement && (target.matches('input,textarea,select') || target.isContentEditable)) return;
      if (event.key.toLowerCase() === 'r') { if (s.mode === 'micro') useVascular.getState().resetCamera(); else s.reset(); }
      if (event.key === '1') changeMode('body');
      if (event.key === '2') changeMode('micro');
      if (event.key === '3') changeMode('compare');
      if (event.code === 'Space' && !(target instanceof HTMLElement && target.closest('button,a'))) {
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
          else s.setPaused(!s.paused);
        }
      }
    };
    window.addEventListener('keydown', shortcuts);
    return () => { preference.removeEventListener('change', update); window.removeEventListener('keydown', shortcuts); };
  }, [changeMode, returnToBody]);

  useEffect(() => {
    if (mode !== 'body' || reduced || sceneError) useRinkaku.getState().pause();
    const onVisibility = () => { if (document.hidden) useRinkaku.getState().pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, reduced, sceneError]);

  const retryScene = () => { setSceneError(''); setReady(false); setSceneAttempt((value) => value + 1); };
  const selected = content?.structures.find((s) => s.id === selectedId);
  return <main className={`observatory ${query.has('silhouette') ? 'silhouette-mode' : ''} ${rinkakuEnabled && mode !== 'micro' ? 'rinkaku-mode' : ''} ${mode === 'micro' ? 'micro-mode' : ''}`} data-testid="observatory">
    <a className="skip-link" href="#workspace">Ir para o observatório</a>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Ghoul Atlas início"><img src="/atlas-mark.svg" width="39" height="39" alt="" /><span>GHOUL<span className="brand-light">ATLAS</span><small>RC OBSERVATORY / DIVISÃO DE PESQUISA</small></span></a>
      <nav className="mode-nav" aria-label="Modos do observatório">{(Object.keys(modeLabels) as Mode[]).map((item, i) => <button key={item} data-testid={`mode-${item}`} className={mode === item ? 'active' : ''} aria-current={mode === item ? 'page' : undefined} onClick={() => changeMode(item)}><span>{(i + 1).toString().padStart(2, '0')}</span>{modeLabels[item]}</button>)}</nav>
      <div className="topbar-right">{content && mode === 'body' ? <RinkakuEntry /> : null}<span className="session-id">SESSÃO LOCAL<span>ESTUDO / 001</span></span><button className="icon-button" aria-label="Ajuda e atalhos" onClick={() => help.current?.showModal()}><Icon name="help" size={20} /></button></div>
    </header>
    <section className="specimen-bar"><div><span className="status-dot" /> AMBIENTE DE INVESTIGAÇÃO <span className="bar-divider">/</span><span className="specimen-caption">ESPÉCIME NEUTRO · RINKAKU</span></div><label className="canon-toggle"><input type="checkbox" data-testid="canon-filter" checked={canonOnly} onChange={(e) => useObservatory.getState().setCanonOnly(e.target.checked)} /><span className="toggle-track" /> Evidência verificada</label></section>
    {catalogError ? <section className="catalog-error" data-testid="catalog-error" role="alert"><h1>Catálogo indisponível</h1><p>{catalogError}</p><button className="primary-button" data-testid="catalog-retry" onClick={() => setCatalogAttempt((value) => value + 1)}>Tentar novamente</button></section> : !content ? <section className="catalog-loading" role="status"><span className="loading-orbit" /><h1>Preparando o observatório</h1><p>Carregando catálogo e verificando evidências.</p></section> : <>
      {query.get('assets') === 'lab' ? <div hidden={mode === 'micro'} inert={mode === 'micro' ? true : undefined}><AssetLab /></div> : null}
      <div className="workspace-shell" id="workspace" tabIndex={-1}>
      <div className="workspace body-workspace" style={mode === 'micro' ? { visibility: 'hidden', pointerEvents: 'none', position: 'absolute', inset: 0 } : undefined} aria-hidden={mode === 'micro'} inert={mode === 'micro' ? true : undefined}>
        <SystemsIndex content={content} />
        <section className="stage" data-testid="stage" aria-label="Visor anatômico tridimensional">
          <div className="stage-header"><div><span className="micro-label">{rinkakuEnabled ? 'ESTUDO CINEMÁTICO / RINKAKU' : 'ATLAS EXPERIMENTAL / 001'}</span><h1>{rinkakuEnabled ? <>Matéria<br /><em>em movimento.</em></> : <>O que nos torna<br /><em>diferentes?</em></>}</h1></div><div className="stage-readout"><span className={ready && !sceneError ? 'status-dot' : 'status-dot amber'} /><span data-testid="scene-status" role="status">{sceneError ? 'Modo textual' : ready ? '3D conectado' : 'Carregando 3D'}</span><small>{rinkakuEnabled ? 'PROCEDURAL / G3A' : 'PROTÓTIPO G1'}</small></div></div>
          <div className="scene-container" style={mode !== 'body' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined} aria-hidden={mode !== 'body'}>
            {sceneError ? <SceneFallback message={sceneError} onRetry={retryScene} /> : <SceneBoundary key={sceneAttempt} onError={onSceneError}><Suspense fallback={<div className="scene-loading" role="status"><span className="loading-orbit" />Carregando o renderizador 3D…</div>}><Scene onReady={onReady} onError={onSceneError} /></Suspense></SceneBoundary>}
          </div>
          {mode === 'body' ? <button className="secondary-button vascular-body-entry" data-testid="micro-entry" onClick={enterMicro}><Icon name="orbit" />Explorar transporte vascular</button> : null}
          {mode === 'compare' ? <div className="future-mode"><span className="micro-label">LEITURA COMPARADA / G6</span><Icon name="layers" size={48} /><h2>A mesma base. Outra leitura.</h2><p>A comparação humano / ghoul está em desenvolvimento. Alterações serão apresentadas apenas com evidência identificável.</p><span className="future-status">EM DESENVOLVIMENTO</span><button className="secondary-button" data-testid="mode-return" onClick={() => changeMode('body')}><Icon name="arrow" /> Voltar ao espécime</button></div> : null}
          <div className="stage-bottom"><div className="proxy-stamp"><span>△</span><div><strong>PROXY / CONCEPTUAL MODEL</strong><small>Geometria provisória · escala de cena ilustrativa</small></div></div><div className="scene-tools"><button className="icon-button" data-testid="camera-posterior" aria-label="Vista posterior" title="Vista posterior" disabled={!!sceneError || mode !== 'body'} onClick={() => useObservatory.getState().focusOn('posterior')}><Icon name="orbit" /></button><button className="icon-button" data-testid="camera-reset" aria-label="Reenquadrar corpo (R)" title="Reenquadrar corpo (R)" disabled={!!sceneError || mode !== 'body'} onClick={() => useObservatory.getState().reset()}><Icon name="reset" /></button></div></div>
          <div className="stage-caption"><span>{mode === 'body' ? selected?.label : modeLabels[mode]}</span><span>ARRASTE PARA ORBITAR <i /> ROLE PARA APROXIMAR</span></div>
        </section>
        {rinkakuEnabled ? <RinkakuInspector content={content} ready={ready && !sceneError && mode === 'body'} /> : <EvidenceInspector content={content} />}
      </div>
      {mode === 'micro' ? <Suspense fallback={<div className="scene-loading" role="status">Carregando o estudo vascular…</div>}><MicroWorkspace content={content} onReturn={returnToBody} webglOff={query.get('webgl') === 'off'} /></Suspense> : null}
      </div>
      {mode !== 'micro' ? rinkakuEnabled ? <RinkakuTimeline ready={ready && !sceneError && mode === 'body'} /> : <Timeline ready={ready && !sceneError && mode === 'body'} /> : null}
      {mode !== 'micro' ? <MobileExplorer content={content} /> : null}
    </>}
    <footer className="statusbar"><span><span className="status-dot small" /> GHOUL ATLAS <span className="footer-divider">/</span> ESTUDO FICCIONAL INDEPENDENTE</span><label><input type="checkbox" checked={reduced} onChange={(e) => useObservatory.getState().setReducedMotion(e.target.checked)} /> Movimento reduzido</label><span className="status-metrics">FONTES E RECONSTRUÇÕES IDENTIFICADAS</span></footer>
    <dialog ref={help} className="help-dialog" aria-labelledby="help-title"><button className="icon-button dialog-close" aria-label="Fechar ajuda" onClick={() => help.current?.close()}><Icon name="close" /></button><span className="micro-label">GUIA DO OBSERVATÓRIO</span><h2 id="help-title">Explore. Questione.<br />Confira a evidência.</h2><p>O corpo é um proxy tridimensional original. Camadas e órgãos esquemáticos ajudam a testar a navegação; não constituem um atlas anatômico validado.</p><dl><div><dt>Arrastar / rolar</dt><dd>Orbitar e aproximar</dd></div><div><dt>R / Esc</dt><dd>Reenquadrar / retornar ao corpo</dd></div><div><dt>1 / 2 / 3</dt><dd>Corpo / Micro / Comparar</dd></div><div><dt>Espaço</dt><dd>Pausar inspeção visual</dd></div><div><dt>Tab / Enter</dt><dd>Navegar e selecionar na interface</dd></div></dl><p className="claim-disclaimer">Os atalhos não atuam enquanto você usa controles de formulário. PROXY descreve a forma; CANÔNICO descreve apenas a afirmação sustentada pela fonte.</p><button className="primary-button" onClick={() => help.current?.close()}>Continuar investigação <Icon name="arrow" size={16} /></button></dialog>
  </main>;
}
