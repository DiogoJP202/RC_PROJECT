import { useEffect, useState } from 'react';
import type { AtlasContent } from '../content/catalog';
import { PHASES, sampleRinkakuAt, type RinkakuPhase } from '../simulation/rinkaku';
import { rinkakuClock, useRinkaku } from '../state/rinkaku';
import { useObservatory } from '../state/observatory';
import { Icon } from './Icon';
import { EvidenceSources } from './EvidenceSources';

const descriptions: Record<RinkakuPhase, string> = {
  rest: 'A raiz lombar está recolhida neste quadro.',
  activation: 'O contorno começa a mudar na região lombar.',
  release: 'A raiz lombar e a base dos apêndices ficam visíveis.',
  growth: 'Os apêndices se alongam e mudam de curvatura.',
  fixation: 'As pregas ficam mais pronunciadas na superfície do modelo.',
  active: 'Os apêndices alcançam a extensão máxima da animação.',
  retract: 'Os apêndices encurtam e voltam ao repouso.',
};

function useVisualFrame() {
  const playing = useRinkaku((s) => s.playing);
  const t = useRinkaku((s) => s.t);
  const config = useRinkaku((s) => s.config);
  const [, redraw] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => redraw((revision) => revision + 1), 250);
    return () => window.clearInterval(timer);
  }, [playing]);
  return sampleRinkakuAt(playing ? rinkakuClock.t : t, config);
}

export function RinkakuEntry({ onToggle }: { onToggle: () => void }) {
  const enabled = useRinkaku((s) => s.enabled);
  return <button className="manifest-entry" data-testid="rinkaku-toggle" aria-pressed={enabled}
    aria-label={enabled ? 'Voltar à inspeção anatômica' : 'Abrir manifestação Rinkaku'}
    onClick={onToggle}><span aria-hidden="true">{enabled ? '←' : '◇'}</span>{enabled ? 'Voltar ao Corpo' : 'Simular Rinkaku'}</button>;
}

export function RinkakuTimeline({ ready }: { ready: boolean }) {
  const playing = useRinkaku((s) => s.playing);
  const direction = useRinkaku((s) => s.direction);
  const reduced = useObservatory((s) => s.reducedMotion);
  const frame = useVisualFrame();
  const phase = PHASES.find((p) => p.key === frame.phase)!;
  return <section className="rinkaku-timeline" aria-label="Timeline de manifestação Rinkaku" data-testid="rinkaku-timeline">
    <div className="rinkaku-timeline-title"><span className="micro-label">Fase da simulação</span><strong data-testid="rinkaku-phase-label">{phase.label}</strong></div>
    <div className="rinkaku-transport" role="group" aria-label="Reprodução da manifestação">
      <button data-testid="rinkaku-reset" className="icon-button" aria-label="Reiniciar manifestação" onClick={() => useRinkaku.getState().reset()}><Icon name="reset" size={17} /></button>
      <button data-testid="rinkaku-step-back" className="icon-button" aria-label="Voltar um passo na manifestação" onClick={() => useRinkaku.getState().step(-0.02)}>−</button>
      <button data-testid="rinkaku-reverse" className="secondary-button" disabled={!ready || reduced || frame.t <= 0}
        aria-label="Reproduzir manifestação em reverso" aria-pressed={playing && direction === -1} onClick={() => useRinkaku.getState().play(-1)}>↶ <span>Retroceder</span></button>
      <button data-testid="rinkaku-play" className="rinkaku-play primary-button" disabled={!ready || reduced}
        aria-label={playing ? 'Pausar manifestação' : 'Reproduzir manifestação'} aria-pressed={playing}
        onClick={() => {
          const s = useRinkaku.getState();
          if (s.playing) s.pause();
          else if (rinkakuClock.t >= 1) { s.reset(); s.play(1); }
          else s.play(rinkakuClock.t <= 0 ? 1 : undefined);
        }}><Icon name={playing ? 'pause' : 'play'} size={17} />{playing ? 'Pausar' : frame.t === 0 ? 'Iniciar' : 'Retomar'}</button>
      <button data-testid="rinkaku-step-forward" className="icon-button" aria-label="Avançar um passo na manifestação" onClick={() => useRinkaku.getState().step(0.02)}>+</button>
    </div>
    <label className="rinkaku-phase-select">Ir para fase<select data-testid="rinkaku-phase" aria-label="Fase da manifestação" value={frame.phase} onChange={(e) => useRinkaku.getState().selectPhase(e.target.value as RinkakuPhase)}>{PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
    <div className="rinkaku-scrubber"><label htmlFor="rinkaku-timeline-input"><span>{reduced ? 'Movimento reduzido · Quadro manual' : !ready ? '3D indisponível · Quadro manual' : playing ? direction === -1 ? 'Reprodução reversa' : 'Em reprodução' : 'Pausado · Quadro manual'}</span><output data-testid="rinkaku-progress">t {frame.t.toFixed(3)}</output></label>
      <input id="rinkaku-timeline-input" data-testid="rinkaku-time" aria-label="Progresso da manifestação Rinkaku" type="range" min="0" max="1" step="0.001" value={frame.t} onChange={(e) => useRinkaku.getState().scrub(Number(e.target.value))} />
      <div className="rinkaku-phase-track" aria-hidden="true">{PHASES.map((p) => <span className={p.key === frame.phase ? 'current' : ''} key={p.key} style={{ flexGrow: p.end - p.start }}>{p.label}</span>)}</div>
    </div>
  </section>;
}

export function RinkakuInspector({ content, ready, onSceneAction }: { content: AtlasContent; ready: boolean; onSceneAction?: () => void }) {
  const frame = useVisualFrame();
  const config = useRinkaku((s) => s.config);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const evidence = content.claims.filter((c) => ['claim.kakuhou.stores.rc', 'claim.kagune.liquid.muscle', 'claim.rinkaku.region'].includes(c.id));
  const sources = content.citations.filter((source) => evidence.some((c) => c.citationIds.includes(source.id)));
  return <aside className="inspector rinkaku-inspector" data-testid="rinkaku-inspector" aria-label="Modelo de manifestação Rinkaku">
    <h2>Parâmetros visuais</h2>
    <p className="rinkaku-phase-description">{descriptions[frame.phase]}</p>
    <div className="rinkaku-disclosure"><strong>PROXY / CONCEPTUAL MODEL</strong><p>Forma, crescimento, fixação e retração são escolhas de animação. As sete fases não descrevem um mecanismo canônico.</p></div>
    <div className="rinkaku-settings">
      <label>Apêndices <small>Escolha desta demonstração</small><select data-testid="rinkaku-count" aria-label="Quantidade de apêndices" value={config.appendageCount} onChange={(e) => useRinkaku.getState().setConfig({ appendageCount: Number(e.target.value) as 1 | 2 | 3 | 4 })}>{[1, 2, 3, 4].map((count) => <option value={count} key={count}>{count.toString().padStart(2, '0')}</option>)}</select></label>
      <label>Efeitos<select data-testid="rinkaku-quality" aria-label="Qualidade dos efeitos" value={config.quality} onChange={(e) => useRinkaku.getState().setConfig({ quality: e.target.value === 'low' ? 'low' : 'standard' })}><option value="standard">Padrão</option><option value="low">Econômico</option></select></label>
      <label className="rinkaku-particles"><input data-testid="rinkaku-particles" type="checkbox" checked={config.particles} onChange={(e) => useRinkaku.getState().setConfig({ particles: e.target.checked })} /><span>Partículas artísticas<small>Recurso visual; não são células RC.</small></span></label>
    </div>
    <dl className="rinkaku-channels" aria-label="Parâmetros normalizados do modelo">{([
      ['Extensão visual', frame.appendageExtension], ['Exposição da raiz', frame.rootExposure], ['Rigidez visual', frame.visualStiffness],
    ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><meter min="0" max="1" value={value} aria-label={label} /><span>{value.toFixed(2)}</span></dd></div>)}</dl>
    <div className="rinkaku-views">{([
      ['rinkaku-posterior', 'Posterior', 'posterior'], ['rinkaku-lateral', 'Lateral', 'rinkaku-lateral'],
      ['rinkaku-oblique', 'Oblíqua', 'rinkaku-oblique'], ['rinkaku-focus', 'Focar raiz lombar', 'ghoul.kakuhou.rinkaku'],
    ] as const).map(([id, label, target]) => <button key={id} className="secondary-button" data-testid={id} disabled={!ready} onClick={() => { useObservatory.getState().focusOn(target); onSceneAction?.(); }}>{label}</button>)}</div>
    <details className="rinkaku-evidence"><summary>O que as fontes sustentam</summary>{evidence.map((claim) => <article className="evidence-card" key={claim.id}><span className={`evidence-badge ${claim.kind}`}>CANÔNICO · ESCOPO TEXTUAL</span><p>{claim.text}</p><p className="claim-disclaimer">{claim.scope}</p></article>)}<EvidenceSources citations={sources} /><p className="claim-disclaimer">Mecanismos de formação, tempos, câmaras internas e fixação anatômica não são estabelecidos por esta visualização. A forma continua uma hipótese visual{canonOnly ? ', inclusive com o filtro de evidências ligado' : ''}.</p></details>
  </aside>;
}
