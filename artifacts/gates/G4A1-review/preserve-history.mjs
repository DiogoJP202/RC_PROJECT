/**
 * Audit preserved gate evidence; restore only with the explicit --restore flag.
 * No deletions. All changed current evidence is archived before any original bytes return.
 * The frozen889-entry manifest and declared hashes/byte counts pin736 historical artifacts.
 * Run after E2E writers stop, from any working directory.
 */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const baseline = join(workspace, 'artifacts/local/g4a1-baseline');
const archiveRoot = join(workspace, 'artifacts/gates/G4A1-review/regressions');
const reportPath = join(workspace, 'artifacts/g4a1/history-preservation.json');
const expectedCount = 736;
const expectedManifestCount = 889;
const expectedManifestSha256 = '5eafa285cf67d839a95a291fbd8e942060cc2c6ce265af7cd7e53ee4bcc745bc';
const args = process.argv.slice(2);
const restoring = args.includes('--restore');
if (args.some((arg) => !['--restore', '--audit', '--preview'].includes(arg))
    || (restoring && args.some((arg) => arg !== '--restore')) || new Set(args).size !== args.length) {
  throw new Error('Use no flags / --audit / --preview for an audit, or --restore for archival and restoration.');
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const portable = (path) => relative(workspace, path).split('\\').join('/');
function inside(root, target) {
  const difference = relative(root, target);
  return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`));
}
function requireInside(root, target) {
  if (!inside(root, target)) throw new Error('Resolved target escapes its intended workspace directory.');
}
async function existingInfo(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
let workspaceReal;
let baselineReal;
async function safeExisting(path, intendedRootReal = workspaceReal) {
  const info = await existingInfo(path);
  if (!info) return null;
  if (info.isSymbolicLink()) throw new Error(`Symbolic-link evidence is not accepted: ${portable(path)}`);
  requireInside(intendedRootReal, await realpath(path));
  return info;
}
async function safeParent(path) {
  requireInside(workspace, path);
  let ancestor = dirname(path);
  while (!(await existingInfo(ancestor))) {
    const parent = dirname(ancestor);
    if (parent === ancestor) throw new Error('No safe existing parent directory.');
    ancestor = parent;
  }
  requireInside(workspaceReal, await realpath(ancestor));
}
async function ensureParent(path) {
  await safeParent(path);
  await mkdir(dirname(path), { recursive: true });
  requireInside(workspaceReal, await realpath(dirname(path)));
}
function validateEntry(file) {
  if (!file.startsWith('artifacts/') || isAbsolute(file) || win32.isAbsolute(file)
      || /[\\\u0000-\u001f:*?"<>|]/.test(file)
      || file.split('/').some((segment) => !segment || segment === '.' || segment === '..' || /[. ]$/.test(segment))) {
    throw new Error('Baseline list contains a non-canonical or unsafe relative artifact path.');
  }
  const current = resolve(workspace, file), original = resolve(baseline, file), archive = resolve(archiveRoot, file);
  requireInside(workspace, current); requireInside(baseline, original); requireInside(archiveRoot, archive);
  return { file, current, original, archive };
}
async function fileBytes(path, intendedRootReal = workspaceReal) {
  const info = await safeExisting(path, intendedRootReal);
  if (!info) return null;
  if (!info.isFile()) throw new Error(`Expected a regular evidence file: ${portable(path)}`);
  return readFile(path);
}
function versioned(path, hash) {
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const dot = path.lastIndexOf('.');
  return dot > slash ? `${path.slice(0, dot)}.sha256-${hash}${path.slice(dot)}` : `${path}.sha256-${hash}`;
}
/** Reuse identical archives. Preserve differing archives and create a hash-named sibling. */
async function preserveBytes(basePath, bytes, expectedHash) {
  await ensureParent(basePath);
  let target = basePath;
  const existing = await fileBytes(target);
  if (existing && sha256(existing) !== expectedHash) target = versioned(basePath, expectedHash);
  const previous = await fileBytes(target);
  if (previous) {
    if (sha256(previous) !== expectedHash) throw new Error(`Existing archive hash conflicts: ${portable(target)}`);
    return { path: portable(target), reused: true };
  }
  // Exclusive creation protects an archive another invocation may have created.
  // Write captured bytes so a concurrent source writer cannot change evidence.
  try { await writeFile(target, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || sha256(await fileBytes(target)) !== expectedHash) throw error;
  }
  if (sha256(await fileBytes(target)) !== expectedHash) throw new Error(`Archive verification failed: ${portable(target)}`);
  return { path: portable(target), reused: false };
}

try {
  workspaceReal = await realpath(workspace);
  requireInside(workspaceReal, await realpath(baseline));
  baselineReal = await realpath(baseline);
  const listPath = join(baseline, 'baseline-files.json');
  const listBytes = await fileBytes(listPath, baselineReal);
  if (!listBytes) throw new Error('The frozen baseline-files.json is missing.');
  if (sha256(listBytes) !== expectedManifestSha256) throw new Error('Frozen baseline manifest hash does not match its declared checkpoint.');
  const fullManifest = JSON.parse(listBytes.toString('utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(fullManifest) || fullManifest.length !== expectedManifestCount
      || new Set(fullManifest.map((entry) => entry?.file)).size !== expectedManifestCount
      || fullManifest.some((entry) => !entry || typeof entry.file !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)
        || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0)) {
    throw new Error('Frozen manifest must contain889 distinct file/hash/byte declarations.');
  }
  const files = fullManifest.filter((entry) => entry.file.startsWith('artifacts/'));
  if (files.length !== expectedCount || new Set(files.map((entry) => entry.file)).size !== expectedCount) {
    throw new Error(`Expected ${expectedCount} distinct baseline paths; found ${files.length}.`);
  }
  const paths = files.map((entry) => ({ ...validateEntry(entry.file), declaredSha256: entry.sha256, declaredBytes: entry.bytes }));
  const records = [];
  // Complete baseline and target validation before any historical file is restored.
  for (const entry of paths) {
    const original = await fileBytes(entry.original, baselineReal);
    if (!original) throw new Error(`Preserved original is missing: ${entry.file}`);
    const baselineHash = sha256(original);
    if (baselineHash !== entry.declaredSha256 || original.length !== entry.declaredBytes) {
      throw new Error(`Preserved baseline differs from its declared SHA-256 or byte count: ${entry.file}`);
    }
    const current = await fileBytes(entry.current);
    await safeParent(entry.current);
    const currentHash = current ? sha256(current) : null;
    records.push({ file: entry.file, declaredSha256: entry.declaredSha256, declaredBytes: entry.declaredBytes,
      baselineSha256: baselineHash, baselineMatchesDeclaration: true, currentSha256Before: currentHash,
      baselineBytes: original.length, currentBytesBefore: current?.length ?? null,
      changed: baselineHash !== currentHash, archived: null, restored: false, currentSha256After: currentHash });
  }
  if (restoring) {
    // First archive every divergent current output. No historical target is
    // restored unless all new evidence has already been captured and verified.
    for (let index = 0; index < paths.length; index++) {
      const entry = paths[index], record = records[index];
      if (!record.changed) continue;
      const current = await fileBytes(entry.current);
      if ((current ? sha256(current) : null) !== record.currentSha256Before) {
        throw new Error(`Current evidence changed before archival; stop its writer and retry: ${entry.file}`);
      }
      if (current) record.archived = await preserveBytes(entry.archive, current, record.currentSha256Before);
    }
    // Detect a writer that changed any output while other archives were made.
    for (let index = 0; index < paths.length; index++) {
      const current = await fileBytes(paths[index].current);
      if ((current ? sha256(current) : null) !== records[index].currentSha256Before) {
        throw new Error(`Evidence writer is still active; no restoration started: ${paths[index].file}`);
      }
    }
    for (let index = 0; index < paths.length; index++) {
      const entry = paths[index], record = records[index];
      if (!record.changed) continue;
      const original = await fileBytes(entry.original, baselineReal), current = await fileBytes(entry.current);
      if (!original || sha256(original) !== record.baselineSha256) throw new Error(`Baseline changed during preservation: ${entry.file}`);
      if ((current ? sha256(current) : null) !== record.currentSha256Before) throw new Error(`Current evidence changed during preservation; stop its writer and retry: ${entry.file}`);
      await ensureParent(entry.current);
      await safeExisting(entry.current);
      const beforeRestore = await fileBytes(entry.current);
      if ((beforeRestore ? sha256(beforeRestore) : null) !== record.currentSha256Before) {
        throw new Error(`Current evidence changed before restoration; stop its writer and retry: ${entry.file}`);
      }
      // All divergent current outputs have already been archived byte-for-byte.
      await writeFile(entry.current, original);
      record.currentSha256After = sha256(await fileBytes(entry.current));
      record.restored = record.currentSha256After === record.baselineSha256;
      if (!record.restored) throw new Error(`Restored evidence does not match its original: ${entry.file}`);
    }
  }
  const verification = [];
  for (let index = 0; index < paths.length; index++) {
    const bytes = await fileBytes(paths[index].current);
    const hash = bytes ? sha256(bytes) : null;
    records[index].currentSha256After = hash;
    if (hash !== records[index].baselineSha256) verification.push(records[index].file);
  }
  const manifest = {
    createdAt: new Date().toISOString(), mode: restoring ? 'restore' : 'audit',
    baseline: portable(baseline), baselineManifest: portable(listPath), baselineManifestSha256: sha256(listBytes),
    expectedManifestSha256, fullManifestCount: fullManifest.length, expectedManifestCount, expectedCount,
    total: records.length, changedCount: records.filter((record) => record.changed).length,
    changed: records.filter((record) => record.changed).map((record) => record.file),
    restoredCount: records.filter((record) => record.restored).length,
    verifiedOriginalCount: records.length - verification.length, remainingDifferent: verification,
    policy: 'No deletions. Verify every baseline against its frozen declared hash/bytes; archive all divergent current outputs before any original restoration. Existing differing archives remain; a SHA-256-named sibling stores the additional version. Only736 artifacts are restored; no source/code/document files are restored.',
    records,
  };
  const reportBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  await ensureParent(reportPath);
  const previousReport = await fileBytes(reportPath);
  if (previousReport && sha256(previousReport) !== sha256(reportBytes)) {
    await preserveBytes(versioned(reportPath, sha256(previousReport)), previousReport, sha256(previousReport));
  }
  await writeFile(reportPath, reportBytes);
  console.log(JSON.stringify({ mode: manifest.mode, total: manifest.total, changed: manifest.changedCount,
    restored: manifest.restoredCount, verifiedOriginalCount: manifest.verifiedOriginalCount,
    remainingDifferent: verification.length, report: portable(reportPath), requiresRestore: verification.length > 0 }, null, 2));
  if (restoring && verification.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ error: String(error.message).replaceAll(workspace, '<workspace>')
    .replaceAll(workspace.replaceAll('\\', '/'), '<workspace>'), mode: restoring ? 'restore' : 'audit' }));
  process.exitCode = 1;
}
