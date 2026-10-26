import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ACESFilmicToneMapping, Color, Group, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import { useObservatory } from '../../state/observatory';
import { advanceVascularClock, useVascular, vascularClock } from '../../state/vascular';
import { createVascularSample, createVesselFrame, writeVascularAt } from '../../simulation/vascular';
import { ProceduralVascularAdapter } from './ProceduralVascularAdapter';
import { vascularLifecycle } from './lifecycle';
import { constrainVascularCamera, VascularCameraRig } from './camera';
import { VascularVisibilityProbe, type VisibilityResult } from './visibility';

interface Props { onReady: () => void; onError: (message: string) => void }
interface MicroApi {
  snapshot: () => Record<string, unknown>;
  project: (id: string) => { x: number; y: number; z: number } | null;
  raycast: (x: number, y: number) => string | null;
  visibility: (id: string) => VisibilityResult;
}
declare global { interface Window { __ATLAS_MICRO__?: MicroApi } }

function VascularContents({ onReady, onError }: Props) {
  const { camera, gl, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const config = useVascular((s) => s.config);
  const reduced = useObservatory((s) => s.reducedMotion);
  const resources = useMemo(() => ({ adapter: new ProceduralVascularAdapter(useVascular.getState().config),
    frame: createVesselFrame(), sample: createVascularSample(), target: new Vector3(), point: new Vector3(),
    raycaster: new Raycaster(), pointer: new Vector2(), cameraRig: new VascularCameraRig(), visibilityProbe: new VascularVisibilityProbe(),
  }), []);
  const lifetime = useRef({ epoch: 0, registered: false });
  const lighting = useRef<Group>(null);
  const last = useRef({ seconds: NaN, selected: '', highlight: false, mode: '', revision: -1, ready: false, reset: -1 });
  const metric = useRef({ frames: 0, durations: new Float32Array(2400), cursor: 0, renderer: '', calls: 0, triangles: 0, geometries: 0, textures: 0 });
  const advanceOptions = useRef({ reducedMotion: false, hidden: false, available: true, active: true });

  useEffect(() => { resources.adapter.setConfig(config); last.current.seconds = NaN; }, [config, resources]);
  useEffect(() => {
    const owner = lifetime.current; const epoch = ++owner.epoch;
    if (!owner.registered) { owner.registered = true; vascularLifecycle.created++; vascularLifecycle.active++; }
    return () => {
      useVascular.getState().pause(); useVascular.getState().setReady(false);
      queueMicrotask(() => { if (owner.epoch === epoch) { resources.adapter.dispose(); vascularLifecycle.disposed++; vascularLifecycle.active--; } });
    };
  }, [resources]);

  useEffect(() => {
    const canvas = gl.domElement;
    const fail = (event: Event) => { event.preventDefault(); onError('O contexto WebGL da microcena foi interrompido. O contexto do corpo foi preservado.'); };
    canvas.addEventListener('webglcontextlost', fail);
    const extension = gl.getContext().getExtension('WEBGL_debug_renderer_info');
    metric.current.renderer = extension ? String(gl.getContext().getParameter(extension.UNMASKED_RENDERER_WEBGL)) : 'WebGL';
    const project = (id: string) => {
      const entity = resources.adapter.entities.find((item) => item.id === id);
      if (!entity) return null;
      writeVascularAt(vascularClock.seconds, entity, useVascular.getState().config, resources.sample);
      resources.point.set(...resources.sample.position).project(camera);
      return { x: resources.point.x, y: resources.point.y, z: resources.point.z };
    };
    const api: MicroApi = {
      project,
      visibility: (id) => resources.visibilityProbe.measure(resources.adapter, camera as PerspectiveCamera, id, size.width, size.height),
      raycast: (x, y) => {
        resources.pointer.set(x, y); resources.raycaster.setFromCamera(resources.pointer, camera);
        const hit = resources.raycaster.intersectObjects([resources.adapter.vesselMesh, resources.adapter.rbcMesh, resources.adapter.rcMesh], false)[0];
        if (!hit || hit.instanceId === undefined) return null;
        return resources.adapter.entityForInstance(hit.object === resources.adapter.rcMesh ? 'rc' : 'rbc', hit.instanceId)?.id ?? null;
      },
      snapshot: () => {
        const state = useVascular.getState();
        const m = metric.current;
        const count = Math.min(m.cursor, m.durations.length);
        const fps = Array.from(m.durations.subarray(0, count), (d) => 1 / Math.max(.001, d)).sort((a, b) => a - b);
        return { seconds: vascularClock.seconds, playing: state.playing, config: state.config, speed: state.speed,
          selectedId: state.selectedId, selectedPresent: resources.adapter.entities.some((item) => item.id === state.selectedId),
          cameraMode: state.cameraMode, highlightRC: state.highlightRC, reducedMotion: useObservatory.getState().reducedMotion,
          camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), target: controls.current?.target.toArray(), up: camera.up.toArray() },
          particles: resources.adapter.entities.map((item) => ({ id: item.id, kind: item.kind, index: item.index })),
          adapter: resources.adapter.inspect(), lifecycle: { ...vascularLifecycle }, metrics: { frames: m.frames, calls: m.calls, triangles: m.triangles,
            geometries: m.geometries, textures: m.textures, renderer: m.renderer, fpsP50: fps[Math.floor(count * .5)] ?? 0, fpsP10: fps[Math.floor(count * .1)] ?? 0 },
          viewport: { width: size.width, height: size.height, dpr: gl.getPixelRatio() },
        };
      },
    };
    window.__ATLAS_MICRO__ = api;
    return () => { canvas.removeEventListener('webglcontextlost', fail); if (window.__ATLAS_MICRO__ === api) delete window.__ATLAS_MICRO__; };
  }, [camera, gl, onError, resources, size]);

  useEffect(() => {
    const canvas = gl.domElement;
    // Keep the keyboard listener owned by this canvas. A nested controls
    // dispose/reconnect must not silently remove the parent's key subscription.
    const pan = (event: KeyboardEvent) => {
      const orbit = controls.current;
      if (!orbit?.enabled || useVascular.getState().cameraMode !== 'free' || event.ctrlKey || event.metaKey || event.altKey) return;
      const horizontal = event.code === 'ArrowLeft' || event.code === 'ArrowRight';
      if (!horizontal && event.code !== 'ArrowUp' && event.code !== 'ArrowDown') return;
      const sign = event.code === 'ArrowLeft' || event.code === 'ArrowDown' ? -1 : 1;
      const step = 2 * camera.position.distanceTo(orbit.target) * Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360) * 7 / Math.max(1, canvas.clientHeight);
      resources.point.setFromMatrixColumn(camera.matrixWorld, horizontal ? 0 : 1).multiplyScalar(sign * step);
      camera.position.add(resources.point); orbit.target.add(resources.point); orbit.update();
      event.preventDefault();
    };
    canvas.addEventListener('keydown', pan);
    return () => canvas.removeEventListener('keydown', pan);
  }, [camera, gl, resources]);

  useFrame((_state, delta) => {
    const state = useVascular.getState();
    const options = advanceOptions.current;
    options.reducedMotion = reduced; options.hidden = document.hidden;
    advanceVascularClock(Math.min(delta, .05), options);
    const seconds = vascularClock.seconds;
    const changed = last.current.seconds !== seconds || last.current.selected !== (state.selectedId ?? '') || last.current.highlight !== state.highlightRC;
    if (changed) resources.adapter.apply(seconds, state.selectedId, state.highlightRC);
    const selected = state.selectedId ? resources.adapter.getEntity(state.selectedId) : null;
    if (state.cameraMode === 'tracking' && selected) {
      writeVascularAt(seconds, selected, state.config, resources.sample);
    }
    // Releasing an automatic camera keeps its actual pose. Only an explicit
    // reframe or first mount returns Free Observation to the circuit entrance.
    const reset = !last.current.ready || last.current.reset !== state.cameraRevision;
    const discontinuity = Number.isFinite(last.current.seconds) && Math.abs(seconds - last.current.seconds) > .4;
    if (state.cameraMode !== 'free' || reset) {
      if (last.current.ready && last.current.mode === 'free' && state.cameraMode !== 'free') resources.cameraRig.seed(camera.position, controls.current?.target ?? resources.target);
      const pose = resources.cameraRig.update(delta, state.cameraMode === 'tracking' ? 'tracking' : 'flow', state.cameraMode === 'free' ? 0 : seconds,
        state.cameraMode === 'tracking' && selected ? resources.sample : null, reduced,
        !last.current.ready || discontinuity || !state.playing || state.cameraMode === 'free' && reset,
        state.cameraMode === 'tracking' ? resources.adapter.getCameraObstacles(state.selectedId) : undefined);
      camera.position.fromArray(pose.position); camera.up.fromArray(pose.up);
      resources.target.fromArray(pose.target); controls.current?.target.copy(resources.target);
      camera.lookAt(controls.current?.target ?? resources.target);
    }
    if (controls.current) {
      controls.current.enabled = state.cameraMode === 'free';
      controls.current.enableDamping = !reduced && state.cameraMode === 'free';
      controls.current.update();
    }
    constrainVascularCamera(camera.position, resources.frame);
    if (state.cameraMode === 'free' && controls.current) constrainVascularCamera(controls.current.target, resources.frame, .1);
    if (lighting.current) { lighting.current.position.copy(camera.position); lighting.current.quaternion.copy(camera.quaternion); }
    const m = metric.current; m.frames++; m.durations[m.cursor++ % m.durations.length] = delta;
    m.calls = gl.info.render.calls; m.triangles = gl.info.render.triangles;
    m.geometries = gl.info.memory.geometries; m.textures = gl.info.memory.textures;
    if (!last.current.ready) { last.current.ready = true; useVascular.getState().setReady(true); onReady(); }
    last.current.seconds = seconds; last.current.selected = state.selectedId ?? ''; last.current.highlight = state.highlightRC;
    last.current.mode = state.cameraMode; last.current.reset = state.cameraRevision;
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    // An opaque wall is a real occluder. It must not pass selection to cells on
    // the opposite side of the closed circuit merely because their ray hits exist.
    if (event.instanceId === undefined) { if (event.object === resources.adapter.vesselMesh) event.stopPropagation(); return; }
    const entity = resources.adapter.entityForInstance(event.object === resources.adapter.rcMesh ? 'rc' : 'rbc', event.instanceId);
    if (entity) { event.stopPropagation(); useVascular.getState().select(entity.id); }
  };
  return <>
    <color attach="background" args={['#130c11']} />
    <fog attach="fog" args={['#180e14', 5, 24]} />
    <ambientLight intensity={.7} color="#dcc1bc" />
    <hemisphereLight args={['#efdbd2', '#63444d', .85]} />
    <group ref={lighting}><pointLight position={[0, .6, .8]} color="#ffe6d5" intensity={3.5} distance={18} decay={2} /><pointLight position={[0, 1.2, -3]} color="#c4c9d4" intensity={3} distance={16} decay={2} /></group>
    <primitive object={resources.adapter.group} dispose={null} onClick={select} />
    <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.1} rotateSpeed={.5} zoomSpeed={.5} panSpeed={.4}
      minDistance={.3} maxDistance={7} enablePan onStart={() => { /* User orbit only; automatic cameras disable controls. */ }} />
  </>;
}

export default function VascularScene(props: Props) {
  return <Canvas camera={{ position: [8, 0, 0], fov: 58, near: .06, far: 60 }} dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    onCreated={({ gl, camera }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.setClearColor(new Color('#130c11')); gl.domElement.tabIndex = 0; gl.domElement.setAttribute('aria-label', 'Exploração vascular: arraste para orbitar, use setas para deslocar'); (camera as PerspectiveCamera).updateProjectionMatrix(); }}>
    <VascularContents {...props} />
  </Canvas>;
}
