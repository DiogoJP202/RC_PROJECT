import { AnimationMixer, Box3, Vector3 } from 'three';
import type { AnimationClip, Material, Mesh, Object3D, Skeleton, SkinnedMesh } from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import type { AnatomyId } from '../../app/types';
import { getAssetDefinition } from './assetRegistry';
import type { AssetDefinition } from './assetRegistry';
import { loadGltfResource } from './gltfResource';
import type { AssetLoadOptions, GltfResource } from './gltfResource';

export interface ResolvedBindings {
  bindings: Map<AnatomyId, Object3D[]>;
  bounds: Map<AnatomyId, Box3>;
  anchors: Map<AnatomyId, Vector3>;
  sockets: Map<string, Object3D>;
}
export interface AssetLease extends ResolvedBindings {
  assetId: string;
  scene: Object3D;
  animations: AnimationClip[];
  mixer?: AnimationMixer;
  release: () => void;
}
interface Entry { key: string; assetId: string; refs: number; controller: AbortController; promise: Promise<GltfResource>; resource?: GltfResource }
const cache = new Map<string, Entry>();
const counters = { loads: 0, hits: 0, disposed: 0, acquired: 0, released: 0 };
export function getAssetCacheStats() {
  return { ...counters, entries: cache.size, inFlight: [...cache.values()].filter((entry) => !entry.resource).length,
    refCount: [...cache.values()].reduce((total, entry) => total + entry.refs, 0),
    assets: [...cache.values()].map((entry) => ({ assetId: entry.assetId, refs: entry.refs, status: entry.resource ? 'ready' : 'loading' })) };
}
function fail(message: string): never { throw new Error(`Contrato espacial GLB: ${message}.`); }

/** Metadata is semantic identity; display names and arbitrary hierarchy may change freely. */
export function resolveAssetBindings(scene: Object3D, definition: AssetDefinition): ResolvedBindings {
  scene.updateMatrixWorld(true);
  const nodes = new Map<string, Object3D>();
  scene.traverse((node) => {
    if (!node.matrixWorld.elements.every(Number.isFinite) || !node.position.toArray().every(Number.isFinite)) fail('transformação não finita');
    const id = node.userData.atlasId as unknown;
    if (id !== undefined) {
      if (typeof id !== 'string' || nodes.has(id)) fail(`identidade duplicada/inválida ${String(id)}`);
      nodes.set(id, node);
    }
    const mesh = node as Mesh;
    if (mesh.isMesh) {
      const positions = mesh.geometry.getAttribute('position');
      if (!positions || positions.count < 3 || !Array.from(positions.array).every(Number.isFinite)) fail('posição/mesh inválida');
      if ((mesh as SkinnedMesh).isSkinnedMesh) {
        const skinned = mesh as SkinnedMesh;
        const weights = mesh.geometry.getAttribute('skinWeight'); const joints = mesh.geometry.getAttribute('skinIndex');
        if (!weights || !joints || weights.count !== positions.count || joints.count !== positions.count || !skinned.skeleton?.bones.length) fail('rig sem pesos/juntas');
        for (let i = 0; i < positions.count; i++) {
          let total = 0;
          for (let j = 0; j < 4; j++) {
            const weight = weights.getComponent(i, j); const joint = joints.getComponent(i, j);
            if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(joint) || joint < 0 || joint >= skinned.skeleton.bones.length) fail('peso/junta de rig inválido');
            total += weight;
          }
          if (Math.abs(total - 1) > .01) fail('pesos de rig não normalizados');
        }
      }
    }
  });
  const spatial = definition.spatial; const root = nodes.get(spatial.rootSemanticId);
  if (!root) fail('root sem identidade estável');
  if (root.userData.metersPerUnit !== spatial.metersPerUnit || root.userData.upAxis !== spatial.upAxis || root.userData.forwardAxis !== spatial.forwardAxis) fail('unidade/orientação não coincide com registro');
  if (root.getWorldPosition(new Vector3()).distanceTo(new Vector3(...spatial.pivot)) > spatial.tolerance) fail('pivô fora do contrato');
  if (root.getWorldScale(new Vector3()).distanceTo(new Vector3(1, 1, 1)) > .0001 || Math.abs(root.quaternion.x) + Math.abs(root.quaternion.y) + Math.abs(root.quaternion.z) > .0001) fail('escala/rotação do root deve estar aplicada');
  const sceneBounds = new Box3().setFromObject(scene, true);
  if (sceneBounds.isEmpty() || ![...sceneBounds.min.toArray(), ...sceneBounds.max.toArray()].every(Number.isFinite)) fail('bounds vazios/não finitos');
  const expected = new Box3(new Vector3(...spatial.bounds.min), new Vector3(...spatial.bounds.max));
  if (sceneBounds.min.distanceTo(expected.min) > spatial.tolerance || sceneBounds.max.distanceTo(expected.max) > spatial.tolerance) fail('bounds/escala fora dos valores aprovados');
  const bindings = new Map<AnatomyId, Object3D[]>(); const bounds = new Map<AnatomyId, Box3>(); const anchors = new Map<AnatomyId, Vector3>();
  const ownership = new Map<Object3D, AnatomyId>();
  for (const [id, binding] of Object.entries(definition.bindings) as [AnatomyId, NonNullable<AssetDefinition['bindings'][AnatomyId]>][]) {
    if (!binding.semanticIds.length) fail(`binding vazio ${id}`);
    const bound = new Box3();
    const objects = binding.semanticIds.map((semanticId) => { const node = nodes.get(semanticId); if (!node) fail(`nó semântico ausente ${semanticId}`); return node; });
    objects.forEach((object) => {
      const objectBounds = new Box3().setFromObject(object, true);
      if (objectBounds.isEmpty()) fail(`binding sem geometria ${id}`);
      bound.union(objectBounds);
      object.traverse((node) => {
        if (!(node as Mesh).isMesh) return;
        if (ownership.has(node) && ownership.get(node) !== id) fail(`mesh vinculado a IDs conflitantes ${id}`);
        ownership.set(node, id);
        node.userData = { ...node.userData, anatomyId: id, assetId: definition.id, modelStatus: 'conceptual_proxy', representation: definition.representation };
      });
    });
    bindings.set(id, objects); bounds.set(id, bound);
    const anchor = binding.anchor ? new Vector3(...binding.anchor).applyMatrix4(root.matrixWorld) : bound.getCenter(new Vector3());
    if (!bound.clone().expandByScalar(spatial.tolerance).containsPoint(anchor)) fail(`anchor fora dos bounds ${id}`);
    anchors.set(id, anchor);
  }
  scene.traverse((node) => {
    if ('geometry' in node && 'material' in node && !ownership.has(node)) fail(`mesh renderizável sem binding anatômico ${node.name}`);
  });
  const sockets = new Map<string, Object3D>();
  for (const [name, socket] of Object.entries(definition.sockets)) {
    const node = nodes.get(socket.semanticId); if (!node || !bindings.has(socket.anatomyId)) fail(`socket ausente/órfão ${name}`);
    const roots = bindings.get(socket.anatomyId)!;
    let parent: Object3D | null = node; let belongs = false;
    while (parent) { if (roots.includes(parent)) belongs = true; parent = parent.parent; }
    if (!belongs) fail(`socket fora da hierarquia anatômica ${name}`);
    if (!sceneBounds.clone().expandByScalar(.1).containsPoint(node.getWorldPosition(new Vector3()))) fail(`socket fora do volume ${name}`);
    sockets.set(name, node);
  }
  return { bindings, bounds, anchors, sockets };
}

function dropReference(entry: Entry): void {
  entry.refs--;
  if (entry.refs !== 0) return;
  if (cache.get(entry.key) === entry) cache.delete(entry.key);
  entry.controller.abort();
  if (entry.resource) { entry.resource.dispose(); counters.disposed++; entry.resource = undefined; }
}
function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const abort = () => { cleanup(); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    promise.then((value) => { cleanup(); resolve(value); }, (error: unknown) => { cleanup(); reject(error); });
  });
}

/** A lease owns transforms, materials, bones, mixer. Template geometry/textures survive until the final release. */
export async function acquireAsset(id: string, options: Pick<AssetLoadOptions, 'signal' | 'baseUrl'> = {}): Promise<AssetLease> {
  const definition = getAssetDefinition(id); options.signal?.throwIfAborted();
  const key = `${definition.id}@${definition.version}:${definition.sha256}:${options.baseUrl ?? ''}`;
  let entry = cache.get(key);
  if (entry) counters.hits++;
  else {
    const controller = new AbortController();
    entry = { key, assetId: id, refs: 0, controller, promise: Promise.resolve(undefined as never) };
    const created = entry; counters.loads++;
    entry.promise = loadGltfResource(definition, { signal: controller.signal, baseUrl: options.baseUrl, expectedSha256: definition.sha256, expectedBytes: definition.byteLength, maxBytes: definition.maxBytes }).then((resource) => {
      try {
        resolveAssetBindings(resource.scene, definition);
        if (created.refs === 0 || controller.signal.aborted) { resource.dispose(); counters.disposed++; throw new DOMException('Aborted', 'AbortError'); }
        created.resource = resource; return resource;
      } catch (error) { if (created.resource !== resource) resource.dispose(); throw error; }
    }).catch((error: unknown) => { if (cache.get(key) === created) cache.delete(key); throw error; });
    cache.set(key, entry);
  }
  entry.refs++;
  const ownedEntry = entry;
  try {
    const resource = await abortable(entry.promise, options.signal); options.signal?.throwIfAborted();
    const scene = cloneSkeleton(resource.scene);
    const materials = new Set<Material>(); const skeletons = new Set<Skeleton>();
    scene.traverse((node) => {
      const mesh = node as Mesh; if (!('geometry' in node) || !('material' in node)) return;
      // Each mesh/slot can be highlighted independently even when the source shared one material.
      const copy = (material: Material) => { const clone = material.clone(); materials.add(clone); return clone; };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material);
      if ((mesh as SkinnedMesh).skeleton) skeletons.add((mesh as SkinnedMesh).skeleton);
    });
    let resolved: ResolvedBindings;
    try { resolved = resolveAssetBindings(scene, definition); }
    catch (error) { skeletons.forEach((skeleton) => skeleton.dispose()); materials.forEach((material) => material.dispose()); throw error; }
    const animations = resource.animations.map((clip) => clip.clone());
    const mixer = animations.length ? new AnimationMixer(scene) : undefined;
    let released = false; counters.acquired++;
    return { assetId: id, scene, animations, mixer, ...resolved, release: () => {
      if (released) return; released = true;
      mixer?.stopAllAction(); animations.forEach((clip) => mixer?.uncacheClip(clip)); mixer?.uncacheRoot(scene);
      skeletons.forEach((skeleton) => skeleton.dispose()); materials.forEach((material) => material.dispose());
      scene.removeFromParent(); counters.released++; dropReference(ownedEntry);
    } };
  } catch (error) { dropReference(ownedEntry); throw error; }
}
