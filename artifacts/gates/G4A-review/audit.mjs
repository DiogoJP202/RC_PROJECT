/** Final local evidence audit. Run after writers, sanitization and history preservation. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const output = 'artifacts/g4a/final-audit.json';
const git = (...args) => execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8' }).trim();
const lines = (text) => text.split(/\r?\n/).filter(Boolean);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (file) => JSON.parse((await readFile(join(root, file), 'utf8')).replace(/^\uFEFF/, ''));
async function filesIn(directory) {
  const result = [];
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await filesIn(path));
    else if (entry.isFile()) result.push(path);
    else throw new Error('Unexpected non-regular artifact entry.');
  }
  return result.sort();
}

const changed = lines(git('diff', '--name-only'));
const added = lines(git('ls-files', '--others', '--exclude-standard'));
const candidates = [...new Set([...changed, ...added])].filter((file) => file !== output).sort();
const protectedPaths = ['AGENTS.md', 'package.json', 'package-lock.json', '.nvmrc', 'contracts', 'research', 'references',
  'public/catalog.json', 'public/assets', 'src/simulation/rinkaku.ts', 'src/scene/rinkaku/ProceduralRinkakuAdapter.ts'];
const protectedDiff = lines(git('diff', '--name-only', '--', ...protectedPaths));
const history = await json('artifacts/g4a/history-preservation.json');
const captures = await json('artifacts/gates/G4A-review/captures.json');
const checks = await json('artifacts/g4a/checks.json');
const e2e = await json('artifacts/g4a/e2e-full.json');
const privacy = await json('artifacts/g4a/evidence-sanitization.json');
const patterns = [
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['api-secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g],
  ['aws-access-key', /\bAKIA[A-Z0-9]{16}\b/g],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
const findings = [], personalPathFindings = [], inventory = [];
for (const file of candidates) {
  const bytes = await readFile(join(root, file));
  inventory.push({ file, bytes: bytes.length, sha256: hash(bytes) });
  if (/\.(?:png|webm|glb)$/i.test(file)) continue;
  const text = bytes.toString('utf8');
  const personalPaths = [...text.matchAll(/[A-Za-z]:[\\/]+Users[\\/]+[A-Za-z0-9_.-]+/g)].length;
  if (personalPaths) personalPathFindings.push({ file, count: personalPaths });
  for (const [rule, pattern] of patterns) {
    const count = [...text.matchAll(pattern)].length;
    if (count) findings.push({ file, rule, count });
  }
}
const captureVerification = [];
for (const item of captures.captures) captureVerification.push({ file: item.file, matches: hash(await readFile(join(root, item.file))) === item.sha256 });
const videoMatches = hash(await readFile(join(root, captures.playback.file))) === captures.playback.sha256;
const profiles = [];
for (const count of [100, 500, 2000]) {
  const file = `artifacts/g4a/production-${count}.json`, profile = await json(file);
  profiles.push({ count, file, sample: profile.sample, budgets: profile.budgets, runtime: profile.runtime });
}
const dist = [];
for (const file of await filesIn('dist')) dist.push({ file, bytes: (await readFile(join(root, file))).length, sha256: hash(await readFile(join(root, file))) });
const unexpectedBuildFiles = dist.filter(({ file }) => !/^dist\/(?:index\.html|atlas-mark\.svg|catalog\.json|ASSET_LICENSES\.md|assets\/[^/]+\.(?:js|css)|assets\/fixtures\/(?:[^/]+\.glb|manifest\.json))$/.test(file)).map(({ file }) => file);
const head = git('rev-parse', 'HEAD'), originMain = git('rev-parse', 'origin/main'), branch = git('branch', '--show-current');
const passed = head === '717f4069c5e662f78ea8b28e7d13e0636ab0c5dd' && head === originMain && branch === 'main'
  && protectedDiff.length === 0 && history.verifiedOriginalCount === 505 && history.remainingDifferent.length === 0
  && findings.length === 0 && personalPathFindings.length === 0 && checks.every((check) => check.exitCode === 0)
  && e2e.stats.unexpected === 0 && e2e.stats.skipped === 0 && e2e.stats.expected === 56
  && captureVerification.every((item) => item.matches) && videoMatches && unexpectedBuildFiles.length === 0
  && profiles.every((profile) => Object.values(profile.budgets).every(Boolean) && !profile.runtime.errors.length
    && !profile.runtime.failedRequests.length && !profile.runtime.httpErrors.length);
const report = {
  createdAt: new Date().toISOString(), baseline: '717f4069c5e662f78ea8b28e7d13e0636ab0c5dd',
  git: { branch, head, originMain,
    aheadBehind: git('rev-list', '--left-right', '--count', 'HEAD...origin/main'), changedTracked: changed, addedUntracked: added,
    staged: lines(git('diff', '--cached', '--name-only')), publication: 'No commit, push or deploy in G4A.' },
  checks, e2e: { file: 'artifacts/g4a/e2e-full.json', stats: e2e.stats }, profiles,
  preservation: { file: 'artifacts/g4a/history-preservation.json', total: history.total, changedCount: history.changedCount, verifiedOriginalCount: history.verifiedOriginalCount, remainingDifferent: history.remainingDifferent },
  privacy: { file: 'artifacts/g4a/evidence-sanitization.json', processedFiles: privacy.files?.length ?? null },
  scope: { protectedPaths, protectedDiff, unexpectedBuildFiles, noNewDependencies: protectedDiff.length === 0 },
  provenance: 'Procedural geometry and bump are authored in this repository. Only original existing public assets/fixtures are packaged; source citations are text, with no copied figures.',
  security: { method: 'High-confidence token/private-key patterns over changed/new text. No secret values are printed. This is not a universal credential guarantee.', findings, personalPathFindings },
  captures: { count: captureVerification.length, verification: captureVerification, videoMatches },
  inventory, buildInventory: dist,
  limitations: ['Human artistic approval pending.', 'No physical-phone performance claim.', 'Body remains resident; Micro counters do not measure total GPU memory.', 'Independent Node/Python installation remains a documented environment dependency.'],
  passed,
};
await writeFile(join(root, output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed, output, changed: changed.length, added: added.length, secretFindings: findings.length, personalPathFindings,
  unexpectedBuildFiles, protectedDiff, originalArtifactsVerified: history.verifiedOriginalCount,
  captures: captureVerification.length, videoMatches, e2e: e2e.stats }, null, 2));
if (!passed) process.exitCode = 1;
