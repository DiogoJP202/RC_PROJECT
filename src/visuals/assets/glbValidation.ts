type JsonObject = Record<string, unknown>;
function fail(message: string): never { throw new Error(`GLB: ${message}.`); }
function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('objeto JSON inválido');
  return value as JsonObject;
}
function integer(value: unknown, min = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < min) return fail('índice/tamanho inválido');
  return value as number;
}
function array(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8192) return fail('tabela inválida/excessiva');
  return value;
}
const component = new Map<number, { bytes: number; read: (view: DataView, offset: number) => number; scale?: number }>([
  [5120, { bytes: 1, read: (view, offset) => view.getInt8(offset), scale: 127 }],
  [5121, { bytes: 1, read: (view, offset) => view.getUint8(offset), scale: 255 }],
  [5122, { bytes: 2, read: (view, offset) => view.getInt16(offset, true), scale: 32767 }],
  [5123, { bytes: 2, read: (view, offset) => view.getUint16(offset, true), scale: 65535 }],
  [5125, { bytes: 4, read: (view, offset) => view.getUint32(offset, true) }],
  [5126, { bytes: 4, read: (view, offset) => view.getFloat32(offset, true) }],
]);
const widths: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

/** Conservative bounded core-glTF preflight. Decoders, sparse accessors and external URIs need a new audited gate. */
export function inspectGlb(buffer: ArrayBuffer): JsonObject {
  if (buffer.byteLength < 20) fail('cabeçalho incompleto');
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) fail('magic/version/tamanho inválido');
  let offset = 12; let json: JsonObject | undefined; let chunk = 0; let binaryOffset = 0; let binaryLength = 0;
  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) fail('chunk truncado');
    const length = view.getUint32(offset, true); const type = view.getUint32(offset + 4, true); offset += 8;
    if (length % 4 || offset + length > buffer.byteLength) fail('alinhamento/tamanho de chunk inválido');
    if (chunk === 0 && type !== 0x4e4f534a) fail('primeiro chunk deve ser JSON');
    if (type === 0x4e4f534a) {
      if (json || length > 2 * 1024 * 1024) fail('JSON duplicado/excessivo');
      json = object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer, offset, length))));
    } else if (type === 0x004e4942 && chunk === 1) { binaryOffset = offset; binaryLength = length; }
    else fail('chunk não aprovado');
    offset += length; chunk++;
  }
  if (!json || object(json.asset).version !== '2.0') fail('glTF 2 obrigatório');
  const approved = new Set(['KHR_materials_unlit', 'KHR_materials_emissive_strength', 'KHR_texture_transform']);
  const used = array(json.extensionsUsed); const required = array(json.extensionsRequired);
  if ([...used, ...required].some((extension) => typeof extension !== 'string' || !approved.has(extension))) fail('extensão/decoder não aprovado');
  const declared = new Set(used);
  if (required.some((extension) => !declared.has(extension))) fail('extensão requerida não declarada em extensionsUsed');
  const pending: { value: unknown; depth: number }[] = [{ value: json, depth: 0 }]; let visited = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (++visited > 150000 || depth > 64) fail('JSON excede orçamento de complexidade/profundidade');
    if (typeof value === 'number' && !Number.isFinite(value)) fail('valor JSON não finito');
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (key === 'uri') fail('URI interna/externa não aprovada; use buffers/imagens incorporados por bufferView');
      if (key === 'extensions') for (const [name, payload] of Object.entries(object(child))) {
        if (!approved.has(name) || !declared.has(name)) fail(`extensão aninhada não aprovada/declarada ${name}`);
        object(payload);
      }
      pending.push({ value: child, depth: depth + 1 });
    }
  }
  const buffers = array(json.buffers).map(object); const views = array(json.bufferViews).map(object); const accessors = array(json.accessors).map(object);
  if (buffers.length > 1 || (buffers.length && (integer(buffers[0].byteLength) > binaryLength || binaryLength - integer(buffers[0].byteLength) > 3))) fail('buffer BIN/tamanho inválido');
  views.forEach((entry) => {
    if (integer(entry.buffer) !== 0 || !buffers.length || integer(entry.byteOffset ?? 0) + integer(entry.byteLength, 1) > integer(buffers[0].byteLength)) fail('bufferView fora do BIN');
    if (entry.byteStride !== undefined && (integer(entry.byteStride, 4) > 252 || Number(entry.byteStride) % 4)) fail('stride inválido');
  });
  let scalarBudget = 0; const values = new Map<number, Float64Array>();
  function accessor(index: unknown): { definition: JsonObject; data: Float64Array; count: number; width: number } {
    const id = integer(index); const definition = accessors[id]; if (!definition) return fail('accessor ausente');
    const count = integer(definition.count, 1); const width = widths[String(definition.type)]; const format = component.get(integer(definition.componentType));
    if (!width || !format || count > 1000000) return fail('accessor tipo/count inválido');
    if (definition.sparse !== undefined) return fail('accessor sparse ainda não aprovado');
    const previous = values.get(id); if (previous) return { definition, data: previous, count, width };
    scalarBudget += count * width; if (scalarBudget > 8000000) return fail('accessors excedem orçamento de valores');
    const entry = views[integer(definition.bufferView)]; if (!entry) return fail('accessor sem bufferView');
    const rows = String(definition.type).startsWith('MAT') ? Math.sqrt(width) : 1;
    const columnBytes = rows > 1 ? Math.ceil(rows * format.bytes / 4) * 4 : format.bytes;
    const packed = rows > 1 ? rows * columnBytes : width * format.bytes;
    const stride = integer(entry.byteStride ?? packed, packed); const localOffset = integer(definition.byteOffset ?? 0);
    if (localOffset % format.bytes || localOffset + (count - 1) * stride + packed > integer(entry.byteLength)) return fail('accessor fora dos bounds/alinhamento');
    if (definition.normalized && !format.scale) return fail('accessor normalized inválido');
    const data = new Float64Array(count * width); const start = binaryOffset + integer(entry.byteOffset ?? 0) + localOffset;
    for (let i = 0; i < count; i++) for (let j = 0; j < width; j++) {
      const at = start + i * stride + (rows > 1 ? Math.floor(j / rows) * columnBytes + j % rows * format.bytes : j * format.bytes);
      const raw = format.read(view, at); const value = definition.normalized ? Math.max(-1, raw / format.scale!) : raw;
      if (!Number.isFinite(value)) return fail('accessor contém valor não finito'); data[i * width + j] = value;
    }
    values.set(id, data); return { definition, data, count, width };
  }
  accessors.forEach((_entry, index) => accessor(index));
  const nodes = array(json.nodes).map(object); const meshes = array(json.meshes).map(object); const skins = array(json.skins).map(object);
  function node(index: unknown) { const entry = nodes[integer(index)]; if (!entry) return fail('nó ausente'); return entry; }
  function mesh(index: unknown) { const entry = meshes[integer(index)]; if (!entry) return fail('mesh ausente'); return entry; }
  const parents = new Map<number, number>();
  const children = nodes.map((entry) => array(entry.children).map((child) => integer(child)));
  // Reject duplicate edges/multiple parents before traversal; malformed DAGs cannot expand the walk.
  nodes.forEach((entry, index) => {
    const unique = new Set<number>();
    children[index].forEach((id) => {
      node(id);
      if (unique.has(id)) fail('filho duplicado na hierarquia');
      if (parents.has(id)) fail('nó com múltiplos pais');
      unique.add(id); parents.set(id, index);
    });
    if (entry.mesh !== undefined) mesh(entry.mesh);
  });
  const colors = new Uint8Array(nodes.length);
  // Start at roots even if node indexes are reversed; then audit any disconnected cycles.
  const indexes = nodes.map((_entry, index) => index);
  for (const index of [...indexes.filter((id) => !parents.has(id)), ...indexes]) {
    if (colors[index]) continue;
    colors[index] = 1; const stack = [{ index, next: 0 }];
    while (stack.length) {
      if (stack.length > 129) fail('hierarquia cíclica/profunda');
      const current = stack[stack.length - 1];
      if (current.next === children[current.index].length) { colors[current.index] = 2; stack.pop(); continue; }
      const child = children[current.index][current.next++];
      if (colors[child] === 1) fail('hierarquia cíclica/profunda');
      if (!colors[child]) { colors[child] = 1; stack.push({ index: child, next: 0 }); }
    }
  }
  array(json.scenes).map(object).forEach((scene) => array(scene.nodes).forEach(node));
  meshes.forEach((entry) => array(entry.primitives).map(object).forEach((primitive) => {
    const attributes = object(primitive.attributes); const position = accessor(attributes.POSITION);
    if (position.definition.type !== 'VEC3' || position.count < 3) fail('POSITION inválido');
    Object.values(attributes).forEach((id) => { if (accessor(id).count !== position.count) fail('atributos com contagens diferentes'); });
    if (primitive.indices !== undefined) {
      const index = accessor(primitive.indices);
      if (index.width !== 1 || index.data.some((value) => !Number.isInteger(value) || value < 0 || value >= position.count)) fail('índice de geometria inválido');
    }
    array(primitive.targets).map(object).forEach((target) => Object.values(target).forEach((id) => { if (accessor(id).count !== position.count) fail('morph target incompatível'); }));
  }));
  skins.forEach((skin) => {
    const joints = array(skin.joints); if (!joints.length || joints.length > 128) fail('skin sem juntas/excessivo'); joints.forEach(node);
    if (skin.inverseBindMatrices !== undefined) { const inverse = accessor(skin.inverseBindMatrices); if (inverse.definition.type !== 'MAT4' || inverse.count !== joints.length) fail('inverse bind matrices incompatíveis'); }
  });
  nodes.forEach((entry) => {
    if (entry.skin === undefined) return;
    const skin = skins[integer(entry.skin)]; if (!skin) fail('skin ausente');
    const joints = array(skin.joints);
    array(mesh(entry.mesh).primitives).map(object).forEach((primitive) => {
      const attributes = object(primitive.attributes);
      if (attributes.JOINTS_1 !== undefined || attributes.WEIGHTS_1 !== undefined) fail('mais de quatro influências não aprovado');
      const weights = accessor(attributes.WEIGHTS_0); const indices = accessor(attributes.JOINTS_0);
      if (weights.width !== 4 || indices.width !== 4 || weights.count !== indices.count) fail('pesos/juntas incompatíveis');
      for (let i = 0; i < weights.count; i++) {
        let total = 0;
        for (let j = 0; j < 4; j++) {
          const weight = weights.data[i * 4 + j]; const joint = indices.data[i * 4 + j];
          if (weight < 0 || weight > 1 || !Number.isInteger(joint) || joint < 0 || joint >= joints.length) fail('peso/junta original inválido'); total += weight;
        }
        if (Math.abs(total - 1) > .01) fail('pesos originais não normalizados');
      }
    });
  });
  array(json.images).map(object).forEach((image) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(String(image.mimeType)) || !views[integer(image.bufferView)]) fail('imagem incorporada/formato não aprovado');
  });
  array(json.animations).map(object).forEach((animation) => {
    const samplers = array(animation.samplers).map(object);
    array(animation.channels).map(object).forEach((channel) => {
      const sampler = samplers[integer(channel.sampler)]; if (!sampler) fail('sampler de animação ausente');
      const target = object(channel.target); const targetNode = node(target.node); const path = String(target.path);
      if (!['translation', 'rotation', 'scale', 'weights'].includes(path)) fail('canal de animação não aprovado');
      const times = accessor(sampler.input); const output = accessor(sampler.output); const interpolation = String(sampler.interpolation ?? 'LINEAR');
      if (!['LINEAR', 'STEP', 'CUBICSPLINE'].includes(interpolation) || times.definition.type !== 'SCALAR' || times.definition.componentType !== 5126 || times.data[0] < 0 || times.data[times.data.length - 1] > 600) fail('tempo/interpolação de animação inválido');
      for (let i = 1; i < times.count; i++) if (times.data[i] <= times.data[i - 1]) fail('tempos de animação devem crescer estritamente');
      const factor = interpolation === 'CUBICSPLINE' ? 3 : 1; let multiplicity = 1;
      if (path === 'weights') {
        multiplicity = array(object(array(mesh(targetNode.mesh).primitives)[0]).targets).length;
        if (!multiplicity || output.definition.type !== 'SCALAR' || output.data.some((value, index) => (factor === 1 || Math.floor(index / multiplicity) % 3 === 1) && (value < 0 || value > 1))) fail('animação morph inválida');
      } else if (output.definition.type !== (path === 'rotation' ? 'VEC4' : 'VEC3')) fail('tipo do canal de animação inválido');
      if (output.count !== times.count * factor * multiplicity) fail('amostras de animação incompatíveis');
      if (path === 'rotation') for (let i = factor === 3 ? 1 : 0; i < output.count; i += factor) {
        const norm = Math.hypot(...output.data.slice(i * 4, i * 4 + 4)); if (Math.abs(norm - 1) > .01) fail('quaternion de animação não normalizado');
      }
    });
  });
  return json;
}
