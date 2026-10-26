import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { AtlasContent } from '../content/catalog';
import { evidenceFor } from '../content/vascularEvidence';
import { createEntity, createParticles, entityIndexFromId } from '../simulation/vascular';
import { useVascular, vascularClock } from '../state/vascular';
import { useObservatory } from '../state/observatory';
import { SceneBoundary } from '../app/SceneBoundary';
import { Icon } from './Icon';
import './vascular.css';

const Scene = lazy(() => import('../scene/vascular/VascularScene'));

export default function VascularWorkspace({ content, onReturn, webglOff = false }: { content: AtlasContent; onReturn: () => void; webglOff?: boolean }) {
  const state = useVascular();
  const reduced = useObservatory((s) => s.reducedMotion);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const [seconds, setSeconds] = useState(vascularClock.seconds);
  // Paused commands publish immediately; the 4Hz display sample is only for
  // automatic playback. A keyboard step must never read an older range value.
  const shownSeconds = state.playing ? seconds : state.seconds;
  const [error, setError] = useState(webglOff ? 'WebGL indisponível nesta sessão. A inspeção textual permanece disponível.' : '');
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<'structure' | 'evidence'>('structure');
  const [kind, setKind] = useState<'vessel' | 'rbc' | 'rc'>('vessel');
  const entities = useMemo(() => createParticles(state.config), [state.config]);
  const selected = entities.find((entity) => entity.id === state.selectedId);
  const selectedIndex = state.selectedId ? entityIndexFromId(state.selectedId, state.config.seed) : null;
  const selectedMetadata = selected ?? (selectedIndex === null ? null : createEntity(selectedIndex, state.config.seed));
  const selectedKind = selectedMetadata?.kind ?? kind;
  const evidence = evidenceFor(selectedKind, content);
  const claims = evidence.claims.filter((claim) => !canonOnly || claim.kind === 'official' || claim.kind === 'real_anatomy');
  const citations = evidence.citations.filter((citation) => claims.some((claim) => claim.citationIds.includes(citation.id)));
  const ready = useCallback(() => { useVascular.getState().setReady(true); performance.mark('atlas-micro-interactive'); }, []);
  const fail = useCallback((message: string) => { useVascular.getState().pause(); useVascular.getState().setReady(false); setError(message); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(vascularClock.seconds), 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (reduced) useVascular.getState().pause();
    const visibility = () => { if (document.hidden) useVascular.getState().pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [reduced]);
  const selectKind = (next: 'vessel' | 'rbc' | 'rc') => { setKind(next); useVascular.getState().select(null); };
  const labels = { official: 'CANÔNICO · TEXTO', real_anatomy: 'BASE HUMANA', hypothetical_model: 'HIPÓTESE VISUAL', unknown: 'DESCONHECIDO', inference: 'INFERÊNCIA', manga_needs_verification: 'A CONFERIR' };
  return <div className="micro-workspace" data-testid="micro-workspace">
    <div className="workspace">
      <aside className="micro-controls" aria-label="Controles do transporte vascular">
        <span className="micro-label">01 / TRANSPORTE VASCULAR</span><h2>Uma corrente.<br /><em>Muitas histórias.</em></h2>
        <p className="micro-intro">Interior de vaso · região de estudo aproximada no tórax. Transição entre cenas; escala ilustrativa.</p>
        <div className="micro-key"><span className="rbc-key" />Hemácia <span className="rc-key" />RC conceitual</div>
        <label className="micro-field">Objetos renderizados<select data-testid="micro-profile" value={state.config.count} onChange={(e) => state.setConfig({ count: Number(e.target.value) as 100 | 500 | 2000 })}><option value="100">100 · inspeção</option><option value="500">500 · corrente</option><option value="2000">2.000 · carga</option></select></label>
        <label className="micro-check"><input data-testid="micro-highlight" type="checkbox" checked={state.highlightRC} onChange={(e) => state.setHighlightRC(e.target.checked)} />Destacar células RC</label><small className="micro-note">Realce didático; não representa fluorescência biológica.</small>
        <label className="micro-field">Selecionar entidade<select data-testid="micro-entity" value={state.selectedId ?? ''} onChange={(e) => state.select(e.target.value || null)}><option value="">Escolha uma célula</option>{state.selectedId && (!selected || selected.kind === 'rbc' && selected.index >= 8) ? <option value={state.selectedId}>{state.selectedId}{!selected ? ' · ausente' : ' · selecionada no visor'}</option> : null}{entities.filter((entity) => entity.kind === 'rc' || entity.index < 8).map((entity) => <option key={entity.id} value={entity.id}>{entity.kind === 'rc' ? 'RC' : 'Hemácia'} · {entity.id}</option>)}</select></label>
        <div className="micro-camera-modes" role="group" aria-label="Modo de câmera">
          <button data-testid="micro-camera-free" aria-pressed={state.cameraMode === 'free'} onClick={() => state.setCameraMode('free')}>Livre</button>
          <button data-testid="micro-camera-flow" disabled={reduced || !state.ready} aria-pressed={state.cameraMode === 'flow'} onClick={() => state.setCameraMode('flow')}>Fluxo</button>
          <button data-testid="micro-follow" disabled={!selected || !state.ready} aria-pressed={state.cameraMode === 'tracking'} onClick={() => state.setCameraMode(state.cameraMode === 'tracking' ? 'free' : 'tracking')}>{state.cameraMode === 'tracking' ? 'Soltar célula' : 'Seguir célula'}</button>
        </div>
        <button data-testid="micro-camera-reset" className="text-button" onClick={() => state.resetCamera()} disabled={!state.ready}><Icon name="reset" />Reenquadrar microcena</button>
        <button data-testid="micro-return" className="secondary-button" onClick={onReturn}><Icon name="arrow" />Voltar ao corpo</button>
        <p className="micro-note">Esc: sair de tracking; depois voltar ao corpo. R: reenquadrar a cena atual.</p>
      </aside>
      <section className="stage micro-stage" data-testid="micro-stage" aria-label="Interior vascular tridimensional">
        <div className="stage-header"><div><span className="micro-label">MICRO / CIRCUITO DIDÁTICO</span><h1>Por dentro <em>da corrente.</em></h1></div><div className="stage-readout"><span className={`status-dot ${error ? 'amber' : ''}`} /><span role="status" data-testid="micro-status">{error ? 'Modo textual' : state.ready ? '3D conectado' : 'Carregando 3D'}</span><small>PROCEDURAL / G4A.1</small></div></div>
        <div className="scene-container">
          {error ? <div className="micro-fallback" role="alert"><Icon name="orbit" size={48} /><h2>O estudo continua.</h2><p>{error}</p><div className="micro-schematic" aria-label="Esquema conceitual de fluxo"><span>Hemácia</span><Icon name="arrow" /><span>RC conceitual</span></div><p>Use os seletores e as evidências. Nenhuma dimensão ou trajetória RC é estabelecida por este esquema.</p><button className="secondary-button" data-testid="micro-retry" onClick={() => { setError(''); setAttempt((n) => n + 1); }}>Tentar novamente</button></div> : <SceneBoundary key={attempt} onError={fail}><Suspense fallback={<div className="scene-loading" role="status">Preparando o ambiente vascular…</div>}><Scene onReady={ready} onError={fail} /></Suspense></SceneBoundary>}
        </div>
        <div className="micro-scene-label"><span>{state.cameraMode === 'tracking' ? 'ACOMPANHAMENTO / IDENTIDADE FIXA' : state.cameraMode === 'flow' ? 'OBSERVAÇÃO DO FLUXO' : 'OBSERVAÇÃO LIVRE'}</span><strong>{state.selectedId ?? 'CIRCUITO ILUSTRATIVO'}</strong></div>
        <div className="stage-bottom"><div className="proxy-stamp"><span>△</span><div><strong>PROXY / CONCEPTUAL MODEL</strong><small>Geometria e transporte simplificados · sem escala RC real</small></div></div></div>
      </section>
      <aside className="inspector is-open micro-inspector" data-testid="micro-inspector" data-selected-id={state.selectedId ?? ''} aria-label="Inspeção vascular">
        <div className="panel-eyebrow"><span>02 / INSPEÇÃO MICRO</span><Icon name="focus" /></div>
        <div className="inspector-body"><div className="specimen-tag">{selected ? 'ENTIDADE SELECIONADA' : 'ESTRUTURA / MODELO'}</div><h2>{selected ? selected.kind === 'rc' ? 'Célula RC' : 'Hemácia' : selectedKind === 'rc' ? 'Célula RC' : selectedKind === 'rbc' ? 'Hemácia' : 'Lúmen vascular'}</h2>
          {state.selectedId ? <p className="micro-identity">{state.selectedId}</p> : null}
          {state.selectedId && !selected ? <p className="micro-absent" role="status">Entidade ausente neste perfil. Sua identidade foi preservada; escolha um perfil que a contenha ou selecione outra célula.</p> : null}
          <div className="micro-subjects" role="group" aria-label="Estrutura para inspeção">{(['vessel', 'rbc', 'rc'] as const).map((item) => <button key={item} aria-pressed={selectedKind === item} onClick={() => selectKind(item)}>{item === 'vessel' ? 'Vaso' : item === 'rbc' ? 'Hemácia' : 'RC'}</button>)}</div>
          <div className="inspection-tabs" role="tablist" aria-label="Detalhes da microcena"><button role="tab" aria-selected={tab === 'structure'} onClick={() => setTab('structure')}>Estrutura</button><button data-testid="micro-evidence" role="tab" aria-selected={tab === 'evidence'} onClick={() => setTab('evidence')}>Evidências</button></div>
          <div className="representation-notice"><span className="notice-symbol">△</span><div><strong>{selectedKind === 'rc' ? 'INTERPRETAÇÃO ARTÍSTICA' : 'MODELO DIDÁTICO'}</strong><p>{selectedKind === 'rc' ? 'Forma original. Histologia, tamanho e dinâmica vascular RC não são estabelecidos pelas fontes consultadas.' : 'Base humana geral; geometria simplificada e proporções ilustrativas.'}</p></div></div>
          <div role="tabpanel">{tab === 'structure' ? <><p className="structure-description">{selectedKind === 'vessel' ? 'Um circuito curvo permite explorar profundidade e transporte em uma cena separada do corpo. Parede e relevo são formas autorais simplificadas.' : selectedKind === 'rbc' ? 'Disco bicôncavo com espessura e orientação variável. A representação não resolve deformação física nem colisões entre células.' : 'Silhueta orgânica lobulada, distinta das hemácias mesmo sem realce. O desenho não representa organelas ou um modelo visual oficial.'}</p><p className="micro-note">Posição derivada do tempo absoluto, identidade e seed. Seguir altera somente a câmera. Velocidade e quantidade são parâmetros da visualização.</p></> : <>{claims.map((claim) => <article className="evidence-card" key={claim.id}><span className={`evidence-badge ${claim.kind}`}>{labels[claim.kind]}</span><p>{claim.text}</p>{claim.disclaimer ? <p className="claim-disclaimer">{claim.disclaimer}</p> : null}</article>)}{claims.length === 0 ? <p>Nenhuma afirmação elegível para o filtro atual. A forma continua conceitual.</p> : null}{citations.map((citation) => <article className="micro-source" key={citation.id}><a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title}</a><p>{citation.locator}</p><small>{citation.verifiedAt ? `Texto consultado em ${citation.verifiedAt}` : 'Conferência pendente'}</small></article>)}</>}</div>
          <p className="node-id">P1 / TRANSPORTE VISUAL · SEM CFD</p>
        </div>
      </aside>
    </div>
    <section className="micro-timeline" aria-label="Reprodução do transporte vascular">
      <div className="micro-transport"><button data-testid="micro-play" className="icon-button" disabled={!!error || !state.ready || reduced} aria-label={state.playing ? 'Pausar transporte' : 'Reproduzir transporte'} onClick={() => state.playing ? state.pause() : state.play()}><Icon name={state.playing ? 'pause' : 'play'} /></button><button className="icon-button" aria-label="Passo anterior do transporte" onClick={() => state.step(-.5)}><span>−</span></button><button className="icon-button" aria-label="Próximo passo do transporte" onClick={() => state.step(.5)}><span>+</span></button><button data-testid="micro-reset" className="icon-button" aria-label="Reiniciar transporte" onClick={() => state.reset()}><Icon name="reset" /></button></div>
      <label className="micro-time">Tempo do transporte <output>{shownSeconds.toFixed(2)} s · animação</output><input data-testid="micro-time" aria-label="Tempo do transporte" type="range" min="0" max={Math.max(120, Math.ceil(shownSeconds / 60) * 60)} step="0.01" value={shownSeconds} onChange={(e) => { const next = Number(e.target.value); state.scrub(next); setSeconds(next); }} /></label>
      <label className="micro-speed">Velocidade visual <output>{state.speed.toFixed(2)} / 1</output><input data-testid="micro-speed" aria-label="Velocidade visual normalizada" type="range" min="0" max="1" step="0.01" value={state.speed} onChange={(e) => state.setSpeed(Number(e.target.value))} /></label>
      {reduced ? <p className="micro-reduced">Movimento reduzido: inspeção estática, scrub e passos disponíveis.</p> : null}
    </section>
  </div>;
}
