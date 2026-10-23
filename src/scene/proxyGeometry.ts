import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Matrix4, Quaternion, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AnatomyId } from '../app/types';
import proxyManifest from './proxy-manifest.json';

type V3 = [number, number, number];
type Section = [y: number, width: number, front: number, back: number];
const UP = new Vector3(0, 1, 0);

function ellipsoid(center: V3, scale: V3, rotationZ = 0): BufferGeometry {
  const geometry = new SphereGeometry(1, 28, 20);
  geometry.scale(...scale).rotateZ(rotationZ).translate(...center);
  return geometry;
}

/** Sculpted profiles, no imported geometry. All proportions are conceptual. */
function profile(sections: Section[], segments = 56, rings = 44): BufferGeometry {
  const widths = new CatmullRomCurve3(sections.map(([y, w, f]) => new Vector3(w, y, f)), false, 'centripetal');
  const backs = new CatmullRomCurve3(sections.map(([y, , , b]) => new Vector3(b, y, 0)), false, 'centripetal');
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rings; row++) {
    const q = widths.getPoint(row / rings);
    const rear = backs.getPoint(row / rings).x;
    for (let col = 0; col <= segments; col++) {
      const a = col / segments * Math.PI * 2;
      const sin = Math.sin(a);
      const cos = Math.cos(a);
      // Subtle sternum/linea-alba relief and paired shoulder/chest volumes.
      const relief = cos > 0 ? 1 + 0.065 * Math.cos(sin * 8) * Math.exp(-(((q.y - 1.37) / 0.14) ** 2)) : 1;
      positions.push(sin * q.x, q.y, cos * (cos >= 0 ? q.z * relief : rear));
      if (row < rings && col < segments) {
        const i = row * (segments + 1) + col;
        indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1);
      }
    }
  }
  const bottomCenter = positions.length / 3;
  positions.push(0, sections[0][0], 0);
  const topCenter = positions.length / 3;
  positions.push(0, sections[sections.length - 1][0], 0);
  for (let col = 0; col < segments; col++) {
    indices.push(bottomCenter, col + 1, col);
    const top = rings * (segments + 1) + col;
    indices.push(topCenter, top, top + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function limb(start: V3, end: V3, widths: [number, number, number], depth = 0.92): BufferGeometry {
  const a = new Vector3(...start), b = new Vector3(...end);
  const length = a.distanceTo(b);
  const geometry = profile([
    [-length / 2, widths[0] * 0.72, widths[0] * depth * 0.72, widths[0] * depth * 0.72],
    [-length * 0.29, widths[0], widths[0] * depth, widths[0] * depth],
    [length * 0.12, widths[1], widths[1] * depth, widths[1] * depth],
    [length * 0.43, widths[2], widths[2] * depth, widths[2] * depth],
    [length / 2, widths[2] * 0.75, widths[2] * depth * 0.75, widths[2] * depth * 0.75],
  ], 28, 24);
  const direction = b.clone().sub(a).normalize();
  const matrix = new Matrix4().compose(a.add(b).multiplyScalar(0.5), new Quaternion().setFromUnitVectors(UP, direction), new Vector3(1, 1, 1));
  geometry.applyMatrix4(matrix);
  return geometry;
}

function tube(points: V3[], radius: number, segments = 28): BufferGeometry {
  return new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), segments, radius, 8, false);
}

function merged(parts: BufferGeometry[]): BufferGeometry {
  const nonIndexed = parts.map((p) => p.index ? p.toNonIndexed() : p);
  // Sphere/tube UV attributes are irrelevant to these original untextured materials.
  nonIndexed.forEach((p) => { p.deleteAttribute('uv'); p.deleteAttribute('uv1'); });
  const result = mergeGeometries(nonIndexed, false);
  if (!result) throw new Error('Não foi possível compor a geometria procedural do proxy.');
  result.computeBoundingBox();
  result.computeBoundingSphere();
  new Set([...parts, ...nonIndexed]).forEach((p) => { if (p !== result) p.dispose(); });
  return result;
}

function surface(): BufferGeometry {
  const parts: BufferGeometry[] = [profile([
    [0.82, 0.025, 0.04, 0.04], [0.9, 0.145, 0.096, 0.103], [1.01, 0.164, 0.106, 0.1],
    [1.115, 0.132, 0.086, 0.081], [1.24, 0.155, 0.101, 0.089],
    [1.37, 0.192, 0.115, 0.093], [1.45, 0.218, 0.091, 0.081],
    [1.49, 0.205, 0.067, 0.069], [1.52, 0.095, 0.054, 0.055],
    [1.58, 0.051, 0.053, 0.052], [1.62, 0.044, 0.047, 0.047],
  ])];
  for (const side of [-1, 1]) {
    parts.push(
      limb([side * 0.198, 1.466, 0], [side * 0.302, 1.12, 0.007], [0.071, 0.051, 0.037]),
      limb([side * 0.297, 1.159, 0.008], [side * 0.356, 0.875, 0.055], [0.046, 0.041, 0.024], 0.84),
      ellipsoid([side * 0.363, 0.85, 0.058], [0.035, 0.06, 0.019], side * 0.16),
      ellipsoid([side * 0.334, 0.86, 0.077], [0.014, 0.035, 0.013], side * -0.5),
      limb([side * 0.093, 0.965, 0], [side * 0.111, 0.489, 0.014], [0.087, 0.079, 0.045], 1.09),
      limb([side * 0.112, 0.497, 0.012], [side * 0.122, 0.084, 0.006], [0.057, 0.053, 0.029]),
      ellipsoid([side * 0.123, 0.063, 0.073], [0.046, 0.043, 0.108]),
    );
    for (let digit = 0; digit < 4; digit++) {
      const x = side * (0.343 + digit * 0.014);
      parts.push(limb([x, 0.839, 0.058], [x + side * 0.009, 0.769 + Math.abs(digit - 1.3) * 0.008, 0.064], [0.008, 0.007, 0.005], 0.8));
    }
  }
  return merged(parts);
}

function head(): BufferGeometry {
  const skull = profile([
    [1.576, 0.023, 0.032, 0.037], [1.6, 0.047, 0.066, 0.053], [1.645, 0.069, 0.073, 0.068],
    [1.7, 0.078, 0.075, 0.081], [1.765, 0.079, 0.076, 0.083], [1.82, 0.06, 0.058, 0.064],
    [1.843, 0.026, 0.024, 0.029], [1.85, 0.002, 0.003, 0.003],
  ], 64, 56);
  const vertices = skull.getAttribute('position');
  const gaussian = (n: number) => Math.exp(-(n * n));
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    if (z <= 0) continue;
    const eyes = gaussian((Math.abs(x) - 0.033) / 0.015) * gaussian((y - 1.724) / 0.013) * 0.008;
    const brow = gaussian((Math.abs(x) - 0.031) / 0.022) * gaussian((y - 1.744) / 0.01) * 0.004;
    const bridge = gaussian(x / 0.011) * gaussian((y - 1.704) / 0.026) * 0.019;
    vertices.setZ(i, z + (bridge + brow - eyes) * Math.min(1, z / 0.06));
  }
  skull.computeVertexNormals();
  const parts = [skull,
  ellipsoid([-0.078, 1.7, -0.004], [0.009, 0.025, 0.012]), ellipsoid([0.078, 1.7, -0.004], [0.009, 0.025, 0.012])];
  return merged(parts);
}

function muscles(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    parts.push(ellipsoid([side * 0.091, 1.372, 0.086], [0.094, 0.065, 0.032], side * 0.12),
      ellipsoid([side * 0.193, 1.442, 0.001], [0.06, 0.069, 0.061], side * 0.1),
      limb([side * 0.226, 1.407, 0.014], [side * 0.286, 1.19, 0.018], [0.046, 0.046, 0.025], 0.81),
      limb([side * 0.304, 1.122, 0.029], [side * 0.342, 0.927, 0.049], [0.032, 0.028, 0.015], 0.8),
      limb([side * 0.088, 0.94, 0.021], [side * 0.107, 0.535, 0.029], [0.067, 0.061, 0.029], 0.88),
      limb([side * 0.109, 0.446, -0.01], [side * 0.121, 0.139, 0.003], [0.042, 0.036, 0.02]),
      ellipsoid([side * 0.097, 1.28, -0.077], [0.073, 0.16, 0.029], side * -0.17),
      ellipsoid([side * 0.086, 0.975, -0.079], [0.073, 0.075, 0.031]),
    );
    for (let row = 0; row < 4; row++) parts.push(ellipsoid([side * 0.037, 1.28 - row * 0.06, 0.085], [0.032, 0.027, 0.017]));
    for (let row = 0; row < 4; row++) parts.push(ellipsoid([side * (0.114 + row * 0.002), 1.27 - row * 0.055, 0.061], [0.024, 0.044, 0.016], side * -0.6));
  }
  return merged(parts);
}

function skeleton(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 19; i++) parts.push(ellipsoid([0, 0.945 + i * 0.029, -0.052], [0.021, 0.012, 0.021]));
  parts.push(limb([0, 1.41, 0.064], [0, 1.22, 0.072], [0.011, 0.014, 0.009]));
  for (const side of [-1, 1]) {
    for (let rib = 0; rib < 8; rib++) {
      const y = 1.42 - rib * 0.029, w = 0.105 + Math.sin(rib / 7 * Math.PI) * 0.038;
      parts.push(tube([[0, y, -0.05], [side * w * 0.75, y + 0.008, -0.065], [side * w, y - 0.005, 0.004], [side * w * 0.65, y - 0.024, 0.077], [side * 0.012, y - 0.026, 0.077]], 0.006));
    }
    parts.push(tube([[0, 1.47, 0.038], [side * 0.12, 1.48, 0.042], [side * 0.203, 1.445, 0.011]], 0.01),
      tube([[side * 0.018, 1.032, -0.023], [side * 0.117, 1.035, 0.008], [side * 0.137, 0.955, 0.006], [side * 0.056, 0.888, 0.02], [side * 0.018, 0.95, -0.023]], 0.016),
      limb([side * 0.209, 1.44, 0], [side * 0.3, 1.139, 0.006], [0.017, 0.014, 0.016]),
      limb([side * 0.292, 1.13, 0.006], [side * 0.345, 0.888, 0.044], [0.009, 0.008, 0.008]),
      limb([side * 0.31, 1.13, 0.006], [side * 0.361, 0.888, 0.047], [0.009, 0.008, 0.008]),
      limb([side * 0.096, 0.935, 0], [side * 0.111, 0.486, 0.016], [0.022, 0.016, 0.021]),
      limb([side * 0.106, 0.474, 0.016], [side * 0.116, 0.087, 0.007], [0.017, 0.013, 0.012]),
      limb([side * 0.128, 0.474, 0.009], [side * 0.135, 0.087, 0.007], [0.007, 0.006, 0.006]),
      ellipsoid([side * 0.111, 0.481, 0.038], [0.023, 0.026, 0.012]),
      ellipsoid([side * 0.123, 0.063, 0.073], [0.033, 0.024, 0.083]),
    );
  }
  parts.push(ellipsoid([0, 1.726, 0], [0.069, 0.106, 0.07]));
  return merged(parts);
}

function thorax(): BufferGeometry {
  return merged([
    ellipsoid([-0.076, 1.315, 0.006], [0.057, 0.105, 0.057], -0.08),
    ellipsoid([0.076, 1.315, 0.006], [0.057, 0.105, 0.057], 0.08),
    ellipsoid([0.017, 1.258, 0.043], [0.043, 0.06, 0.038], -0.32),
    tube([[0, 1.49, 0.008], [0, 1.42, 0.008], [-0.04, 1.37, 0.008]], 0.012),
    tube([[0, 1.42, 0.008], [0.04, 1.37, 0.008]], 0.01),
  ]);
}

function kakuhou(): BufferGeometry {
  // A single invented lobulated sculpture: no named histology, ducts or precise vertebral level.
  const parts: BufferGeometry[] = [ellipsoid([0, 0.976, -0.112], [0.065, 0.058, 0.035])];
  for (const side of [-1, 1]) parts.push(ellipsoid([side * 0.055, 0.979, -0.106], [0.047, 0.044, 0.031], side * 0.4),
    ellipsoid([side * 0.038, 0.948, -0.112], [0.033, 0.03, 0.026], side * -0.4));
  return merged(parts);
}

/** Stable semantic IDs are preserved when ART-02/03 replace these six authored proxies. */
export function createProxyGeometries(): Record<AnatomyId, BufferGeometry> {
  const result = { 'human.surface': surface(), 'human.head': head(), 'human.muscular': muscles(),
    'human.skeletal': skeleton(), 'human.thorax': thorax(), 'ghoul.kakuhou.rinkaku': kakuhou() };
  for (const node of proxyManifest.nodes) result[node.anatomyId as AnatomyId].userData = { anatomyId: node.anatomyId, nodeName: node.nodeName, modelStatus: 'conceptual_proxy' };
  return result;
}
