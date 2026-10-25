export const anatomyIds = ['human.surface', 'human.head', 'human.muscular', 'human.skeletal', 'human.thorax', 'ghoul.kakuhou.rinkaku'] as const;
export type AnatomyId = (typeof anatomyIds)[number];
export type LayerId = 'surface' | 'muscular' | 'skeletal' | 'internal';
export type Mode = 'body' | 'micro' | 'compare';
export type FocusTarget = AnatomyId | 'overview' | 'posterior' | 'rinkaku-lateral' | 'rinkaku-oblique';
export interface SceneProps {
  onReady: () => void;
  onError: (message: string) => void;
}
export interface SceneMetrics {
  fpsP50: number;
  fpsP10: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  samples: number;
  renderer: string;
}
