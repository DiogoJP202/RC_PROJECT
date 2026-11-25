import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ACESFilmicToneMapping, PerspectiveCamera, Vector3, type Mesh } from 'three';
import type { CellularModel } from '../../simulation/cellular';
import { InspectionRendererAdapter, type InspectionCut, type InspectionHit } from './InspectionRendererAdapter';

export type InspectionViewCommand = 'oblique' | 'front' | 'side' | 'nearer' | 'farther';

interface Props {
  subject: CellularModel;
  reference: CellularModel | null;
  paired: boolean;
  showReference: boolean;
  cut: InspectionCut | null;
  command: { value: InspectionViewCommand; revision: number };
  reduced: boolean;
  select: (hit: InspectionHit) => void;
  ready: () => void;
  fail: (message: string) => void;
}

interface InspectionFrame {
  frames: number;
  camera: number[];
  target: number[] | undefined;
  draws: number;
  triangles: number;
  renderer: string;
  surface: ReturnType<InspectionRendererAdapter['inspect']> | null;
}
declare global { interface Window { __ATLAS_CELL__?: () => InspectionFrame } }

const views = { oblique: [1.6, .85, 4.55], front: [0, 0, 4.9], side: [4.9, 0, 0] } as const;
const frameCamera = { position: [...views.oblique] as [number, number, number], near: .06, far: 25, fov: 36 };

function Contents({ subject, reference, paired, showReference, cut, command, reduced, select, ready, fail }: Props) {
  const { camera, gl, invalidate } = useThree();
  const owner = useRef<InspectionRendererAdapter | null>(null);
  const attach = useRef<import('three').Group>(null);
  const orbit = useRef<OrbitControlsImpl | null>(null);
  const models = useRef<{ primary: Mesh; reference: Mesh | null } | null>(null);
  const previousView = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  const readySent = useRef(false);
  const frames = useRef(0);
  const right = useMemo(() => new Vector3(), []);

  useLayoutEffect(() => {
    const adapter = new InspectionRendererAdapter();
    const container = attach.current;
    owner.current = adapter;
    container?.add(adapter.group);
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      fail('O contexto WebGL da inspeção foi interrompido.');
    };
    canvas.addEventListener('webglcontextlost', lost);
    const frame = (): InspectionFrame => ({
      frames: frames.current, camera: camera.position.toArray(), target: orbit.current?.target.toArray(),
      draws: gl.info.render.calls, triangles: gl.info.render.triangles,
      renderer: gl.getContext().getExtension('WEBGL_debug_renderer_info')
        ? gl.getContext().getParameter(gl.getContext().getExtension('WEBGL_debug_renderer_info')!.UNMASKED_RENDERER_WEBGL)
        : 'WebGL',
      surface: owner.current?.inspect() ?? null,
    });
    window.__ATLAS_CELL__ = frame;
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      if (window.__ATLAS_CELL__ === frame) delete window.__ATLAS_CELL__;
      container?.remove(adapter.group);
      adapter.dispose();
      owner.current = null;
      readySent.current = false;
    };
  }, [camera, fail, gl]);

  useLayoutEffect(() => {
    const controls = orbit.current;
    if (controls && reference && !previousView.current) previousView.current = { position: camera.position.clone(), target: controls.target.clone() };
    if (controls && !reference && previousView.current) {
      controls.enableDamping = false;
      controls.update();
      camera.position.copy(previousView.current.position);
      controls.target.copy(previousView.current.target);
      controls.update();
      controls.enableDamping = !reduced;
      previousView.current = null;
    }
    models.current = owner.current?.show(subject, reference, cut, !!reference && !paired && showReference) ?? null;
    if (models.current?.reference && !paired) models.current.reference.visible = showReference;
    invalidate();
  }, [camera, cut, invalidate, paired, reduced, reference, showReference, subject]);

  useLayoutEffect(() => {
    const controls = orbit.current;
    if (!controls) return;
    controls.enableDamping = false;
    controls.update();
    if (command.value === 'nearer' || command.value === 'farther') {
      const factor = command.value === 'nearer' ? .83 : 1.2;
      const direction = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(direction.setLength(Math.max(2.75, Math.min(8, direction.length() * factor))));
    } else {
      controls.target.set(0, 0, 0);
      camera.position.fromArray(views[command.value]);
    }
    controls.update();
    controls.enableDamping = !reduced;
    invalidate();
  }, [camera, command, invalidate, reduced]);

  useFrame(() => {
    const pair = models.current;
    if (pair?.reference && paired) {
      const eye = camera as PerspectiveCamera;
      const dist = eye.position.length();
      const width = 2 * dist * Math.tan(eye.fov * Math.PI / 360) * eye.aspect;
      right.set(1, 0, 0).applyQuaternion(eye.quaternion).multiplyScalar(width * .235);
      pair.reference.position.copy(right);
      pair.primary.position.copy(right).negate();
    }
    frames.current++;
    if (!readySent.current && pair) {
      readySent.current = true;
      ready();
    }
  });

  const pick = (event: ThreeEvent<MouseEvent>) => {
    const model = models.current;
    if (!owner.current || !model || (event.object !== model.primary && event.object !== model.reference)) return;
    event.stopPropagation();
    const hit = event.object === model.primary ? model.primary : model.reference;
    if (hit) select(owner.current.hit(hit));
  };

  return <>
    <color attach="background" args={['#211720']} />
    <ambientLight intensity={.52} color="#ebdbde" />
    <hemisphereLight args={['#eee8dc', '#61424e', 1.05]} />
    <directionalLight position={[-4, 3.8, 4.5]} color="#ffe8d1" intensity={2.05} />
    <directionalLight position={[3.5, -1, -3]} color="#e1a3a7" intensity={1.9} />
    <directionalLight position={[1.2, 2.5, 4]} color="#cde2d8" intensity={.48} />
    <group ref={attach} onClick={pick} />
    <OrbitControls ref={orbit} makeDefault minDistance={2.75} maxDistance={8} enablePan={false}
      enableDamping={!reduced} dampingFactor={.15} rotateSpeed={.66} zoomSpeed={.75} />
  </>;
}

export default function InspectionScene(props: Props) {
  return <Canvas frameloop="demand" dpr={[1, 1.5]} camera={frameCamera}
    gl={{ antialias: true, alpha: false }}
    onCreated={({ gl }) => { gl.localClippingEnabled = true; gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
    <Contents {...props} />
  </Canvas>;
}
