"""Read-only package checks after capture, composition and historical restoration."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path.cwd()
REVIEW = ROOT / 'artifacts/gates/G3A1-review'
RESULTS = ROOT / 'artifacts/g3a1'


def read(file):
    return json.loads(file.read_text(encoding='utf-8-sig'))


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


failures = []
manifest = read(REVIEW / 'compositions.json')
for composition in manifest['compositions']:
    if sha(REVIEW / composition['file']) != composition['sha256'].lower():
        failures.append(composition['file'])
    for source in composition['sources']:
        if sha(ROOT / source['file']) != source['sourceSha256'].lower():
            failures.append(source['file'])
if len(manifest['compositions']) != 8 or manifest['pending']:
    failures.append('Composition count or pending inputs')

broken_links = []
for document in [REVIEW / name for name in ['INDEX.md', 'REPORT.md', 'INVENTORY.md']] + [ROOT / 'docs/G3A1_REFINEMENT.md']:
    for match in re.finditer(r'\[[^\]]*\]\(([^)]+)\)', document.read_text(encoding='utf-8')):
        target = match.group(1).strip('<>').split('#')[0]
        if not target or re.match(r'^\w+://', target):
            continue
        if not (document.parent / target).resolve().exists():
            broken_links.append({'file': document.relative_to(ROOT).as_posix(), 'target': target})
if broken_links:
    failures.append('Broken local Markdown links')

revisit_identical = sha(REVIEW / 'revisit/t0700-before.png') == sha(REVIEW / 'revisit/t0700-after.png')
if not revisit_identical:
    failures.append('PNG revisit differs')

e2e = read(RESULTS / 'e2e-results.json')
if e2e['stats']['expected'] != 40 or any(e2e['stats'][key] for key in ['unexpected', 'flaky', 'skipped']):
    failures.append('E2E results')
profiles = ['baseline-standard-fresh.json', 'production-standard.json', 'production-low.json', 'production-emulated-mobile-standard.json']
for file in profiles:
    result = read(RESULTS / file)
    if not all(result['budgets'].values()) or any(result['runtime'][key] for key in ['errors', 'failedRequests', 'httpErrors']):
        failures.append(file)

film = read(REVIEW / 'comparison-captures.json')
if sha(REVIEW / film['video']['file']) != film['video']['sha256'].lower() or film['runtime']['errors']:
    failures.append('Film provenance or runtime')
for recording in [film['recordings'][0], film['recordings'][-1]]:
    if len({sample['phase'] for sample in recording['samples']}) != 7:
        failures.append('Complete film missing a phase')
frames = read(REVIEW / 'film-frames/manifest.json')
for frame in frames['frames']:
    if sha(ROOT / frame['file']) != frame['sha256'].lower():
        failures.append(frame['file'])

findings = []
patterns = {'private-key': r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
            'credential-token': r'\b(?:ghp_|github_pat_|xoxb-|sk-)[A-Za-z0-9_-]{20,}',
            'personal-absolute-path': r'C:[\\/]+Users[\\/]+diogo'}
for folder in [REVIEW, RESULTS]:
    for file in folder.rglob('*'):
        if file.suffix.lower() not in ['.md', '.json', '.txt', '.mjs', '.py', '.ps1']:
            continue
        text = file.read_text(encoding='utf-8-sig')
        for name, pattern in patterns.items():
            if re.search(pattern, text, re.I):
                findings.append({'file': file.relative_to(ROOT).as_posix(), 'rule': name})
if findings:
    failures.append('Sensitive-data scan')

preservation = read(RESULTS / 'final-audit.json')
if preservation['historicalChangedAfterRestoration'] or preservation['protectedSourceChanges'] or preservation['gitDiffCheckExitCode']:
    failures.append('Preservation audit')
result = {'compositionsVerified': len(manifest['compositions']), 'comparisonPairs': len(manifest['matchedComparisons']),
          'brokenLocalLinks': broken_links, 'revisitPngByteIdentical': revisit_identical, 'e2e': e2e['stats'],
          'freshProfilesVerified': len(profiles), 'filmFramesVerified': len(frames['frames']),
          'historicalFilesVerified': preservation['historicalFilesVerified'], 'sensitiveDataFindings': findings,
          'failures': failures, 'limits': ['Pattern scanning is not a universal secret detector.', 'Hashes and tests do not certify artistic approval.']}
(REVIEW / 'verify-package.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2, ensure_ascii=False))
if failures:
    raise SystemExit(1)
