"""Verify the final checkpoint's evidence without modifying historical reports."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path.cwd()
FOLDER = ROOT / 'artifacts/gates/G3A1-review/checkpoint'
REPORTS = ROOT / 'artifacts/checkpoint'


def read(file):
    return json.loads(file.read_text(encoding='utf-8-sig'))


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


preservation = read(REPORTS / 'g3a-preservation.json')
for item in preservation['files']:
    assert sha(ROOT / item['file']) == item['sha256'], item['file']
opaque = read(FOLDER / 'terminal-retraction.json')
transparent = read(FOLDER / 'terminal-transparent.json')
pixel_comparisons = 0
for group in opaque['samples']:
    for sample in group['sequence']:
        assert sha(ROOT / sample['file']) == sample['sha256']
        if sample['t'] >= .999:
            assert sample['sha256'] == group['restSha256']
            pixel_comparisons += 1
for sample in transparent['samples']:
    assert sha(ROOT / sample['file']) == sample['sha256'] == sample['restSha256']
    pixel_comparisons += 1
for revision in ['after', 'after-translucent']:
    capture = read(FOLDER / revision / 'captures.json')
    for item in capture['captures']:
        assert sha(ROOT / item['file']) == item['sha256']
    movie = capture['recording']
    assert sha(ROOT / movie['file']) == movie['sha256']
    for sequence in movie['sequences']:
        times = [sample['t'] for sample in sequence['samples']]
        assert all(a <= b for a, b in zip(times, times[1:]))
        assert sequence['samples'][-1]['t'] == 1
        assert not sequence['samples'][-1]['visible']
        assert sequence['samples'][-1]['particleCount'] == 0
e2e = read(REPORTS / 'gates/G3A-final-e2e.json')
assert e2e['stats']['expected'] == 44
assert not any(e2e['stats'][key] for key in ['unexpected', 'skipped', 'flaky'])
profile = read(REPORTS / 'gates/G3A-final-profile.json')
assert all(profile['budgets'].values())
assert not any(profile['runtime'][key] for key in ['errors', 'failedRequests', 'httpErrors'])
assert read(REPORTS / 'g3a-approved-poses.json')['allIdentical']
assert not read(REPORTS / 'g3a-prepublication-audit.json')['findings']
broken = []
for file in [ROOT / 'docs/G3A_CHECKPOINT.md', FOLDER / 'README.md']:
    for match in re.finditer(r'\[[^\]]*\]\(([^)]+)\)', file.read_text(encoding='utf-8')):
        target = match.group(1).strip('<>').split('#')[0]
        if target and not re.match(r'^\w+://', target) and not (file.parent / target).resolve().exists():
            broken.append({'file': file.relative_to(ROOT).as_posix(), 'target': target})
assert not broken, broken
result = {'historicalFilesVerified': preservation['verifiedFiles'], 'terminalPngComparisons': pixel_comparisons,
          'allTerminalPngsIdenticalToRest': True, 'finalMoviesVerified': 2, 'approvedPoseHashesIdentical': 24,
          'e2e': e2e['stats'], 'profileBudgetsPassed': True, 'brokenLinks': broken,
          'sourceHashes': {path: sha(ROOT / path) for path in ['src/scene/rinkaku/ProceduralRinkakuAdapter.ts',
               'src/simulation/rinkaku.ts', 'src/state/rinkaku.ts', 'src/scene/visibility.ts', 'package-lock.json']},
          'notes': ['P1 approved by the human user with documented art caveats. P2 remains pending.',
                    'Git publication SHA and clean tree must be checked after commit/push.']}
(REPORTS / 'g3a-final-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: value for key, value in result.items() if key != 'sourceHashes'}, ensure_ascii=False, indent=2))
