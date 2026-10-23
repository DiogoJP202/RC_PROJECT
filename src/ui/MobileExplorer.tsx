import { useEffect, useRef } from 'react';
import type { AtlasContent } from '../content/catalog';
import { useObservatory } from '../state/observatory';
import { Icon } from './Icon';

export function MobileExplorer({ content }: { content: AtlasContent }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const selected = useObservatory((s) => s.selectedId);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 780px)');
    const close = () => { if (!media.matches) drawer.current?.close(); };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  return <>
    <button className="mobile-explore" data-testid="mobile-explore" onClick={() => drawer.current?.showModal()}><Icon name="layers" /><span>Explorar anatomia<small>{content.structures.find((s) => s.id === selected)?.label}</small></span><Icon name="chevron" /></button>
    <dialog className="anatomy-drawer" ref={drawer} aria-labelledby="explore-title" onClick={(e) => { if (e.target === e.currentTarget) drawer.current?.close(); }}>
      <div className="drawer-heading"><div><span className="micro-label">O CORPO COMO MAPA</span><h2 id="explore-title">Escolha uma estrutura</h2></div><button className="icon-button" aria-label="Fechar exploração" onClick={() => drawer.current?.close()}><Icon name="close" /></button></div>
      <p>Seleção sincronizada com o visor e as evidências. Formas conceituais.</p>
      <div className="drawer-structures">{content.structures.map((structure, i) => <button key={structure.id} data-testid={`mobile-structure-${structure.id}`} aria-pressed={selected === structure.id} onClick={() => {
        useObservatory.getState().select(structure.id);
        drawer.current?.close();
        requestAnimationFrame(() => document.querySelector('[data-testid="stage"]')?.scrollIntoView({ block: 'start', behavior: useObservatory.getState().reducedMotion ? 'instant' : 'smooth' }));
      }}><span>{String(i + 1).padStart(2, '0')}</span>{structure.label}<Icon name="chevron" /></button>)}</div>
      <button className="text-button" onClick={() => { useObservatory.getState().setInspectorOpen(true); useObservatory.getState().setInspectorTab('evidence'); drawer.current?.close(); requestAnimationFrame(() => document.getElementById('anatomy-inspector')?.scrollIntoView({ block: 'start' })); }}>Ler evidências da seleção <Icon name="arrow" /></button>
    </dialog>
  </>;
}
