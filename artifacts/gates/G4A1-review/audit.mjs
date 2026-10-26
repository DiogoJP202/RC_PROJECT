/** Read-only source/evidence audit; writes only its own final report. Run LAST,
 * after profiles, captures, history restoration and evidence sanitization.
 * This helper never starts a browser, tests, Git mutation or publication.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const output = 'artifacts/g4a1/final-audit.json';
const baselineDirectory = 'artifacts/local/g4a1-baseline';
const baselineFile = `${baselineDirectory}/baseline-files.json`;
const review = 'artifacts/gates/G4A1-review';
const checkpoint = '717f4069c5e662f78ea8b28e7d13e0636ab0c5dd';
const failures = [];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const expect = (condition, rule, file) => { if (!condition) failures.push({ rule, ...(file ? { file } : {}) }); return Boolean(condition); };
function safePath(file) {
  if (typeof file !== 'string' || isAbsolute(file) || /\\|(^|\/)\.\.(\/|$)/.test(file)) throw new Error('Invalid relative evidence path.');
  return join(root, file);
}
async function bytes(file, required = true) {
  try { return await readFile(safePath(file)); }
  catch { if (required) expect(false, 'missing-or-unreadable-file', file); return null; }
}
async function json(file) {
  const data = await bytes(file);
  if (!data) return null;
  try { return JSON.parse(data.toString('utf8').replace(/^\uFEFF/, '')); }
  catch { expect(false, 'invalid-json', file); return null; }
}
const git = (...args) => execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8' }).trim();
const gitFiles = (...args) => git(...args).split('\0').map((file) => file.trim()).filter(Boolean);
async function filesIn(directory) {
  const result = [];
  try {
    for (const entry of await readdir(safePath(directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) result.push(...await filesIn(file));
      else if (entry.isFile()) result.push(file);
      else expect(false, 'non-regular-entry', file);
    }
  } catch { expect(false, 'missing-directory', directory); }
  return result.sort();
}
const emptyRuntime = (runtime) => runtime && ['errors', 'failedRequests', 'httpErrors'].every((key) => Array.isArray(runtime[key]) && runtime[key].length === 0);

async function main() {
const baseline = await json(baselineFile);
const entries = Array.isArray(baseline) ? baseline : [];
expect(entries.length === 889, 'baseline-889-paths', baselineFile);
expect(new Set(entries.map((entry) => entry.file)).size === 889, 'baseline-unique-paths', baselineFile);
const historical = entries.filter((entry) => entry.file.startsWith('artifacts/'));
const sources = entries.filter((entry) => !entry.file.startsWith('artifacts/'));
expect(historical.length === 736 && sources.length === 153, 'baseline-736-history-153-source', baselineFile);
const baselineByPath = new Map(entries.map((entry) => [entry.file, entry]));
// Every other pre-G4A.1 source/config/document must retain its exact baseline bytes.
const authorizedChanges = new Set([
  '.gitattributes', '.gitignore', 'README.md', 'docs/01_ROADMAP_AND_GATES.md', 'docs/IMPLEMENTATION_LOG.md',
  'docs/PROJECT_HANDOFF.md', 'docs/RESUME_ON_NEW_PC.md', 'docs/G4A_ACCEPTANCE.md', 'docs/G4A_ENGINE_DESIGN.md',
  'docs/G4A_VISUAL_MODEL.md', 'docs/G4A_BLENDER_CONTRACT.md', 'public/ASSET_LICENSES.md', 'src/app/App.tsx',
  'src/scene/vascular/camera.ts', 'src/scene/vascular/camera.test.ts',
  'src/scene/vascular/ProceduralVascularAdapter.ts', 'src/scene/vascular/ProceduralVascularAdapter.test.ts',
  'src/scene/vascular/VascularScene.tsx', 'src/ui/VascularWorkspace.tsx', 'src/ui/vascular.css',
]);
const baselineVerification = [];
for (const item of entries) {
  const current = await bytes(item.file), frozen = await bytes(`${baselineDirectory}/${item.file}`);
  const currentSha256 = current ? hash(current) : null;
  const snapshotMatchesManifest = frozen !== null && hash(frozen) === item.sha256;
  expect(snapshotMatchesManifest, 'baseline-snapshot-hash', item.file);
  const matches = currentSha256 === item.sha256, allowedChange = authorizedChanges.has(item.file);
  if (!matches && !allowedChange) expect(false, 'protected-baseline-changed', item.file);
  baselineVerification.push({ file: item.file, baselineSha256: item.sha256, sha256: currentSha256,
    matches, allowedChange, snapshotMatchesManifest });
}
const historyFile = 'artifacts/g4a1/history-preservation.json', history = await json(historyFile);
expect(history?.mode === 'restore' && history.total === 736 && history.verifiedOriginalCount === 736
  && Array.isArray(history.remainingDifferent) && history.remainingDifferent.length === 0, 'history-restored-736', historyFile);
if (history?.baselineListSha256) expect(history.baselineListSha256 === hash(await bytes(baselineFile)), 'history-baseline-manifest-hash', historyFile);

const checksFile = 'artifacts/g4a1/checks.json', checks = await json(checksFile);
for (const command of ['npm run typecheck', 'npm run lint', 'npm run test', 'npm run test:catalog', 'npm run validate:catalog', 'npm run build']) {
  const script = command.slice('npm run '.length);
  const check = Array.isArray(checks) ? checks.find((item) => item.command === command || item.npmScript === script) : null;
  expect(check?.exitCode === 0, 'required-check-passed', command);
  if (check?.log) await bytes(check.log);
}
const testLog = await bytes('artifacts/g4a1/test.txt');
expect(testLog !== null && /Tests\s+203 passed\s*\(203\)/.test(testLog.toString('utf8').replace(/\x1b\[[0-9;]*m/g, '')), 'unit-203-passed', 'artifacts/g4a1/test.txt');
const e2eFile = 'artifacts/g4a1/e2e-full.json', e2e = await json(e2eFile);
expect(e2e?.stats?.expected === 62 && e2e.stats.unexpected === 0 && e2e.stats.skipped === 0 && e2e.stats.flaky === 0
  && Array.isArray(e2e.errors) && e2e.errors.length === 0, 'e2e-62-passed', e2eFile);
// The final change after this full suite is scoped CSS spacing plus a UI assertion.
// Revalidate all six refinement scenarios against that final production build.
const finalUiFile = 'artifacts/g4a1/e2e-refinement-final.json', finalUi = await json(finalUiFile);
expect(finalUi?.stats?.expected === 6 && finalUi.stats.unexpected === 0 && finalUi.stats.skipped === 0 && finalUi.stats.flaky === 0
  && Array.isArray(finalUi.errors) && finalUi.errors.length === 0, 'post-layout-fix-six-scenarios-passed', finalUiFile);

const profileBudgets = ['bodyInteractiveUnder5s', 'microReadyUnder5s', 'fpsP50AtLeast50', 'fpsP10AtLeast30', 'drawsUnder150',
  'initialPayloadUnder8MiB', 'bodyPlusMicroUnder8MiB', 'resourceIdsStable', 'noSceneFailure'];
const profiles = [];
for (const label of ['before', 'after']) for (const mode of ['flow', 'tracking']) for (const count of [100, 500, 2000]) {
  const file = `artifacts/g4a1/production-${label}-${mode}-${count}.json`, profile = await json(file);
  const valid = profile?.comparisonLabel === label && profile.scenario?.count === count && profile.scenario.seed === 17
    && profile.scenario.cameraMode === mode && profile.scenario.readyInitialProfile === 500
    && profile.protocol?.warmupMs === 10000 && profile.protocol.requestedSampleMs === 30000
    && profile.sample?.durationMs >= 30000 && profile.sample.documentVisibility === 'visible'
    && profileBudgets.every((key) => profile.budgets?.[key] === true)
    && Object.values(profile.budgets).every((value) => value === true) && emptyRuntime(profile.runtime);
  expect(valid, 'production-profile-budgets', file);
  profiles.push({ file, label, mode, count, valid, scenario: profile?.scenario, environment: profile?.environment,
    fpsP50: profile?.sample?.fpsP50, fpsP10: profile?.sample?.fpsP10, sampleMs: profile?.sample?.durationMs,
    budgets: profile?.budgets, runtimeCounts: Object.fromEntries(['errors', 'warnings', 'failedRequests', 'httpErrors']
      .map((key) => [key, Array.isArray(profile?.runtime?.[key]) ? profile.runtime[key].length : null])) });
}
for (const mode of ['flow', 'tracking']) for (const count of [100, 500, 2000]) {
  const before = profiles.find((item) => item.label === 'before' && item.mode === mode && item.count === count);
  const after = profiles.find((item) => item.label === 'after' && item.mode === mode && item.count === count);
  const keys = ['os', 'cpu', 'browser', 'renderer', 'viewport'];
  expect(keys.every((key) => before?.environment?.[key] !== undefined
    && JSON.stringify(before.environment[key]) === JSON.stringify(after?.environment?.[key])), 'profile-pair-same-environment', before.file);
}

const staticFile = 'artifacts/g4a1/occlusion-study.json', staticStudy = await json(staticFile);
const staticRecords = staticStudy?.records ?? [];
expect(staticRecords.length === 9, 'static-nine-scenarios', staticFile);
for (const seed of [17, 31, 73]) for (const count of [100, 500, 2000]) {
  const record = staticRecords.find((item) => item.seed === seed && item.count === count);
  expect(record?.trajectoryHashesMatch === true && record.before?.frames?.length === 81 && record.after?.frames?.length === 81
    && record.before.frames.every((frame, index) => frame.seconds === index * .5 && frame.hash === record.after.frames[index]?.hash)
    && Number.isFinite(record.before.meanVisible) && Number.isFinite(record.after.meanVisible)
    && record.after.severeOcclusionSeconds <= record.before.severeOcclusionSeconds, 'static-paired-81-poses-and-hashes', `${seed}/${count}`);
}
const measuredMeanImprovement = (records) => records.reduce((sum, record) => sum + record.after.meanVisible - record.before.meanVisible, 0) / records.length;
expect(Number.isFinite(staticStudy?.meanImprovement) && Math.abs(staticStudy.meanImprovement - measuredMeanImprovement(staticRecords)) < 1e-12,
  'static-aggregate-consistent', staticFile);
const liveFile = 'artifacts/g4a1/playback-occlusion-study.json', live = await json(liveFile);
const liveRecords = live?.records ?? [];
expect(liveRecords.length === 3 && live.allTrajectoryHashesMatch === true && live.fps === 60, 'live-three-scenarios', liveFile);
for (const [count, seed] of [[500, 17], [2000, 17], [500, 73]]) {
  const record = liveRecords.find((item) => item.count === count && item.seed === seed);
  expect(record?.trajectoryHashesMatch === true && record.sampledMatrixHashesMatch === true
    && record.before?.sampleCount === 81 && record.after?.sampleCount === 81
    && record.before.frames?.length === 81 && record.after.frames?.length === 81
    && record.before.frames.every((frame, index) => frame.seconds === index * .5 && frame.hash === record.after.frames[index]?.hash)
    && record.before.allFramePositionDigest === record.after.allFramePositionDigest
    && record.after.motion?.playbackFrameCount === 2400 && record.after.motion.maxAcceleration <= 15
    && record.after.motion.minimumConsecutiveUpDot > .999
    && record.after.severeOcclusionSeconds <= record.before.severeOcclusionSeconds
    && Number.isFinite(record.after.motion.minimumOtherCellBoundGap), 'live-hashes-motion-and-severe-occlusion', `${seed}/${count}`);
}
expect(Number.isFinite(live?.meanImprovement) && Math.abs(live.meanImprovement - measuredMeanImprovement(liveRecords)) < 1e-12,
  'live-aggregate-consistent', liveFile);
for (const source of live?.sources ?? []) {
  const data = await bytes(source.path);
  expect(data !== null && hash(data) === source.sha256, 'live-study-source-hash-current', source.path);
}
expect((live?.sources?.length ?? 0) >= 7, 'live-source-manifest', liveFile);

const captureNames = ['overview', 'rc-selected', 'tracking-occlusion', 'rbc-closeup', 'wall', 'desktop', 'mobile'];
const captureVerification = [];
async function verifyCapture(item, directory) {
  const file = `${directory}/${item.file}`, data = await bytes(file);
  const matches = data !== null && hash(data) === item.sha256;
  expect(matches && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'real-png-hash', file);
  captureVerification.push({ file, matches, sha256: item.sha256 });
}
for (const label of ['before', 'after']) {
  const file = `${review}/${label}/captures.json`, captures = await json(file);
  expect(captures?.comparisonLabel === label && captureNames.every((name) => captures.captures?.some((item) => item.name === name))
    && captures.captures.length === 7 && emptyRuntime(captures.runtime), 'seven-captures-and-runtime', file);
  const buildDirectory = label === 'before' ? `${baselineDirectory}/dist` : 'dist';
  const document = await bytes(`${buildDirectory}/index.html`);
  expect(document !== null && hash(document) === captures?.source?.documentSha256, 'capture-served-build-document', file);
  for (const script of captures?.source?.servedScripts ?? []) await bytes(`${buildDirectory}/${new URL(script).pathname.replace(/^\//, '')}`);
  for (const item of captures?.captures ?? []) await verifyCapture(item, review);
}
const comparisonsFile = `${review}/comparisons.json`, comparisons = await json(comparisonsFile);
expect(comparisons?.comparisons?.length === 7 && Array.isArray(comparisons.pendingViews) && comparisons.pendingViews.length === 0
  && comparisons.comparisons.every((item) => item.sameTimeline && item.sameIdentity && item.sameConfig && typeof item.matched === 'boolean'), 'comparisons-complete-and-disclosed', comparisonsFile);
for (const file of [`${review}/INDEX.md`, `${review}/comparison-contact.svg`]) await bytes(file);
const playbackFile = `${review}/after/playback.json`, playback = await json(playbackFile);
expect(playback?.simulationSecondsObserved >= 42 && playback.captures?.length === 8 && playback.samples?.length > 0
  && playback.samples.every((item, index, all) => item.selectedId === 'rc:17:0' && (index === 0 || item.seconds >= all[index - 1].seconds)), 'real-playback-42-seconds-eight-frames', playbackFile);
for (const item of playback?.captures ?? []) await verifyCapture(item, review);
let videoMatches = false;
if (playback?.file) {
  const data = await bytes(`${review}/${playback.file}`);
  videoMatches = data !== null && data.length > 0 && hash(data) === playback.sha256;
}
expect(videoMatches, 'playback-video-hash', playbackFile);
const decodingFile = 'artifacts/g4a1/video-decoding.json', decoding = await json(decodingFile);
expect(decoding?.source === `${review}/${playback?.file}` && decoding.sourceSHA256 === playback?.sha256
  && decoding.frames?.length === 3, 'decoded-frames-match-final-video', decodingFile);
for (const timestamp of [15, 30, 45]) {
  const frame = decoding?.frames?.find((item) => item.videoTimestampSeconds === timestamp);
  const data = frame?.file ? await bytes(frame.file) : null;
  expect(frame?.exitCode === 0 && data !== null && hash(data) === frame.sha256, 'video-frame-decoded-and-hashed', `${timestamp}s`);
}

const privacyFile = 'artifacts/g4a1/evidence-sanitization.json', privacy = await json(privacyFile);
expect(Array.isArray(privacy?.files) && privacy.files.length > 0, 'sanitization-manifest', privacyFile);
const sanitizationVerification = [];
for (const item of privacy?.files ?? []) {
  if (item.path === output) continue; // A previous audit report may be present on a repeated sanitation run.
  const data = await bytes(item.path), backup = await bytes(item.backup);
  const matches = data !== null && hash(data) === item.afterSHA256 && backup !== null && hash(backup) === item.beforeSHA256;
  expect(matches, 'sanitization-current-and-raw-backup-hashes', item.path);
  sanitizationVerification.push({ file: item.path, matches });
}
const sanitizedPaths = new Set((privacy?.files ?? []).map((item) => item.path));
for (const file of await filesIn('artifacts/g4a1')) {
  if (file === output || file === privacyFile || !/\.(?:json|txt)$/.test(file)) continue;
  expect(sanitizedPaths.has(file), 'sanitization-covers-current-evidence', file);
}

const changedTracked = gitFiles('diff', '--name-only', '-z'), addedUntracked = gitFiles('ls-files', '--others', '--exclude-standard', '-z');
const staged = gitFiles('diff', '--cached', '--name-only', '-z');
const head = git('rev-parse', 'HEAD'), originMain = git('rev-parse', 'origin/main'), branch = git('branch', '--show-current');
expect(head === checkpoint && originMain === checkpoint && branch === 'main' && staged.length === 0, 'git-local-main-checkpoint-no-staging');
const inventory = [], securityFindings = [], personalPathFindings = [];
const patterns = [
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['api-secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g],
  ['aws-access-key', /\bAKIA[A-Z0-9]{16}\b/g],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
function scan(file, data) {
  if (/\.(?:png|webm|glb)$/i.test(file)) return;
  const text = data.toString('utf8');
  const personalCount = [...text.matchAll(/(?:[A-Za-z]:[\\/]+Users[\\/]+[A-Za-z0-9_.-]+|\/(?:Users|home)\/[A-Za-z0-9_.-]+(?=\/))/g)].length;
  if (personalCount) personalPathFindings.push({ file, count: personalCount });
  for (const [rule, pattern] of patterns) {
    const count = [...text.matchAll(pattern)].length;
    if (count) securityFindings.push({ file, rule, count });
  }
  if (file.endsWith('.json')) { try { JSON.parse(text.replace(/^\uFEFF/, '')); } catch { expect(false, 'inventory-json-parse', file); } }
}
for (const file of [...new Set([...changedTracked, ...addedUntracked])].sort()) {
  if (file === output || file === 'flow-and-tracking.webm') continue;
  const data = await bytes(file);
  if (!data) continue;
  const sha256 = hash(data), previous = baselineByPath.get(file);
  if (previous?.sha256 === sha256) continue;
  if (!previous) expect(/^(?:artifacts\/g4a1\/[^/]+\.(?:json|txt)|artifacts\/gates\/G4A1-review\/|docs\/G4A1_REFINEMENT\.md$|src\/scene\/vascular\/(?:tracking|visibility)(?:\.test)?\.ts$|tests\/e2e\/g4a1-(?:refinement\.spec\.ts|occlusion-study\.mjs|playback-study\.mjs|production-profile\.js)$)/.test(file), 'new-file-within-G4A1-scope', file);
  inventory.push({ file, bytes: data.length, sha256, baselineSha256: previous?.sha256 ?? null });
  scan(file, data);
}
const buildInventory = [], unexpectedBuildFiles = [];
for (const file of await filesIn('dist')) {
  const data = await bytes(file);
  if (!data) continue;
  buildInventory.push({ file, bytes: data.length, sha256: hash(data) }); scan(file, data);
  const approved = /^dist\/(?:index\.html|atlas-mark\.svg|catalog\.json|ASSET_LICENSES\.md|assets\/[^/]+\.(?:js|css)|assets\/fixtures\/(?:atlas-(?:static|rigged)-v1\.glb|manifest\.json))$/.test(file);
  if (!approved) unexpectedBuildFiles.push(file);
  if (!/\.(?:js|css|html)$/.test(file) && approved) {
    const source = await bytes(`public/${file.slice(5)}`);
    expect(source !== null && hash(source) === hash(data), 'build-public-resource-hash', file);
  }
}
expect(buildInventory.length > 0 && unexpectedBuildFiles.length === 0, 'build-contains-only-approved-public-files');
expect(securityFindings.length === 0 && personalPathFindings.length === 0, 'no-detected-secrets-or-personal-paths');
const unclassifiedData = await bytes('flow-and-tracking.webm', false);
const unclassified = { file: 'flow-and-tracking.webm', classification: 'existing-unclassified-file-outside-build',
  present: unclassifiedData !== null, bytes: unclassifiedData?.length ?? null, sha256: unclassifiedData ? hash(unclassifiedData) : null,
  baselineIncluded: baselineByPath.has('flow-and-tracking.webm'),
  note: 'Preserved without viewing or interpreting. This audit does not approve its origin/license or classify it as a project source/asset. It is absent from the allowed build inventory.' };

const report = {
  createdAt: new Date().toISOString(), gate: 'G4A.1', passed: failures.length === 0, failures,
  git: { branch, head, originMain, originMainMeaning: 'Local remote-tracking ref; this helper makes no network requests.',
    aheadBehind: git('rev-list', '--left-right', '--count', 'HEAD...origin/main'), changedTracked, addedUntracked, staged,
    publication: 'No commit, push or deploy performed by this audit; checkpoint remains unchanged.' },
  baseline: { file: baselineFile, manifestSha256: hash(await bytes(baselineFile)), total: entries.length, historicalCount: historical.length,
    nonArtifactPathCount: sources.length, verification: baselineVerification },
  preservation: { file: historyFile, verifiedOriginalCount: history?.verifiedOriginalCount, remainingDifferent: history?.remainingDifferent },
  checks, units: { expected: 203, log: 'artifacts/g4a1/test.txt' }, e2e: { file: e2eFile, stats: e2e?.stats },
  postLayoutUi: { file: finalUiFile, stats: finalUi?.stats, meaning: 'The same six refinement scenarios rerun after the final scoped CSS spacing fix; not six additional unique scenarios.' }, profiles,
  visibility: { static: { file: staticFile, pairedPoses: staticRecords.reduce((sum, item) => sum + (item.after?.frames?.length ?? 0), 0), posesPerVersion: 729,
    totalBeforeAfterSamples: 1458, meanImprovement: staticStudy?.meanImprovement,
    initialTargetMeanImprovement: staticStudy?.initialTargetMeanImprovement, initialTargetMet: staticStudy?.meanImprovement >= staticStudy?.initialTargetMeanImprovement,
    initialTargetIsTechnicalPassCondition: false },
    live: { file: liveFile, pairedPoses: 243, totalBeforeAfterSamples: 486, meanImprovement: live?.meanImprovement, records: liveRecords.map(({ count, seed, before, after }) => ({ count, seed,
      beforeMeanVisible: before.meanVisible, afterMeanVisible: after.meanVisible, beforeSevereSeconds: before.severeOcclusionSeconds,
      afterSevereSeconds: after.severeOcclusionSeconds, afterMotion: after.motion })) },
    meaning: 'Actual triangle-silhouette9x9 diagnostic, not pixel-perfect visibility, physiology or a GPU/FPS benchmark. The initial static improvement target is reported honestly rather than silently lowered.' },
  captures: { verification: captureVerification, videoMatches, comparisons: comparisons?.comparisons,
    humanArtisticApproval: 'Pending; hashes/numeric evidence do not grant artistic approval.' },
  privacy: { file: privacyFile, verification: sanitizationVerification },
  security: { method: 'Directed high-confidence secret patterns and personal-path patterns; values never printed. No universal credential guarantee.', securityFindings, personalPathFindings },
  scope: { authorizedBaselineChanges: [...authorizedChanges], protectedBaselinePaths: sources.filter((item) => !authorizedChanges.has(item.file) && item.file !== 'flow-and-tracking.webm').map((item) => item.file),
    unexpectedBuildFiles, noNewDependencies: baselineVerification.filter((item) => ['package.json', 'package-lock.json'].includes(item.file)).every((item) => item.matches),
    buildProvenance: 'Build inventory is limited to compiled code/styles and existing public original fixtures/catalog/mark/provenance. No copied research figures or unclassified video are approved or packaged by this audit.' },
  unclassifiedFiles: [unclassified], inventory, buildInventory,
  limitations: ['Human artistic approval pending.', 'Emulated mobile uses the workstation GPU.', 'Micro counters exclude resident Body GPU resources.',
    'Conservative cell bounds can overlap the camera in the dense profile; neither this diagnostic nor the adaptive view guarantees cell collision avoidance.',
    'Playback easing has presentation history; absolute paused/scrub/reduced-motion references and particle samplers remain deterministic.'],
};
await writeFile(safePath(output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, output, failures, inventoryCount: inventory.length, historicalVerified: baselineVerification.filter((item) => item.file.startsWith('artifacts/') && item.matches).length,
  captureCount: captureVerification.length, profiles: profiles.length, secretFindingCount: securityFindings.length, personalPathFindingCount: personalPathFindings.length }, null, 2));
if (!report.passed) process.exitCode = 1;
}
main().catch(() => { console.error('Final evidence audit could not complete. No file contents, secret values or absolute paths were printed.'); process.exitCode = 1; });
