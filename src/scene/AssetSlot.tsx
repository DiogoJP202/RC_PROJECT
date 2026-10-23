import { useEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Color, DoubleSide, MeshStandardMaterial } from 'three';
import type { AnatomyId } from '../app/types';
import { anatomyLayer, useObservatory } from '../state/observatory';
import { createProxyGeometries } from './proxyGeometry';

const NODE_NAMES: Record<AnatomyId, string> = {
  'human.surface': 'HUMAN_SURFACE', 'human.head': 'HUMAN_HEAD', 'human.muscular': 'HUMAN_MUSCULAR',
  'human.skeletal': 'HUMAN_SKELETAL', 'human.thorax': 'HUMAN_THORAX', 'ghoul.kakuhou.rinkaku': 'KAKUHOU_RINKAKU',
};
const PALETTE: Record<AnatomyId, { color: string; roughness: number }> = {
  'human.surface': { color: '#899593', roughness: 0.83 },
  'human.head': { color: '#8d9997', roughness: 0.81 },
  'human.muscular': { color: '#9d6b60', roughness: 0.7 },
  'human.skeletal': { color: '#d1cbb3', roughness: 0.56 },
  'human.thorax': { color: '#789ea0', roughness: 0.48 },
  'ghoul.kakuhou.rinkaku': { color: '#ad3e54', roughness: 0.38 },
};
export interface AssetSlotProps { onHit?: (id: AnatomyId) => void }

/** Asset seam: a future licensed GLB keeps these IDs, metadata, anchors and selection contract. */
export function AssetSlot({ onHit }: AssetSlotProps) {
  const geometries = useMemo(() => createProxyGeometries(), []);
  const materials = useMemo(() => Object.fromEntries(Object.entries(PALETTE).map(([id, values]) => [id,
    new MeshStandardMaterial({ color: values.color, roughness: values.roughness, metalness: 0.035, side: DoubleSide }),
  ])) as Record<AnatomyId, MeshStandardMaterial>, []);
  const layers = useObservatory((s) => s.layers);
  const opacity = useObservatory((s) => s.surfaceOpacity);
  const selected = useObservatory((s) => s.selectedId);
  const isolated = useObservatory((s) => s.isolated);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const select = useObservatory((s) => s.select);
  const resourceLifetime = useRef({ epoch: 0 });
  useEffect(() => {
    const lifetime = resourceLifetime.current;
    const epoch = ++lifetime.epoch;
    return () => {
      document.body.style.cursor = '';
      // StrictMode immediately reactivates effects; dispose only on an actual unmount.
      queueMicrotask(() => {
        if (lifetime.epoch !== epoch) return;
        Object.values(geometries).forEach((g) => g.dispose());
        Object.values(materials).forEach((m) => m.dispose());
      });
    };
  }, [geometries, materials]);
  useEffect(() => {
    (Object.keys(materials) as AnatomyId[]).forEach((id) => {
      const mat = materials[id];
      const isSurface = anatomyLayer[id] === 'surface';
      mat.transparent = isSurface && opacity < 0.99;
      mat.opacity = isSurface ? opacity : 1;
      mat.depthWrite = !mat.transparent;
      mat.color.set(PALETTE[id].color);
      if (canonOnly && !isSurface) mat.color.lerp(new Color('#647279'), 0.55);
      mat.emissive.set(id === selected ? '#3d7776' : id === 'ghoul.kakuhou.rinkaku' ? '#6d122b' : '#000000');
      mat.emissiveIntensity = id === selected ? 0.15 : id === 'ghoul.kakuhou.rinkaku' ? 0.12 : 0;
      mat.needsUpdate = true;
    });
  }, [materials, opacity, selected, canonOnly]);

  const hit = (event: ThreeEvent<MouseEvent>, id: AnatomyId) => {
    if (!event.object.visible) return;
    // Let a transparent outer surface pass picking through to a visible inner structure.
    if (anatomyLayer[id] === 'surface' && opacity < 0.32 && event.intersections.some((entry) => {
      const target = entry.object.userData.anatomyId as AnatomyId | undefined;
      return entry.object.visible && target && anatomyLayer[target] !== 'surface';
    })) return;
    event.stopPropagation();
    onHit?.(id);
    select(id);
  };
  return <group name="ANATOMY_ASSET_SLOT" userData={{ modelStatus: 'conceptual_proxy', generator: 'src/scene/proxyGeometry.ts' }}>
    {(Object.keys(geometries) as AnatomyId[]).map((id) => {
      const visible = layers[anatomyLayer[id]] && (!isolated || selected === id);
      return <mesh key={id} name={NODE_NAMES[id]} geometry={geometries[id]} material={materials[id]} visible={visible}
        castShadow receiveShadow userData={{ anatomyId: id, layer: anatomyLayer[id], modelStatus: 'conceptual_proxy' }}
        onClick={(event) => hit(event, id)}
        onPointerOver={(event) => { if (!event.object.visible) return; event.stopPropagation(); document.body.style.cursor = 'crosshair'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }} />;
    })}
  </group>;
}
