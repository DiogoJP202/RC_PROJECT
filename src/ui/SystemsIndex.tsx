import type { AtlasContent } from '../content/catalog';
import type { AnatomyId, LayerId } from '../app/types';
import { useObservatory } from '../state/observatory';
import { Icon } from './Icon';

const layerLabels: Record<LayerId, string> = { surface: 'Superfície', muscular: 'Muscular', skeletal: 'Esquelética', internal: 'Estruturas internas' };
const subtitles: Record<string, string> = { 'human.surface': 'Forma externa', 'human.head': 'Região craniana', 'human.muscular': 'Volumes musculares', 'human.skeletal': 'Arcabouço estrutural', 'human.thorax': 'Região torácica', 'ghoul.kakuhou.rinkaku': 'Órgão de reserva RC' };
export function StructureButtons({ content, onSelect }: { content: AtlasContent; onSelect: (id: AnatomyId) => void }) {
  const selectedId = useObservatory((s) => s.selectedId);
  return <div className="structure-list">{content.structures.map((structure, index) => <button key={structure.id} data-testid={`structure-${structure.id}`} className={`structure-button ${selectedId === structure.id ? 'selected' : ''}`} aria-pressed={selectedId === structure.id} onClick={() => onSelect(structure.id)}><span className="structure-number">{(index + 1).toString().padStart(2, '0')}</span><span><strong>{structure.label}</strong><small>{subtitles[structure.id]}</small></span><Icon name="chevron" size={13} /></button>)}</div>;
}

export function LayerControls() {
  const layers = useObservatory((s) => s.layers);
  const opacity = useObservatory((s) => s.surfaceOpacity);
  return <>
    <div className="layers-heading"><span className="micro-label">CAMADAS DA CENA</span><span>{Object.values(layers).filter(Boolean).length} / 4</span></div>
    <div className="layer-list">{(Object.keys(layerLabels) as LayerId[]).map((layer) => <button data-testid={`layer-${layer}`} key={layer} className={layers[layer] ? 'layer-active' : ''} aria-pressed={layers[layer]} onClick={() => useObservatory.getState().toggleLayer(layer)}><Icon name="eye" size={15} /><span>{layerLabels[layer]}</span><span className="layer-switch" /></button>)}</div>
    <label className="opacity-control"><span>Opacidade da superfície <output>{Math.round(opacity * 100)}%</output></span><input aria-label="Opacidade da superfície" type="range" min="0.08" max="1" step="0.01" value={opacity} onChange={(e) => useObservatory.getState().setOpacity(Number(e.target.value))} /></label>
  </>;
}

export function SystemsIndex({ content }: { content: AtlasContent }) {
  const selectStructure = (id: AnatomyId) => {
    useObservatory.getState().select(id);
    if (window.matchMedia('(max-width: 780px)').matches) requestAnimationFrame(() => document.getElementById('anatomy-inspector')?.scrollIntoView({ block: 'start', behavior: useObservatory.getState().reducedMotion ? 'instant' : 'smooth' }));
  };
  return <aside className="systems-index" aria-label="Índice anatômico">
    <div className="panel-eyebrow"><span>01 / EXPLORAÇÃO</span><span className="small-counter">06</span></div>
    <h2 className="index-title">O corpo como mapa.</h2><p className="index-intro">Selecione uma estrutura para investigar.</p>
    <StructureButtons content={content} onSelect={selectStructure} />
    <LayerControls />
    <div className="index-footnote"><span className="tiny-cross">+</span><p>Camadas esquemáticas independentes.<br />Substituição por assets prevista no G2.</p></div>
  </aside>;
}
