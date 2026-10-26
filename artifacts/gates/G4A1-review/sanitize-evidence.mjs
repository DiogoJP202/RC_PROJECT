import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { readFile, readdir, mkdir, writeFile, lstat, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run only after writers have finished. Never touches source, captures or prior gates.
// Only newG4A.1 .json/.txt bytes may change. Raw bytes and prior manifests are
// retained locally, including differing versions named with their full SHA-256.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const evidenceRoot = join(workspace, 'artifacts/g4a1');
const backupRoot = join(workspace, 'artifacts/local/g4a1-raw-logs');
const manifestPath = 'artifacts/g4a1/evidence-sanitization.json';
const baselineList = join(workspace, 'artifacts/local/g4a1-baseline/baseline-files.json');
const expectedBaselineManifestSha256 = '5eafa285cf67d839a95a291fbd8e942060cc2c6ce265af7cd7e53ee4bcc745bc';
const slash = (value) => value.replaceAll('\\', '/');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const withoutBom = (value) => value.startsWith('\uFEFF') ? value.slice(1) : value;
class AuditError extends Error {}
let workspaceReal, evidenceReal;
const skippedSymlinks = [];
function inside(root, target) {
  const difference = relative(root, target);
  return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`));
}
function requireInside(root, target) {
  if (!inside(root, target)) throw new AuditError('Resolved evidence/backup target escaped its intended directory.');
}
async function existingInfo(file) {
  try { return await lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function safeExistingFile(file, intendedRoot = workspaceReal) {
  const info = await existingInfo(file);
  if (!info) return null;
  if (info.isSymbolicLink() || !info.isFile()) throw new AuditError('A regular, non-symbolic evidence file was required.');
  requireInside(intendedRoot, await realpath(file));
  return info;
}
async function ensureParent(file, intendedRoot) {
  requireInside(intendedRoot, file);
  let ancestor = dirname(file);
  while (!(await existingInfo(ancestor))) {
    const next = dirname(ancestor); if (next === ancestor) throw new AuditError('No safe parent directory.'); ancestor = next;
  }
  requireInside(workspaceReal, await realpath(ancestor));
  await mkdir(dirname(file), { recursive: true });
  requireInside(workspaceReal, await realpath(dirname(file)));
}

function validateJson(value, file) {
  try { JSON.parse(withoutBom(value)); }
  catch { throw new AuditError(`Invalid JSON: ${file}. File contents were not printed.`); }
}

function escaped(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function pathVariants(value) {
  const native = value.replaceAll('/', '\\');
  const variants = new Set([value, native, slash(value)]);
  let encoded = native;
  for (let depth = 0; depth < 2; depth++) {
    encoded = encoded.replaceAll('\\', '\\\\');
    variants.add(encoded);
  }
  return [...variants].sort((a, b) => b.length - a.length);
}
const replacements = [
  { value: workspace, label: 'workspace', replacement: '<workspace>' },
  { value: homedir(), label: 'user', replacement: '<user>' },
].flatMap((item) => pathVariants(item.value).map((variant) => ({ ...item, variant })))
  .sort((a, b) => b.variant.length - a.variant.length);

function sanitizePaths(value) {
  const pathHits = { workspace: 0, user: 0, total: 0 };
  let text = value;
  for (const rule of replacements) {
    // Match path prefixes, without treating similarly named sibling folders/users as this path.
    const pattern = new RegExp(`${escaped(rule.variant)}(?=$|[^A-Za-z0-9_.-])`, 'gi');
    text = text.replace(pattern, () => { pathHits[rule.label]++; pathHits.total++; return rule.replacement; });
  }
  return { text, pathHits };
}

async function filesUnder(directory) {
  requireInside(evidenceReal, await realpath(directory));
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isSymbolicLink()) { skippedSymlinks.push(slash(relative(workspace, file))); continue; }
    if (entry.isDirectory()) result.push(...await filesUnder(file));
    else if (entry.isFile() && ['.json', '.txt'].includes(extname(entry.name).toLowerCase())) {
      await safeExistingFile(file, evidenceReal); result.push(file);
    }
  }
  return result.sort();
}

async function preserveRaw(file, bytes, digest) {
  const base = join(backupRoot, relative(evidenceRoot, file));
  await ensureParent(base, backupRoot); await safeExistingFile(base);
  let destination = base;
  try {
    const existing = await readFile(base);
    if (sha(existing) === digest) return slash(relative(workspace, base));
    const extension = extname(base);
    destination = `${base.slice(0, base.length - extension.length)}.sha256-${digest}${extension}`;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await safeExistingFile(destination);
  try { await writeFile(destination, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || sha(await readFile(destination)) !== digest) {
      throw new AuditError(`Raw backup could not be verified: ${slash(relative(evidenceRoot, file))}.`);
    }
  }
  if (sha(await readFile(destination)) !== digest) throw new AuditError('Raw backup verification failed after writing.');
  return slash(relative(workspace, destination));
}

async function main() {
  if (process.argv.length > 2) throw new AuditError('Run without flags after all evidence writers have stopped.');
  workspaceReal = await realpath(workspace); evidenceReal = await realpath(evidenceRoot);
  requireInside(workspaceReal, evidenceReal);
  await safeExistingFile(baselineList);
  const baselineBytes = await readFile(baselineList);
  if (sha(baselineBytes) !== expectedBaselineManifestSha256) throw new AuditError('Frozen baseline manifest hash does not match.');
  validateJson(baselineBytes.toString('utf8'), 'baseline-files.json');
  const baselineFiles = JSON.parse(withoutBom(baselineBytes.toString('utf8')));
  if (!Array.isArray(baselineFiles) || baselineFiles.length !== 889 || new Set(baselineFiles.map((entry) => entry?.file)).size !== 889
      || baselineFiles.some((entry) => typeof entry?.file !== 'string')) throw new AuditError('Invalid frozen889-file baseline.');
  const frozen = new Set(baselineFiles.map((entry) => entry.file));
  const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', 'HEAD', '--', 'artifacts/g4a1'],
    { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0').filter(Boolean));
  if (tracked.has(manifestPath) || frozen.has(manifestPath)) throw new AuditError('The G4A.1 manifest is historical; refusing to rewrite it.');
  let previous = new Map(), previousManifestBackup = null;
  try {
    await safeExistingFile(join(workspace, manifestPath), evidenceReal);
    const raw = await readFile(join(workspace, manifestPath), 'utf8');
    validateJson(raw, manifestPath);
    const existing = JSON.parse(withoutBom(raw));
    previous = new Map((existing.files ?? []).map((entry) => [entry.path, entry]));
    previousManifestBackup = await preserveRaw(join(workspace, manifestPath), Buffer.from(raw, 'utf8'), sha(Buffer.from(raw, 'utf8')));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }

  const records = [], skippedTracked = [], skippedFrozen = [];
  for (const file of await filesUnder(evidenceRoot)) {
    const path = slash(relative(workspace, file));
    if (path === manifestPath) continue;
    if (tracked.has(path)) { skippedTracked.push(path); continue; }
    if (frozen.has(path)) { skippedFrozen.push(path); continue; }
    const before = await readFile(file);
    const beforeSHA256 = sha(before);
    const isJson = extname(file).toLowerCase() === '.json';
    const original = before.toString('utf8');
    if (!Buffer.from(original, 'utf8').equals(before)) throw new AuditError(`Unsupported text encoding: ${path}. Original bytes were not changed.`);
    if (isJson) validateJson(original, path);
    const bomRemoved = isJson && original.startsWith('\uFEFF');
    const { text, pathHits } = sanitizePaths(bomRemoved ? withoutBom(original) : original);
    if (isJson) validateJson(text, path);
    const after = Buffer.from(text, 'utf8');
    const afterSHA256 = sha(after);
    const old = previous.get(path);
    // A second run retains the original raw provenance rather than replacing it with sanitized input.
    if (old?.afterSHA256 === beforeSHA256 && afterSHA256 === beforeSHA256) {
      const backupFile = resolve(workspace, old.backup);
      const withinBackup = relative(backupRoot, backupFile);
      if (!withinBackup || withinBackup.startsWith('..') || isAbsolute(withinBackup)) throw new AuditError(`Prior backup is outside the local raw-log folder: ${path}.`);
      await safeExistingFile(backupFile);
      const verified = sha(await readFile(backupFile));
      if (verified !== old.beforeSHA256) throw new AuditError(`Prior raw backup verification failed: ${path}.`);
      records.push(old);
      continue;
    }
    const backup = await preserveRaw(file, before, beforeSHA256);
    if (sha(await readFile(join(workspace, backup))) !== beforeSHA256) throw new AuditError(`Raw backup hash mismatch: ${path}.`);
    await safeExistingFile(file, evidenceReal);
    if (sha(await readFile(file)) !== beforeSHA256) throw new AuditError(`Evidence writer is still active: ${path}. Stop writers and retry.`);
    if (beforeSHA256 !== afterSHA256) {
      await writeFile(file, after);
      if (sha(await readFile(file)) !== afterSHA256) throw new AuditError(`Sanitized bytes could not be verified: ${path}. Raw backup is preserved.`);
    }
    records.push({ path, beforeSHA256, afterSHA256, backup,
      changed: beforeSHA256 !== afterSHA256, pathHits, bomRemoved });
  }
  const totals = { files: records.length, changed: records.filter((entry) => entry.changed).length,
    workspaceHits: 0, userHits: 0, pathHits: 0 };
  for (const entry of records) {
    totals.workspaceHits += entry.pathHits.workspace; totals.userHits += entry.pathHits.user; totals.pathHits += entry.pathHits.total;
  }
  const manifest = { schemaVersion: 2, generatedAt: new Date().toISOString(),
    scope: 'Only new .json/.txt under artifacts/g4a1 relative to both HEAD and the frozen889-file baseline; symlinks and historical files are skipped. No deletions. Every raw version and prior manifest is retained locally.',
    baselineManifestSha256: expectedBaselineManifestSha256, previousManifestBackup,
    replacements: { workspace: '<workspace>', user: '<user>' }, totals, skippedTracked, skippedFrozen, skippedSymlinks, files: records };
  const output = `${JSON.stringify(manifest, null, 2)}\n`;
  validateJson(output, manifestPath);
  await ensureParent(join(workspace, manifestPath), evidenceRoot);
  await safeExistingFile(join(workspace, manifestPath), evidenceReal);
  await writeFile(join(workspace, manifestPath), output, 'utf8');
  console.log(JSON.stringify({ ...totals, manifest: manifestPath }));
}

main().catch((error) => {
  console.error(error instanceof AuditError ? error.message : 'Evidence sanitation failed. No file contents or absolute paths were printed.');
  process.exitCode = 1;
});
