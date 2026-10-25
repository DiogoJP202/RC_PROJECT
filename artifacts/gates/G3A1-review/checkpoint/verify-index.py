"""Check staged artifact bytes, including CRLF evidence, before publication."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path.cwd()
names = subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z']).decode('utf-8').split('\0')
history = json.loads((root / 'artifacts/checkpoint/g3a-preservation.json').read_text(encoding='utf-8'))
paths = sorted(({name for name in names if name.startswith('artifacts/')} | {item['file'] for item in history['files']})
               - {'artifacts/checkpoint/g3a-staged-byte-verification.json'})
differences = []
for name in paths:
    staged = subprocess.check_output(['git', 'show', ':' + name])
    if hashlib.sha256(staged).digest() != hashlib.sha256((root / name).read_bytes()).digest():
        differences.append(name)
result = {'stagedArtifactsVerified': len(paths), 'byteDifferences': differences,
          'policy': 'Targeted -text rules preserve captured evidence exactly. CR-at-EOL and captured trailing empty log lines are recognized as archival data, not source-code whitespace errors.'}
(root / 'artifacts/checkpoint/g3a-staged-byte-verification.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
if differences:
    raise SystemExit(1)
