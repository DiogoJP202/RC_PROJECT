import type { Box3, Group, Matrix4 } from 'three';
import type { RinkakuSnapshot } from '../../simulation/rinkaku';
import type { AssetLease } from '../../visuals/assets/assetCache';

/** Representation boundary. The engine supplies normalized artistic controls, never physiology. */
export interface RinkakuAdapter {
  readonly group: Group;
  apply(snapshot: RinkakuSnapshot, connection: Matrix4): void;
  /** Conservative pose envelope in world space; caller owns and reuses the output. */
  getBounds(output: Box3): Box3;
  inspect(): RinkakuAdapterInspection;
  dispose(): void;
}

export interface RinkakuAdapterInspection {
  representation: 'procedural_proxy' | 'glb';
  disclosure: string;
  disposed: boolean;
  visible: boolean;
  t: number;
  phase: RinkakuSnapshot['phase'];
  appendageCount: number;
  geometryCount: number;
  materialCount: number;
  vertexCount: number;
  triangleCount: number;
  particleCapacity: number;
  particleCount: number;
  positionHash: string;
  signature: string;
  visibleAppendages: number;
  resources: { geometries: number; materials: number; textures: number; allocatedVertices: number; allocatedParticles: number };
  root: number[];
  roots: number[][];
  tips: number[][];
  resourceIds: { geometry: string[]; material: string[] };
}

/** Future ingress contract only. No final asset, invented node name, or loader exists in G3A. */
export interface GLBRinkakuMapping {
  assetId: string;
  revision: string;
  anatomyId: 'ghoul.kakuhou.rinkaku';
  rootSemanticId: string;
  attachmentSocketSemanticId: string;
  appendages: readonly {
    semanticId: string;
    rootSemanticId: string;
    /** Explicit bone selectors from the delivered/reviewed manifest, not display-name guesses. */
    boneSemanticIds: readonly string[];
    morphs: readonly { semanticId: string; targetIndex: number; control: 'rootExposure' | 'appendageExtension' | 'appendageThickness' }[];
    clips: readonly { clipIndex: number; control: 'appendageExtension' | 'appendageMotion'; start: number; end: number }[];
  }[];
  envelope: { min: readonly [number, number, number]; max: readonly [number, number, number] };
  /** Future implementation releases its acquired G2A lease; it must not deep-dispose shared GLB resources. */
  ownership: 'g2a_asset_lease';
}

export interface FutureGLBRinkakuAdapter extends RinkakuAdapter {
  readonly mapping: GLBRinkakuMapping;
  readonly lease: AssetLease;
}

export const GLB_RINKAKU_AVAILABILITY = {
  available: false,
  reason: 'Final Rinkaku GLB, reviewed semantic mapping, deformation envelope and licensed art are not supplied in G3A.',
} as const;
