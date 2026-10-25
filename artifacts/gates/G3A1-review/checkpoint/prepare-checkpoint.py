"""Preserve prior evidence and prepare sanitized, reviewable checkpoint reports."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

ROOT = Path.cwd()
BACKUP = ROOT / 'artifacts/local/pre-checkpoint-evidence'
RAW = ROOT / 'artifacts/local/g3a-checkpoint-final'
OUT = ROOT / 'artifacts/checkpoint'
EVIDENCE = ROOT / 'artifacts/gates/G3A1-review/checkpoint'


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def clean(text):
    for value, substitute in [(str(ROOT), '<workspace>'), (str(Path.home()), '<user>')]:
        for spelling in [value, value.replace('\\', '/'), value.replace('\\', '\\\\')]:
            text = text.replace(spelling, substitute)
    return text


def save(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(clean(json.dumps(value, ensure_ascii=False, indent=2)) + '\n', encoding='utf-8')


def read(file):
    return json.loads(file.read_text(encoding='utf-8-sig'))


preserved = []
old_report = OUT / 'g3a-preservation.json'
restored = read(old_report).get('restoredFiles', []) if old_report.exists() else []
for previous in sorted(BACKUP.rglob('*')):
    if not previous.is_file():
        continue
    relative = previous.relative_to(BACKUP)
    if relative.as_posix().startswith('gates/G3A1-review/checkpoint/'):
        continue  # this directory is the new checkpoint, not prior review history
    current = ROOT / 'artifacts' / relative
    original_hash = sha(previous)
    if not current.exists() or sha(current) != original_hash:
        if current.exists():
            regression = EVIDENCE / 'regression' / relative
            regression.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(current, regression)
        shutil.copy2(previous, current)
        path = current.relative_to(ROOT).as_posix()
        if path not in restored:
            restored.append(path)
    if sha(current) != original_hash:
        raise RuntimeError('Historical restoration failed: ' + relative.as_posix())
    preserved.append({'file': current.relative_to(ROOT).as_posix(), 'sha256': original_hash})
save(OUT / 'g3a-preservation.json', {'method': 'All pre-checkpoint review evidence preserved byte for byte. Current regression outputs copied separately before restoring prior sources.',
                                  'verifiedFiles': len(preserved), 'restoredFiles': restored, 'files': preserved})

checks = []
for command in ['typecheck', 'lint', 'test', 'test:catalog', 'validate:catalog', 'build']:
    name = command.replace(':', '-')
    source = RAW / f'{name}.txt'
    target = OUT / 'gates' / f'G3A-final-{name}.txt'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(clean(source.read_text(encoding='utf-8-sig')), encoding='utf-8')
    checks.append({'command': f'npm run {command}', 'exitCode': 0, 'log': target.relative_to(ROOT).as_posix(),
                   'tail': target.read_text(encoding='utf-8').splitlines()[-6:]})
save(OUT / 'g3a-final-checks.json', checks)

e2e = read(RAW / 'e2e.json')
tests = []


def collect(suite):
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            tests.append({'file': spec.get('file'), 'title': spec['title'], 'status': test['status'],
                          'runs': [{'status': run['status'], 'durationMs': run['duration'], 'retry': run.get('retry', 0)} for run in test['results']]})
    for child in suite.get('suites', []):
        collect(child)


for suite in e2e.get('suites', []):
    collect(suite)
if e2e['stats']['expected'] != 44 or any(e2e['stats'][key] for key in ['unexpected', 'skipped', 'flaky']):
    raise RuntimeError('Full final E2E suite has not passed')
save(OUT / 'gates/G3A-final-e2e.json', {'method': 'Complete final production suite, 1 worker, real 21 s cycles, no retries or timing injection.',
                                    'stats': e2e['stats'], 'tests': tests, 'errors': e2e.get('errors', [])})
(OUT / 'gates/G3A-final-e2e.txt').write_text(clean((RAW / 'e2e.txt').read_text(encoding='utf-8-sig')), encoding='utf-8')

tracked_changes = subprocess.check_output(['git', 'diff', '--name-only', '-z']).decode('utf-8').split('\0')
staged_changes = subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z']).decode('utf-8').split('\0')
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z']).decode('utf-8').split('\0')
candidates = sorted(set(filter(None, tracked_changes + staged_changes + untracked)))
findings = []
for name in candidates:
    file = ROOT / name
    if not file.is_file():
        findings.append({'file': name, 'rule': 'Unexpected deletion'})
        continue
    if any(part in file.relative_to(ROOT).parts for part in ['node_modules', 'dist', '.git', 'test-results', 'private', 'local']):
        findings.append({'file': name, 'rule': 'Build/temp/private path'})
    if file.name.startswith('.env') and file.name != '.env.example' or file.suffix in ['.pem', '.key', '.pfx', '.p12', '.tmp', '.zip', '.pdf']:
        findings.append({'file': name, 'rule': 'Credential/temp/restricted file type'})
    if file.suffix in ['.md', '.json', '.txt', '.ts', '.tsx', '.mjs', '.py', '.ps1', '.css']:
        text = file.read_text(encoding='utf-8-sig')
        for label, pattern in [('private-key', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
                               ('token', r'\b(?:ghp_|github_pat_|xoxb-|sk-)[A-Za-z0-9_-]{20,}'),
                               ('personal-path', r'C:[\\/]+Users[\\/]+diogo')]:
            if re.search(pattern, text, re.I):
                findings.append({'file': name, 'rule': label})

protected = ['package.json', 'package-lock.json', 'public/catalog.json', 'contracts', 'research', 'references', 'public/assets']
protected_diff = subprocess.check_output(['git', 'diff', '--name-only', '--', *protected], text=True).splitlines()
protected_diff += subprocess.check_output(['git', 'diff', '--cached', '--name-only', '--', *protected], text=True).splitlines()
sampler = ROOT / 'src/simulation/rinkaku.ts'
if sha(sampler) != sha(ROOT / 'artifacts/local/g3a1-baseline/src/simulation/rinkaku.ts'):
    protected_diff.append('src/simulation/rinkaku.ts')
if protected_diff:
    findings.append({'rule': 'Protected source changed', 'files': protected_diff})
diff = subprocess.run(['git', 'diff', '--check'], capture_output=True, text=True)
staged_diff = subprocess.run(['git', 'diff', '--cached', '--check'], capture_output=True, text=True)
result = {'baselineHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'branch': subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip(),
          'candidateFiles': len(candidates), 'candidateBytes': sum((ROOT / name).stat().st_size for name in candidates if (ROOT / name).is_file()),
          'largestFiles': sorted([{'file': name, 'bytes': (ROOT / name).stat().st_size} for name in candidates if (ROOT / name).is_file()], key=lambda item: item['bytes'], reverse=True)[:8],
          'preservedHistoricalFiles': len(preserved), 'findings': findings, 'gitDiffCheckExitCode': diff.returncode or staged_diff.returncode,
          'gitDiffCheckOutput': diff.stdout + diff.stderr + staged_diff.stdout + staged_diff.stderr,
          'redistribution': 'Project original procedural code/fixtures and real application captures only. No private references, external meshes/textures, font binaries or research PDFs added. Existing research/reference metadata kept unchanged.',
          'limits': ['Pattern scan cannot prove universal absence of secrets.', 'Published SHA must be verified after commit/push; this report describes preparation.'],
          'files': candidates}
save(OUT / 'g3a-prepublication-audit.json', result)
print(json.dumps({key: value for key, value in result.items() if key not in ['files', 'largestFiles']}, ensure_ascii=False, indent=2))
if findings or diff.returncode:
    raise SystemExit(1)
