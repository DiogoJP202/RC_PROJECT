import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Matrix4, type Scene } from 'three';
import { advanceRinkakuClock, rinkakuClock, useRinkaku } from '../../state/rinkaku';
import { useObservatory } from '../../state/observatory';
import { assetRuntime } from '../assetRuntime';
import proxyManifest from '../proxy-manifest.json';
import { ProceduralRinkakuAdapter } from './ProceduralRinkakuAdapter';
import { rinkakuRuntime } from './rinkakuRuntime';

const anchor = proxyManifest.nodes.find((node) => node.anatomyId === 'ghoul.kakuhou.rinkaku')!.anchor!;
const localConnection = new Matrix4().makeTranslation(anchor[0], anchor[1], anchor[2]);

function writeConnection(scene: Scene, output: Matrix4): 'proxy' | 'asset-socket' {
  const socket = assetRuntime.lease?.sockets.get('lumbar');
  if (socket) { socket.updateWorldMatrix(true, false); output.copy(socket.matrixWorld); return 'asset-socket'; }
  const proxy = scene.getObjectByName('KAKUHOU_RINKAKU');
  if (proxy) { proxy.updateWorldMatrix(true, false); output.copy(proxy.matrixWorld).multiply(localConnection); }
  else output.copy(localConnection);
  return 'proxy';
}

export default function RinkakuScene() {
  const { scene } = useThree();
  const canonOnly = useObservatory((s) => s.canonOnly);
  const resources = useMemo(() => {
    const adapter = new ProceduralRinkakuAdapter();
    return { adapter, socket: new Matrix4() };
  }, []);
  const lifetime = useRef({ epoch: 0 });
  const rendererResources = useRef(resources);
  const advanceOptions = useRef({ reducedMotion: false, hidden: false, bodyMode: true, available: true });
  const last = useRef({ revision: -1, assetRevision: -1, matrix: new Matrix4(), visible: true });

  useEffect(() => {
    const epoch = ++lifetime.current.epoch;
    const owner = lifetime.current;
    rinkakuRuntime.connectionSource = writeConnection(scene, resources.socket);
    rinkakuRuntime.connection.copy(resources.socket);
    resources.adapter.apply(rinkakuClock.snapshot, resources.socket);
    resources.adapter.getBounds(rinkakuRuntime.bounds);
    rinkakuRuntime.adapter = resources.adapter;
    rinkakuRuntime.mounted++;
    return () => {
      useRinkaku.getState().pause();
      if (rinkakuRuntime.adapter === resources.adapter) rinkakuRuntime.adapter = null;
      // StrictMode rehearses effects without destroying the live representation.
      queueMicrotask(() => {
        if (owner.epoch !== epoch) return;
        resources.adapter.dispose();
        rinkakuRuntime.disposed++;
      });
    };
  }, [resources, scene]);

  useEffect(() => {
    resources.adapter.setEvidenceFilter(canonOnly);
    resources.adapter.apply(rinkakuClock.snapshot, resources.socket);
    const context = useObservatory.getState();
    resources.adapter.group.visible &&= context.mode === 'body' && context.layers.internal && (!context.isolated || context.selectedId === 'ghoul.kakuhou.rinkaku');
  }, [canonOnly, resources]);

  useFrame((_state, delta) => {
    const current = rendererResources.current;
    const context = useObservatory.getState();
    const options = advanceOptions.current;
    options.reducedMotion = context.reducedMotion; options.hidden = document.hidden; options.bodyMode = context.mode === 'body';
    advanceRinkakuClock(Math.min(delta, .05), options);
    rinkakuRuntime.connectionSource = writeConnection(scene, current.socket);
    const visible = context.mode === 'body' && context.layers.internal && (!context.isolated || context.selectedId === 'ghoul.kakuhou.rinkaku');
    const changed = last.current.revision !== rinkakuClock.revision || last.current.assetRevision !== assetRuntime.revision || !last.current.matrix.equals(current.socket) || last.current.visible !== visible;
    if (!changed) return;
    last.current.revision = rinkakuClock.revision;
    last.current.assetRevision = assetRuntime.revision;
    last.current.matrix.copy(current.socket); last.current.visible = visible;
    rinkakuRuntime.connection.copy(current.socket);
    const frame = rinkakuClock.snapshot;
    current.adapter.apply(frame, current.socket);
    current.adapter.group.visible &&= visible;
    current.adapter.getBounds(rinkakuRuntime.bounds);
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    const context = useObservatory.getState();
    if (context.mode !== 'body' || !context.layers.internal || (context.isolated && context.selectedId !== 'ghoul.kakuhou.rinkaku')) return;
    for (let node: typeof event.object | null = event.object; node; node = node.parent) if (!node.visible) return;
    event.stopPropagation(); useObservatory.getState().select('ghoul.kakuhou.rinkaku', false);
  };
  return <>
    <primitive object={resources.adapter.group} dispose={null} onClick={select} />
  </>;
}
