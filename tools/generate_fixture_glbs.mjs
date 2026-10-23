import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Original synthetic pipeline fixtures. These deliberately are NOT anatomical models.
const directory = fileURLToPath(new URL('../public/assets/fixtures/', import.meta.url));
await mkdir(directory, { recursive: true });

function build(rigged) {
  const arrays = []; const bufferViews = []; const accessors = []; let offset = 0;
  function accessor(array, type, componentType, min, max) {
    const padding = (4 - offset % 4) % 4;
    if (padding) { arrays.push(Buffer.alloc(padding)); offset += padding; }
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length });
    arrays.push(bytes); offset += bytes.length;
    const width = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    accessors.push({ bufferView: bufferViews.length - 1, componentType, count: array.length / width, type, ...(min ? { min, max } : {}) });
    return accessors.length - 1;
  }
  // An octahedron is visibly unlike the G1 mannequin's capsule forms.
  const p = [0, 1, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, -1, 0];
  const indices = [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 1];
  const position = accessor(new Float32Array(p), 'VEC3', 5126, [-1, -1, -1], [1, 1, 1]);
  const normal = accessor(new Float32Array(p), 'VEC3', 5126);
  const index = accessor(new Uint16Array(indices), 'SCALAR', 5123);
  const materials = [
    { name: 'TEST_MINERAL', pbrMetallicRoughness: { baseColorFactor: [.55, .72, .7, 1], roughnessFactor: .68, metallicFactor: 0 } },
    { name: 'TEST_THORAX', pbrMetallicRoughness: { baseColorFactor: [.3, .6, .65, 1], roughnessFactor: .58, metallicFactor: 0 } },
    { name: 'TEST_KAKUHOU', pbrMetallicRoughness: { baseColorFactor: [.72, .16, .27, 1], roughnessFactor: .52, metallicFactor: 0 } },
  ];
  const primitive = (material) => ({ attributes: { POSITION: position, NORMAL: normal }, indices: index, material });
  const meshes = [{ name: 'FacetHead', primitives: [primitive(0)] }, { name: 'FacetChest', primitives: [primitive(1)] }, { name: 'FacetKakuhou', primitives: [primitive(2)] }];
  const extras = (atlasId) => ({ atlasId, representation: 'synthetic_fixture' });
  const nodes = [
    { name: rigged ? 'RigFixtureOrigin' : 'StaticFixtureOrigin', children: [1], extras: { ...extras('fixture.root'), metersPerUnit: 1, upAxis: 'Y', forwardAxis: '+Z' } },
    { name: 'Assembly', children: [2, 3, 4] },
    { name: 'CranialFacet', mesh: 0, translation: [0, 1.705, 0], scale: [.12, .145, .12], extras: extras('fixture.head') },
    { name: 'ChestAssembly', children: [5, 6], translation: [0, 1.3, 0], extras: extras('fixture.thorax') },
    { name: 'LumbarAssembly', translation: [0, .976, -.112], children: [7, 8], extras: extras('fixture.kakuhou') },
    { name: 'LeftFacet', mesh: 1, translation: [-.085, 0, 0], scale: [.1, .2, .09] },
    { name: 'RightFacet', mesh: 1, translation: [.085, 0, 0], scale: [.1, .2, .09] },
    { name: 'LumbarFacet', mesh: 2, scale: [.105, .075, .075] },
    { name: 'ConnectionSocket', translation: [0, 0, -.08], extras: extras('socket.lumbar') },
  ];
  const document = { asset: { version: '2.0', generator: 'Ghoul Atlas original fixture generator v1', copyright: 'Ghoul Atlas project — original synthetic test geometry, PROJECT_ORIGINAL' }, scene: 0, scenes: [{ name: 'SyntheticTestScene', nodes: [0] }], nodes, meshes, materials, bufferViews, accessors };
  if (rigged) {
    // Different hierarchy plus real two-joint skin and quaternion animation.
    nodes[1].children = [9, 4]; nodes.push({ name: 'UpperAssembly', children: [2, 3] });
    const vertices = [-.1, -.07, -.06, .1, -.07, -.06, -.1, .07, -.06, .1, .07, -.06, -.1, -.07, .06, .1, -.07, .06, -.1, .07, .06, .1, .07, .06];
    const joints = vertices.flatMap((_, i) => i % 3 ? [] : [vertices[i + 1] > 0 ? 1 : 0, 0, 0, 0]);
    const weights = Array.from({ length: 8 }, () => [1, 0, 0, 0]).flat();
    const faces = [0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5];
    meshes[2] = { name: 'WeightedTestBlock', primitives: [{ attributes: {
      POSITION: accessor(new Float32Array(vertices), 'VEC3', 5126, [-.1, -.07, -.06], [.1, .07, .06]),
      JOINTS_0: accessor(new Uint16Array(joints), 'VEC4', 5123),
      WEIGHTS_0: accessor(new Float32Array(weights), 'VEC4', 5126),
    }, indices: accessor(new Uint16Array(faces), 'SCALAR', 5123), material: 2 }] };
    nodes[7] = { name: 'WeightedLumbarFacet', mesh: 2, skin: 0 };
    nodes[4].children.push(10);
    nodes.push({ name: 'TestRootBone', children: [11] }, { name: 'TestTipBone', translation: [0, .07, 0], children: [12] }, { name: 'RigConnectionSocket', translation: [.04, .02, -.08], extras: extras('socket.rig-tip') });
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const inverseTip = [...identity]; inverseTip[13] = -.07;
    document.skins = [{ name: 'FixtureTwoBoneRig', inverseBindMatrices: accessor(new Float32Array([...identity, ...inverseTip]), 'MAT4', 5126), joints: [10, 11], skeleton: 10 }];
    const angle = .24;
    document.animations = [{ name: 'fixture_sway', samplers: [{ input: accessor(new Float32Array([0, .5, 1]), 'SCALAR', 5126, [0], [1]), output: accessor(new Float32Array([0, 0, 0, 1, 0, 0, Math.sin(angle / 2), Math.cos(angle / 2), 0, 0, 0, 1]), 'VEC4', 5126), interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 11, path: 'rotation' } }] }];
  }
  document.buffers = [{ byteLength: offset }];
  const json = Buffer.from(JSON.stringify(document)); const jsonLength = Math.ceil(json.length / 4) * 4;
  const binary = Buffer.concat(arrays); const binaryLength = Math.ceil(binary.length / 4) * 4;
  const buffer = Buffer.alloc(12 + 8 + jsonLength + 8 + binaryLength);
  [0x46546c67, 2, buffer.length, jsonLength, 0x4e4f534a].forEach((n, i) => buffer.writeUInt32LE(n, i * 4));
  buffer.fill(0x20, 20, 20 + jsonLength); json.copy(buffer, 20);
  buffer.writeUInt32LE(binaryLength, 20 + jsonLength); buffer.writeUInt32LE(0x004e4942, 24 + jsonLength); binary.copy(buffer, 28 + jsonLength);
  return buffer;
}
const records = [];
for (const rigged of [false, true]) {
  const filename = `atlas-${rigged ? 'rigged' : 'static'}-v1.glb`;
  const buffer = build(rigged);
  await writeFile(`${directory}/${filename}`, buffer);
  records.push({ filename, byteLength: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') });
}
await writeFile(`${directory}/manifest.json`, JSON.stringify({ version: 1, authorship: 'original', license: 'PROJECT_ORIGINAL', generator: 'tools/generate_fixture_glbs.mjs', disclosure: 'PROXY / CONCEPTUAL MODEL — synthetic pipeline fixtures, not validated anatomy', assets: records }, null, 2) + '\n');
console.log(JSON.stringify(records, null, 2));
