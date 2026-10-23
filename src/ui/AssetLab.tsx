import { useEffect, useState } from 'react';
import { useAssets } from '../state/assets';
import { assetClock } from '../state/assetClock';
import { useObservatory } from '../state/observatory';

/** Opt-in QA bench. Fixtures are never offered as anatomical specimens. */
export function AssetLab() {
  const state = useAssets();
  const reduced = useObservatory((s) => s.reducedMotion);
  const [transient, setTransient] = useState(0);
  useEffect(() => {
    if (!state.playing || reduced) return;
    const interval = window.setInterval(() => setTransient(assetClock.normalized), 250);
    return () => window.clearInterval(interval);
  }, [state.playing, reduced]);
  return <aside className="asset-lab" aria-label="Bancada de integração GLB">
    <div><strong>Bancada GLB / G2A</strong><small>FIXTURES SINTÉTICAS · SEM VALOR ANATÔMICO</small></div>
    <label>Recurso de teste<select data-testid="asset-select" value={state.requestedId} onChange={(e) => state.choose(e.target.value)}>
      <option value="proxy">Proxy G1</option><option value="fixture.static.v1">GLB modular</option><option value="fixture.rigged.v1">GLB articulado</option>
    </select></label>
    <span role="status" data-testid="asset-status">{state.status === 'loading' ? 'Carregando GLB; proxy disponível' : state.status === 'ready' ? 'GLB sintético integrado' : state.status === 'error' ? 'Falha de GLB; proxy restaurado' : 'Proxy original ativo'}</span>
    {state.status === 'error' ? <><p className="asset-error">{state.message}</p><button className="secondary-button" data-testid="asset-retry" onClick={state.retry}>Tentar GLB novamente</button></> : null}
    {state.requestedId === 'fixture.rigged.v1' && state.status === 'ready' ? <div className="asset-animation">
      <label>Clipe de teste<select data-testid="asset-animation-clip" value={state.clip} onChange={(e) => state.setClip(e.target.value)}><option value="">Pose de repouso</option>{state.clips.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Pose normalizada<input data-testid="asset-animation-time" aria-label="Pose normalizada da fixture" type="range" min="0" max="1" step="0.01" value={state.playing && !reduced ? transient : state.sample} onChange={(e) => state.scrub(Number(e.target.value))} /></label>
      <button className="secondary-button" data-testid="asset-animation-play" aria-pressed={state.playing && !reduced} disabled={!state.clip || reduced} onClick={() => { setTransient(state.sample); state.setPlaying(!state.playing); }}>{state.playing && !reduced ? 'Pausar clipe' : 'Reproduzir clipe'}</button>
    </div> : null}
  </aside>;
}
