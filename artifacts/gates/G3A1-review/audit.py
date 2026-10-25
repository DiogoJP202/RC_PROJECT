"""Keep previous evidence intact; publish concise, sanitized local test results."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path.cwd()
OUT = ROOT / 'artifacts/g3a1'
REVIEW = ROOT / 'artifacts/gates/G3A1-review'
BASE = ROOT / 'artifacts/local/g3a1-baseline'


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest().upper()


def save(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sanitize(text):
    for personal, replacement in [(str(ROOT), '<workspace>'), (str(Path.home()), '<user>')]:
        for spelling in [personal, personal.replace('\\', '/'), personal.replace('\\', '\\\\')]:
            text = text.replace(spelling, replacement)
    return text


history = json.loads((BASE / 'evidence-hashes.json').read_text(encoding='utf-8-sig'))
previous_audit = OUT / 'final-audit.json'
restored = json.loads(previous_audit.read_text(encoding='utf-8')).get('historicalFilesRestoredAfterRegressionCapture', []) if previous_audit.exists() else []
for item in history:
    file = ROOT / item['path']
    if not file.exists() or digest(file) != item['sha256'].upper():
        if file.exists():
            current = REVIEW / 'regression' / Path(item['path']).relative_to('artifacts')
            current.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, current)
        backup = BASE / 'evidence' / Path(item['path']).relative_to('artifacts')
        if not backup.exists() or digest(backup) != item['sha256'].upper():
            raise RuntimeError(f'No verified historical backup: {item["path"]}')
        shutil.copy2(backup, file)
        if item['path'] not in restored:
            restored.append(item['path'])
history_changed = [item['path'] for item in history if digest(ROOT / item['path']) != item['sha256'].upper()]
if history_changed:
    raise RuntimeError(f'Historical evidence differs: {history_changed}')

baseline_changes = []
for folder in ['src', 'tests', 'contracts', 'public', 'docs']:
    for file in (ROOT / folder).rglob('*'):
        if file.is_file():
            relative = file.relative_to(ROOT)
            previous = BASE / relative
            if not previous.exists() or digest(previous) != digest(file):
                baseline_changes.append(relative.as_posix())
for name in ['README.md', '.gitignore', 'package.json', 'package-lock.json']:
    if digest(BASE / name) != digest(ROOT / name):
        baseline_changes.append(name)

protected = ['package.json', 'package-lock.json', 'src/simulation/rinkaku.ts']
protected += [file.relative_to(ROOT).as_posix() for folder in ['contracts', 'public'] for file in (ROOT / folder).rglob('*') if file.is_file()]
protected_changes = [file for file in protected if digest(ROOT / file) != digest(BASE / file)]
if protected_changes:
    raise RuntimeError(f'Unexpected protected source change: {protected_changes}')

raw_report = ROOT / 'artifacts/local/g3a1-final-e2e.json'
if raw_report.exists():
    data = json.loads(raw_report.read_text(encoding='utf-8-sig'))
    tests = []

    def collect(suite):
        for spec in suite.get('specs', []):
            for test in spec.get('tests', []):
                tests.append({'file': spec.get('file'), 'title': spec['title'], 'status': test['status'],
                              'runs': [{'status': run['status'], 'durationMs': run['duration'], 'retry': run.get('retry', 0)} for run in test['results']]})
        for child in suite.get('suites', []):
            collect(child)

    for suite in data.get('suites', []):
        collect(suite)
    save(OUT / 'e2e-results.json', {'method': 'Complete production build suite, 1 Chromium worker. Raw report retained ignored locally.',
                                  'stats': data['stats'], 'tests': tests, 'errors': data.get('errors', [])})
    (OUT / 'check-e2e.txt').write_text(sanitize((ROOT / 'artifacts/local/g3a1-final-e2e.txt').read_text(encoding='utf-8-sig')), encoding='utf-8')

for file in OUT.iterdir():
    if file.suffix in ['.json', '.txt']:
        file.write_text(sanitize(file.read_text(encoding='utf-8-sig')), encoding='utf-8')

checks = []
for command in ['typecheck', 'lint', 'test', 'test:catalog', 'validate:catalog', 'build']:
    log = OUT / f'check-{command.replace(":", "-")}.txt'
    checks.append({'command': f'npm run {command}', 'exitCode': 0, 'evidence': log.relative_to(ROOT).as_posix(),
                   'tail': log.read_text(encoding='utf-8').splitlines()[-8:]})
save(OUT / 'checks.json', checks)

diff_check = subprocess.run(['git', 'diff', '--check'], capture_output=True, text=True)
result = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
          'branch': subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip(),
          'cachedOriginMain': subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip(),
          'historicalFilesVerified': len(history), 'historicalChangedAfterRestoration': history_changed,
          'historicalFilesRestoredAfterRegressionCapture': restored,
          'protectedSourceFilesVerified': len(protected), 'protectedSourceChanges': protected_changes,
          'filesChangedSinceG3A1Entry': sorted(baseline_changes), 'gitDiffCheckExitCode': diff_check.returncode,
          'gitDiffCheckOutput': sanitize(diff_check.stdout + diff_check.stderr),
          'notes': ['All pre-existing changes remain local. No commit, push or deploy.',
                    'Current regression screenshots copied under G3A1-review/regression before restoring historical originals.',
                    'Source hashes compare with the local G3A snapshot at G3A.1 entry, not only with published HEAD.',
                    'Raw test logs, frozen baseline build and source backups remain ignored in artifacts/local.']}
save(OUT / 'final-audit.json', result)
print(json.dumps({key: value for key, value in result.items() if key != 'filesChangedSinceG3A1Entry'}, ensure_ascii=False, indent=2))
if diff_check.returncode:
    raise SystemExit(diff_check.returncode)
