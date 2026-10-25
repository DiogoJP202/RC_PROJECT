import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Matrix4 } from 'three';
import { ProceduralRinkakuAdapter } from '../../../../src/scene/rinkaku/ProceduralRinkakuAdapter.ts';
import { sampleRinkakuAt } from '../../../../src/simulation/rinkaku.ts';

const source = existsSync('artifacts/local/pre-checkpoint-evidence/g3a1/phases-and-counts.json')
  ? 'artifacts/local/pre-checkpoint-evidence/g3a1/phases-and-counts.json' : 'artifacts/g3a1/phases-and-counts.json';
const bytes = await readFile(source), metadata = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const adapter = new ProceduralRinkakuAdapter(), connection = new Matrix4(), comparisons = [];
for (const sample of metadata.samples.filter(sample => sample.phase !== 'rest')) {
  adapter.apply(sampleRinkakuAt(sample.t, { appendageCount: sample.count }), connection);
  const current = adapter.inspect();
  comparisons.push({ count: sample.count, t: sample.t, phase: sample.phase, before: sample.adapter.positionHash, after: current.positionHash,
    identical: sample.adapter.positionHash === current.positionHash });
}
adapter.dispose();
const result = { method: 'Compare the quantized geometry hashes of all 24 approved non-rest count/phase reference poses with the final checkpoint adapter. No GPU, no product mutation.',
  source: 'artifacts/g3a1/phases-and-counts.json (preserved pre-checkpoint review metadata)',
  metadataSha256: createHash('sha256').update(bytes).digest('hex'), comparisons,
  allIdentical: comparisons.length === 24 && comparisons.every(sample => sample.identical),
  note: 'Near-zero formation/rest and terminal retraction changed intentionally to remove residual area. Sampler and six representative non-rest t values are unchanged.' };
await mkdir('artifacts/checkpoint', { recursive: true });
await writeFile('artifacts/checkpoint/g3a-approved-poses.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ count: comparisons.length, allIdentical: result.allIdentical }));
if (!result.allIdentical) process.exitCode = 1;
