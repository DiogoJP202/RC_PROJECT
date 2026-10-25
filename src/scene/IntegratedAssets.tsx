import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Color, Mesh, type Material } from 'three';
import type { AnatomyId } from '../app/types';
import { useAssets } from '../state/assets';
import { assetClock } from '../state/assetClock';
import { anatomyLayer, useObservatory } from '../state/observatory';
import { acquireAsset, type AssetLease } from '../visuals/assets/assetCache';
import { AssetSlot } from './AssetSlot';
import { assetRuntime } from './assetRuntime';
import { useRinkaku } from '../state/rinkaku';
import { isEffectivelyVisible } from './visibility';

type SurfaceMaterial = Material & { color?: Color; emissive?: Color; emissiveIntensity?: number };

export function IntegratedAssets({ onHit }: { onHit: (id: AnatomyId) => void }) {
  const requestedId = useAssets((s) => s.requestedId);
  const attempt = useAssets((s) => s.attempt);
  const [loaded, setLoaded] = useState<{ lease: AssetLease; attempt: number } | null>(null);
  const active = loaded?.attempt === attempt && loaded.lease.assetId === requestedId ? loaded.lease : null;
  const layers = useObservatory((s) => s.layers);
  const selected = useObservatory((s) => s.selectedId);
  const opacity = useObservatory((s) => s.surfaceOpacity);
  const isolated = useObservatory((s) => s.isolated);
  const canonOnly = useObservatory((s) => s.canonOnly);
  const reduced = useObservatory((s) => s.reducedMotion);
  const manifestation = useRinkaku((s) => s.enabled);
  const replacedIds = useMemo(() => new Set(active?.bindings.keys() ?? []), [active]);
  const mixer = active?.mixer ?? null;
  const clips = useMemo(() => new Map(active?.animations.map((clip) => [clip.name, clip]) ?? []), [active]);
  const revision = useRef(-1);
  const baseMaterials = useMemo(() => {
    const originals = new Map<Material, { color?: Color; emissive?: Color; emissiveIntensity?: number; opacity: number; transparent: boolean; depthWrite: boolean }>();
    active?.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) originals.set(material, { color: (material as SurfaceMaterial).color?.clone(), emissive: (material as SurfaceMaterial).emissive?.clone(), emissiveIntensity: (material as SurfaceMaterial).emissiveIntensity, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
    });
    return originals;
  }, [active]);

  useEffect(() => {
    if (requestedId === 'proxy') return;
    useAssets.getState().report('loading');
    const controller = new AbortController();
    let owned: AssetLease | null = null;
    void acquireAsset(requestedId, { signal: controller.signal }).then((lease) => {
      if (controller.signal.aborted) { lease.release(); return; }
      owned = lease;
      setLoaded({ lease, attempt });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) useAssets.getState().report('error', error instanceof Error ? error.message : 'Falha de carregamento GLB.');
    });
    return () => {
      controller.abort(); owned?.release();
      if (owned) setLoaded((current) => current?.lease === owned ? null : current);
    };
  }, [requestedId, attempt]);

  useEffect(() => {
    assetRuntime.lease = active;
    assetRuntime.revision += 1;
    assetRuntime.animationTime = 0;
    assetClock.clip = ''; assetClock.normalized = 0;
    revision.current = -1;
    if (active) {
      for (const [id, nodes] of active.bindings) for (const node of nodes) node.traverse((object) => {
        if (object instanceof Mesh) Object.assign(object.userData, { anatomyId: id, layer: anatomyLayer[id], modelStatus: 'conceptual_proxy', assetId: active.assetId });
      });
      useAssets.getState().setClips(active.animations.map((clip) => clip.name));
      useAssets.getState().report('ready');
    }
    return () => {
      mixer?.stopAllAction(); mixer?.uncacheRoot(active?.scene ?? mixer.getRoot());
      if (assetRuntime.lease === active) { assetRuntime.lease = null; assetRuntime.animationTime = 0; assetClock.clip = ''; assetClock.normalized = 0; }
    };
  }, [active, mixer]);

  useEffect(() => {
    if (reduced) useAssets.getState().setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    if (!active) return;
    for (const [id, objects] of active.bindings) for (const node of objects) node.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.visible = layers[anatomyLayer[id]] && (!isolated || selected === id) && !(manifestation && id === 'ghoul.kakuhou.rinkaku');
      object.castShadow = true; object.receiveShadow = true;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const mat = material as SurfaceMaterial;
        const base = baseMaterials.get(mat);
        const surface = anatomyLayer[id] === 'surface';
        mat.opacity = surface ? opacity * (base?.opacity ?? 1) : base?.opacity ?? 1;
        mat.transparent = (base?.transparent ?? false) || surface && opacity < 0.99;
        mat.depthWrite = mat.transparent ? false : base?.depthWrite ?? true;
        if (base?.color) mat.color?.copy(base.color);
        if (canonOnly) mat.color?.lerp(new Color('#647279'), 0.4);
        if (id === selected) {
          if (mat.emissive) mat.emissive.set('#397c79');
          else mat.color?.lerp(new Color('#86bcb5'), .18);
        } else if (base?.emissive) mat.emissive?.copy(base.emissive);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = id === selected ? Math.max(.22, base?.emissiveIntensity ?? 0) : base?.emissiveIntensity ?? 0;
        mat.needsUpdate = true;
      }
    });
  }, [active, baseMaterials, layers, selected, opacity, isolated, canonOnly, manifestation]);

  useFrame((_state, delta) => {
    if (!active || !mixer) return;
    const state = useAssets.getState();
    const clip = clips.get(state.clip);
    if (revision.current !== state.animationRevision) {
      mixer.stopAllAction();
      if (clip) { mixer.clipAction(clip).reset().play(); mixer.setTime(Math.min(state.sample, 0.999999) * clip.duration); }
      else { active.scene.traverse((object) => { if ('isSkinnedMesh' in object && object.isSkinnedMesh) (object as import('three').SkinnedMesh).pose(); }); }
      revision.current = state.animationRevision;
    }
    if (clip && state.playing && !useObservatory.getState().reducedMotion && useObservatory.getState().mode === 'body' && !document.hidden) mixer.update(Math.min(delta, 0.05));
    assetRuntime.animationTime = clip ? mixer.clipAction(clip).time : 0;
    assetClock.clip = state.clip;
    assetClock.normalized = clip?.duration ? assetRuntime.animationTime / clip.duration : 0;
  });

  const hit = (event: ThreeEvent<MouseEvent>) => {
    const id = event.object.userData.anatomyId as AnatomyId | undefined;
    if (!id || !isEffectivelyVisible(event.object)) return;
    if (anatomyLayer[id] === 'surface' && opacity < 0.32 && event.intersections.some((entry) => isEffectivelyVisible(entry.object) && entry.object.userData.anatomyId && anatomyLayer[entry.object.userData.anatomyId as AnatomyId] !== 'surface')) return;
    event.stopPropagation(); onHit(id); useObservatory.getState().select(id);
  };
  return <>
    <AssetSlot onHit={onHit} replacedIds={replacedIds} />
    {active ? <primitive object={active.scene} dispose={null} onClick={hit}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => { if (isEffectivelyVisible(event.object) && event.object.userData.anatomyId) { event.stopPropagation(); document.body.style.cursor = 'crosshair'; } }}
      onPointerOut={() => { document.body.style.cursor = ''; }} /> : null}
  </>;
}
