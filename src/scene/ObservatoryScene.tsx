import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ACESFilmicToneMapping, Box3, Color, DoubleSide, Group, Mesh, PCFShadowMap, Raycaster, Vector2, Vector3, WebGLRenderer } from 'three';
import type { AnatomyId, SceneMetrics, SceneProps } from '../app/types';
import { useObservatory } from '../state/observatory';
import { scanClock } from '../state/scanClock';
import { IntegratedAssets } from './IntegratedAssets';
import { assetRuntime, bindingAnchor, bindingBounds } from './assetRuntime';
import { getAssetCacheStats } from '../visuals/assets/assetCache';
import { useAssets } from '../state/assets';
import { cameraPose, smoothFocus } from './camera';

const ANCHORS: Record<AnatomyId, [number, number, number]> = {
  'human.surface': [0, 1.33, 0.115], 'human.head': [0, 1.72, 0.08],
  'human.muscular': [0.08, 1.36, 0.09], 'human.skeletal': [0, 1.32, 0.07],
  'human.thorax': [-0.075, 1.32, 0.01], 'ghoul.kakuhou.rinkaku': [0, 0.976, -0.143],
};

type AtlasSceneApi = {
  snapshot: () => Record<string, unknown>;
  project: (id: AnatomyId) => { x: number; y: number; z: number };
  raycast: (x: number, y: number) => AnatomyId | null;
};
declare global { interface Window { __ATLAS_SCENE__?: AtlasSceneApi } }

function InspectableScene({ onReady, onError }: SceneProps) {
  const { camera, gl, scene, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const scan = useRef<Group>(null);
  const scanProgress = useRef(useObservatory.getState().scanT);
  const lastRevision = useRef(useObservatory.getState().scanRevision);
  const lastHit = useRef<AnatomyId | null>(null);
  const ready = useRef(false);
  const frameCount = useRef(0);
  const frameCursor = useRef(0);
  const frameDurations = useRef(new Float32Array(1800));
  const tween = useRef({ active: false, elapsed: 0, duration: 1.05, fromPosition: new Vector3(), toPosition: new Vector3(), fromTarget: new Vector3(), toTarget: new Vector3() });
  const focus = useObservatory((s) => s.focus);
  const reducedMotion = useObservatory((s) => s.reducedMotion);
  const selected = useObservatory((s) => s.selectedId);
  const assetStatus = useAssets((s) => s.status);
  const internal = useObservatory((s) => s.layers.internal);
  const isolated = useObservatory((s) => s.isolated);
  const selectionRef = useRef<Mesh>(null);
  const raycaster = useMemo(() => new Raycaster(), []);
  const pointer = useMemo(() => new Vector2(), []);
  const orbitLimits = useRef({ min: new Vector3(-.4, .4, -.3), max: new Vector3(.4, 1.75, .3) });

  useEffect(() => {
    const limits = orbitLimits.current;
    limits.min.set(-.4, .4, -.3); limits.max.set(.4, 1.75, .3);
    if (assetRuntime.lease) {
      const envelope = new Box3();
      scene.traverse((object) => { if (object instanceof Mesh && object.userData.anatomyId) envelope.union(new Box3().setFromObject(object, true)); });
      if (!envelope.isEmpty()) { limits.min.copy(envelope.min).addScalar(-.18); limits.max.copy(envelope.max).addScalar(.18); }
      if (controls.current) controls.current.maxDistance = Math.max(6.8, envelope.getSize(new Vector3()).length() * 3);
    } else if (controls.current) controls.current.maxDistance = 6.8;
  }, [assetStatus, scene]);

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;
    // Flush residual orbit inertia before a new focus so reset is deterministic.
    if (controls.current) {
      controls.current.enableDamping = false;
      controls.current.update();
      controls.current.enableDamping = true;
    }
    let bounds = focus.target !== 'overview' && focus.target !== 'posterior' ? bindingBounds(focus.target) : null;
    if ((focus.target === 'overview' || focus.target === 'posterior') && assetRuntime.lease) {
      const envelope = new Box3();
      scene.traverse((object) => {
        if (object instanceof Mesh && ['human.surface', 'human.head'].includes(object.userData.anatomyId as string)) envelope.union(new Box3().setFromObject(object, true));
      });
      if (!envelope.isEmpty()) bounds = envelope;
    }
    const volume = bounds ? { center: bounds.getCenter(new Vector3()).toArray(), size: bounds.getSize(new Vector3()).toArray() } : undefined;
    const pose = cameraPose(focus.target, size.width / size.height, 36, volume);
    const next = tween.current;
    next.fromPosition.copy(camera.position);
    next.toPosition.set(...pose.position);
    next.fromTarget.copy(controls.current?.target ?? new Vector3(0, 0.94, 0));
    next.toTarget.set(...pose.target);
    next.elapsed = 0;
    next.duration = Math.max(.48, Math.min(1.15, next.fromPosition.distanceTo(next.toPosition) * .23 + .45));
    next.active = !reducedMotion && ready.current;
    if (!next.active) {
      camera.position.copy(next.toPosition);
      controls.current?.target.copy(next.toTarget);
      camera.lookAt(next.toTarget);
      controls.current?.update();
    }
  }, [focus, reducedMotion, camera, scene, size.width, size.height]);

  useEffect(() => {
    const marker = selectionRef.current;
    if (!marker) return;
    const anchor = bindingAnchor(selected);
    if (anchor) marker.position.copy(anchor);
    else marker.position.set(...ANCHORS[selected]);
  }, [selected, assetStatus]);

  useEffect(() => {
    const canvas = gl.domElement;
    const contextLost = (event: Event) => { event.preventDefault(); onError('O contexto WebGL foi interrompido. O índice e as evidências continuam disponíveis.'); };
    canvas.addEventListener('webglcontextlost', contextLost);
    return () => canvas.removeEventListener('webglcontextlost', contextLost);
  }, [gl, onError]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const count = Math.min(frameCursor.current, frameDurations.current.length);
      if (count < 2) return;
      const fps = Array.from(frameDurations.current.subarray(0, count), (d) => 1 / Math.max(d, 0.001)).sort((a, b) => a - b);
      const context = gl.getContext();
      if (context.isContextLost()) return;
      const extension = context.getExtension('WEBGL_debug_renderer_info');
      const renderer = extension ? String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : String(context.getParameter(context.RENDERER));
      const metrics: SceneMetrics = { fpsP50: Math.round(fps[Math.floor(count * 0.5)] ?? 0), fpsP10: Math.round(fps[Math.floor(count * 0.1)] ?? 0),
        calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, samples: count, renderer };
      useObservatory.getState().setMetrics(metrics);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [gl]);

  useEffect(() => {
    const project = (id: AnatomyId) => {
      const point = (bindingAnchor(id) ?? new Vector3(...ANCHORS[id])).project(camera);
      return { x: point.x, y: point.y, z: point.z };
    };
    const api: AtlasSceneApi = {
      project,
      raycast: (x, y) => {
        pointer.set(x, y); raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = hits.find((entry) => entry.object.visible && entry.object.userData.anatomyId &&
          !(useObservatory.getState().surfaceOpacity < .32 && entry.object.userData.layer === 'surface' && hits.some((other) => other.object.visible && other.object.userData.anatomyId && other.object.userData.layer !== 'surface')));
        return hit?.object.userData.anatomyId as AnatomyId ?? null;
      },
      snapshot: () => {
        const state = useObservatory.getState();
        const visibleNodes: string[] = [];
        const nodes: { name: string; anatomyId: AnatomyId; visible: boolean; vertices: number; bounds: number[][] }[] = [];
        const bodyBounds = new Box3();
        scene.traverse((object) => {
          if (object instanceof Mesh && object.userData.anatomyId) {
            const bounds = new Box3().setFromObject(object);
            const id = object.userData.anatomyId as AnatomyId;
            nodes.push({ name: object.name, anatomyId: id, visible: object.visible, vertices: object.geometry.attributes.position.count,
              bounds: [bounds.min.toArray(), bounds.max.toArray()] });
            if (object.visible) visibleNodes.push(object.name);
            if (id === 'human.surface' || id === 'human.head') bodyBounds.union(bounds);
          }
        });
        let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
        for (const x of [bodyBounds.min.x, bodyBounds.max.x]) for (const y of [bodyBounds.min.y, bodyBounds.max.y]) for (const z of [bodyBounds.min.z, bodyBounds.max.z]) {
          const p = new Vector3(x, y, z).project(camera);
          top = Math.max(top, p.y); bottom = Math.min(bottom, p.y); left = Math.min(left, p.x); right = Math.max(right, p.x);
        }
        const lease = assetRuntime.lease;
        const assetState = useAssets.getState();
        const assetNodes: Record<string, unknown>[] = [];
        const bones: Record<string, unknown>[] = [];
        lease?.scene.updateMatrixWorld(true);
        lease?.scene.traverse((object) => {
          if (object instanceof Mesh) assetNodes.push({ name: object.name, type: object.type, anatomyId: object.userData.anatomyId, visible: object.visible, worldPosition: object.getWorldPosition(new Vector3()).toArray() });
          if (object.type === 'Bone') bones.push({ name: object.name, worldPosition: object.getWorldPosition(new Vector3()).toArray(), quaternion: object.quaternion.toArray() });
        });
        const assetBounds = lease ? new Box3().setFromObject(lease.scene, true) : null;
        const clip = lease?.animations.find((item) => item.name === assetState.clip);
        const assets = { requestedId: assetState.requestedId, activeId: lease?.assetId ?? 'proxy', status: assetState.status,
          bindings: lease ? [...lease.bindings].map(([anatomyId, objects]) => { let meshCount = 0; objects.forEach((object) => object.traverse((node) => { if (node instanceof Mesh) meshCount++; })); return { anatomyId, nodeNames: objects.map((object) => object.name), meshCount }; }) : [],
          nodes: assetNodes, bounds: assetBounds ? { min: assetBounds.min.toArray(), max: assetBounds.max.toArray(), size: assetBounds.getSize(new Vector3()).toArray() } : null,
          sockets: lease ? [...lease.sockets].map(([id, node]) => ({ id, nodeName: node.name, worldPosition: node.getWorldPosition(new Vector3()).toArray() })) : [],
          animations: lease?.animations.map((item) => ({ name: item.name, duration: item.duration })) ?? [],
          animation: { clip: assetState.clip, time: assetRuntime.animationTime, playing: !!clip && assetState.playing && !state.reducedMotion }, bones, cache: getAssetCacheStats() };
        return { ready: ready.current, selectedId: state.selectedId, lastHit: lastHit.current, layers: state.layers, assets,
          visibleNodes, nodes, surfaceOpacity: state.surfaceOpacity, paused: state.paused, reducedMotion: state.reducedMotion,
          scanT: scanProgress.current, scanRevision: state.scanRevision, camera: { position: camera.position.toArray(), target: controls.current?.target.toArray(), moving: tween.current.active },
          bounds: { min: bodyBounds.min.toArray(), max: bodyBounds.max.toArray(), projected: { top, bottom, left, right }, heightFraction: (top - bottom) / 2 },
          metrics: state.metrics, frames: frameCount.current, viewport: { width: size.width, height: size.height, dpr: gl.getPixelRatio() }, modelStatus: 'conceptual_proxy' };
      },
    };
    window.__ATLAS_SCENE__ = api;
    return () => { if (window.__ATLAS_SCENE__ === api) delete window.__ATLAS_SCENE__; };
  }, [camera, gl, pointer, raycaster, scene, size.width, size.height]);

  useFrame((_frameState, delta) => {
    const state = useObservatory.getState();
    const next = tween.current;
    if (next.active && controls.current) {
      next.elapsed += Math.min(delta, 0.05);
      const amount = smoothFocus(next.elapsed / next.duration);
      camera.position.lerpVectors(next.fromPosition, next.toPosition, amount);
      controls.current.target.lerpVectors(next.fromTarget, next.toTarget, amount);
      controls.current.update();
      if (amount === 1) next.active = false;
    }
    if (controls.current && !next.active) {
      controls.current.target.clamp(orbitLimits.current.min, orbitLimits.current.max);
    }
    if (lastRevision.current !== state.scanRevision) {
      scanProgress.current = state.scanT;
      lastRevision.current = state.scanRevision;
    }
    if (!state.paused && !state.reducedMotion && state.mode === 'body' && !document.hidden) scanProgress.current = (scanProgress.current + Math.min(delta, 0.05) / 24) % 1;
    scanClock.progress = scanProgress.current;
    if (scan.current) scan.current.position.y = 0.1 + scanProgress.current * 1.66;
    if (selectionRef.current) {
      // A restrained fixed locator, not an invented organ pulse.
      selectionRef.current.lookAt(camera.position);
    }
    frameCount.current += 1;
    frameDurations.current[frameCursor.current % frameDurations.current.length] = delta;
    frameCursor.current += 1;
    if (!ready.current && frameCount.current > 1) { ready.current = true; onReady(); }
  });

  return <>
    <color attach="background" args={['#08121b']} />
    <fog attach="fog" args={['#08121b', 6, 11]} />
    <ambientLight intensity={0.7} color="#b6c8d3" />
    <hemisphereLight args={['#bedce4', '#253947', 1.1]} />
    <directionalLight position={[2.5, 4, 3.4]} intensity={3.1} color="#e9eee6" castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-1.3} shadow-camera-right={1.3} shadow-camera-top={2.2} shadow-camera-bottom={-0.4} shadow-bias={-0.0007} />
    <directionalLight position={[-2.5, 1.9, -2.6]} intensity={3.4} color="#77abbc" />
    <pointLight position={[0, 0.95, -0.42]} intensity={0.055} distance={0.8} color="#c73c57" />
    <IntegratedAssets onHit={(id) => { lastHit.current = id; }} />

    <mesh name="CONCEPTUAL_SELECTION_LOCATOR" ref={selectionRef} renderOrder={5}
      visible={!isolated && (selected !== 'ghoul.kakuhou.rinkaku' || internal)}>
      <ringGeometry args={[selected === 'ghoul.kakuhou.rinkaku' ? 0.083 : 0.035, selected === 'ghoul.kakuhou.rinkaku' ? 0.086 : 0.037, 64]} />
      <meshBasicMaterial color={selected === 'ghoul.kakuhou.rinkaku' ? '#e27386' : '#86c9c4'} transparent opacity={0.85} depthTest={false} toneMapped={false} side={DoubleSide} />
    </mesh>

    <group ref={scan} name="DEMONSTRATION_SCAN" userData={{ role: 'visual_inspection_only' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.48, 1]}>
        <ringGeometry args={[0.414, 0.418, 96]} />
        <meshBasicMaterial color="#68b9b5" transparent opacity={0.43} toneMapped={false} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[-0.44, 0, 0]}><boxGeometry args={[0.021, 0.002, 0.018]} /><meshBasicMaterial color="#9fddcf" toneMapped={false} /></mesh>
      <mesh position={[0.44, 0, 0]}><boxGeometry args={[0.021, 0.002, 0.018]} /><meshBasicMaterial color="#9fddcf" toneMapped={false} /></mesh>
    </group>

    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow name="OBSERVATION_FLOOR">
      <planeGeometry args={[200, 200]} /><meshStandardMaterial color="#0a1822" roughness={0.96} metalness={0.02} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
      <circleGeometry args={[0.52, 96]} /><meshStandardMaterial color="#142833" roughness={0.93} metalness={0.05} />
    </mesh>
    {[0.54, 0.72, 1.02].map((radius, index) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <ringGeometry args={[radius, radius + 0.0015, 96]} /><meshBasicMaterial color={index === 0 ? '#427479' : '#203e4c'} transparent opacity={0.6 - index * 0.12} />
    </mesh>)}
    <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.09} rotateSpeed={0.6} zoomSpeed={0.72}
      minDistance={0.42} maxDistance={6.8} minPolarAngle={0.45} maxPolarAngle={1.87} enablePan panSpeed={0.45}
      target={[0, 0.94, 0]} onStart={() => { tween.current.active = false; }} />
  </>;
}

export default function ObservatoryScene(props: SceneProps) {
  return <Canvas className="atlas-canvas" shadows={{ type: PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [1.2, 1, 4], fov: 36, near: 0.025, far: 40 }}
    gl={(defaults) => {
      try { return new WebGLRenderer({ ...defaults, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); }
      catch (error) {
        props.onError('Não foi possível criar o contexto WebGL. O índice e as evidências continuam disponíveis.');
        throw error;
      }
    }}
    onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 0.91; gl.setClearColor(new Color('#08121b')); }}
    fallback={<div role="status">WebGL indisponível; abra as estruturas pelo índice anatômico.</div>}>
    <Suspense fallback={null}><InspectableScene {...props} /></Suspense>
  </Canvas>;
}
