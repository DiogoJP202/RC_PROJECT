import { useEffect, useState } from 'react';
import { useObservatory } from '../state/observatory';
import { scanClock } from '../state/scanClock';
import { Icon } from './Icon';
export function Timeline({ ready }: { ready: boolean }) {
  const paused = useObservatory((s) => s.paused);
  const reduced = useObservatory((s) => s.reducedMotion);
  const t = useObservatory((s) => s.scanT);
  const [liveT, setLiveT] = useState(scanClock.progress);
  useEffect(() => {
    if (paused || reduced || !ready) return;
    const timer = window.setInterval(() => setLiveT(scanClock.progress), 250);
    return () => window.clearInterval(timer);
  }, [paused, reduced, ready]);
  return <section className="timeline" aria-label="Inspeção visual demonstrativa">
    <div className="timeline-title"><span className="micro-label">SEQUÊNCIA DE INSPEÇÃO</span><strong>Varredura de superfície</strong><span className="simulation-label">DEMONSTRAÇÃO VISUAL</span></div>
    <button className="scan-button" data-testid="scan-toggle" disabled={!ready || reduced} aria-label={paused ? 'Reproduzir inspeção' : 'Pausar inspeção'} aria-pressed={!paused} onClick={() => useObservatory.getState().setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} size={20} /></button>
    <div className="scrubber"><div className="scrubber-labels"><span>INÍCIO</span><span>{reduced ? 'MOVIMENTO REDUZIDO' : paused ? 'PAUSADO · CONTROLE MANUAL' : 'SCAN ATIVO'}</span><span>FIM</span></div><input aria-label="Progresso da inspeção" type="range" min="0" max="1" step="0.01" value={paused || reduced ? t : liveT} disabled={!ready} onChange={(e) => useObservatory.getState().scrub(Number(e.target.value))} /><div className="timeline-ticks" aria-hidden="true">{Array.from({ length: 21 }, (_, i) => <i key={i} />)}</div></div>
    <button className="text-button scan-reset" disabled={!ready} aria-label="Reiniciar inspeção" onClick={() => useObservatory.getState().scrub(0)}><Icon name="reset" size={16} /> Reiniciar</button>
    <div className="timeline-note">Efeito de inspeção.<br />Sem medida fisiológica.</div>
  </section>;
}
