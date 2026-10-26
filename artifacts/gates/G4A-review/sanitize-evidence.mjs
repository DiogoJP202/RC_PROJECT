import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run only after writers have finished. Never touches source, captures or prior gates.
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const evidenceRoot = join(workspace, 'artifacts/g4a');
const backupRoot = join(workspace, 'artifacts/local/g4a-raw-logs');
const manifestPath = 'artifacts/g4a/evidence-sanitization.json';
const slash = (value) => value.replaceAll('\\', '/');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const withoutBom = (value) => value.startsWith('\uFEFF') ? value.slice(1) : value;
class AuditError extends Error {}

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
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(file));
    else if (entry.isFile() && ['.json', '.txt'].includes(extname(entry.name).toLowerCase())) result.push(file);
  }
  return result.sort();
}

async function preserveRaw(file, bytes, digest) {
  const base = join(backupRoot, relative(evidenceRoot, file));
  await mkdir(dirname(base), { recursive: true });
  let destination = base;
  try {
    const existing = await readFile(base);
    if (sha(existing) === digest) return slash(relative(workspace, base));
    const extension = extname(base);
    destination = `${base.slice(0, base.length - extension.length)}.sha256-${digest}${extension}`;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await writeFile(destination, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || sha(await readFile(destination)) !== digest) {
      throw new AuditError(`Raw backup could not be verified: ${slash(relative(evidenceRoot, file))}.`);
    }
  }
  return slash(relative(workspace, destination));
}

async function main() {
  const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', 'HEAD', '--', 'artifacts/g4a'],
    { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0').filter(Boolean));
  if (tracked.has(manifestPath)) throw new AuditError('The G4A manifest is tracked; refusing to rewrite historical evidence.');
  let previous = new Map();
  try {
    const raw = await readFile(join(workspace, manifestPath), 'utf8');
    validateJson(raw, manifestPath);
    const existing = JSON.parse(withoutBom(raw));
    previous = new Map((existing.files ?? []).map((entry) => [entry.path, entry]));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }

  const records = [], skippedTracked = [];
  for (const file of await filesUnder(evidenceRoot)) {
    const path = slash(relative(workspace, file));
    if (path === manifestPath) continue;
    if (tracked.has(path)) { skippedTracked.push(path); continue; }
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
      const verified = sha(await readFile(backupFile));
      if (verified !== old.beforeSHA256) throw new AuditError(`Prior raw backup verification failed: ${path}.`);
      records.push(old);
      continue;
    }
    const backup = await preserveRaw(file, before, beforeSHA256);
    if (sha(await readFile(join(workspace, backup))) !== beforeSHA256) throw new AuditError(`Raw backup hash mismatch: ${path}.`);
    if (beforeSHA256 !== afterSHA256) await writeFile(file, after);
    records.push({ path, beforeSHA256, afterSHA256, backup,
      changed: beforeSHA256 !== afterSHA256, pathHits, bomRemoved });
  }
  const totals = { files: records.length, changed: records.filter((entry) => entry.changed).length,
    workspaceHits: 0, userHits: 0, pathHits: 0 };
  for (const entry of records) {
    totals.workspaceHits += entry.pathHits.workspace; totals.userHits += entry.pathHits.user; totals.pathHits += entry.pathHits.total;
  }
  const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(),
    scope: 'New .json/.txt files under artifacts/g4a relative to HEAD only; symlinks and committed historical files are skipped.',
    replacements: { workspace: '<workspace>', user: '<user>' }, totals, skippedTracked, files: records };
  const output = `${JSON.stringify(manifest, null, 2)}\n`;
  validateJson(output, manifestPath);
  await writeFile(join(workspace, manifestPath), output, 'utf8');
  console.log(JSON.stringify({ ...totals, manifest: manifestPath }));
}

main().catch((error) => {
  console.error(error instanceof AuditError ? error.message : 'Evidence sanitation failed. No file contents or absolute paths were printed.');
  process.exitCode = 1;
});
