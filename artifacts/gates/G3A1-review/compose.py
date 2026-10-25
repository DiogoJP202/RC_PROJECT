"""Arrange real application screenshots; never synthesize or retouch scene pixels.

Run from the workspace with: node tools/python.mjs artifacts/gates/G3A1-review/compose.py
Sources remain immutable. All paths in the resulting manifest are workspace-relative.
"""
from pathlib import Path
import hashlib
import json
import math

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parents[2]
OLD = ROOT.parent / 'G3A-review'
EPSILON = 1e-6
BACKGROUND = '#08131c'
LABELS = {
    'rest': 'Repouso', 'activation': 'Ativação', 'release': 'Liberação',
    'growth': 'Crescimento', 'fixation': 'Fixação visual',
    'active': 'Ativo', 'retract': 'Retração',
}
COMPOSITIONS = []
COMPARISONS = []
SKIPPED = []


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def font(size, bold=False):
    name = 'seguisb.ttf' if bold else 'segoeui.ttf'
    candidate = Path('C:/Windows/Fonts') / name
    if candidate.exists():
        return ImageFont.truetype(str(candidate), size)
    return ImageFont.truetype('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf', size)


def portable(path):
    resolved = path.resolve()
    if not resolved.is_relative_to(WORKSPACE):
        raise ValueError('Capture outside the workspace is not allowed')
    return resolved.relative_to(WORKSPACE).as_posix()


def source_path(item):
    file = Path(item['file'])
    if file.is_absolute():
        target = file
    elif file.parts[0] == 'artifacts':
        target = WORKSPACE / file
    elif file.parts[0] in ['before', 'after']:
        target = ROOT / file
    else:
        target = OLD / file if item.get('revision') == 'before' else ROOT / file
    portable(target)
    if not target.is_file():
        raise FileNotFoundError(portable(target))
    return target


def number_delta(a, b):
    return max(abs(float(x) - float(y)) for x, y in zip(a, b)) if len(a) == len(b) else math.inf


def check_pair(before, after, mobile=False):
    """Reject unfair desktop comparisons instead of merely labelling them comparable."""
    t_delta = abs(float(before['t']) - float(after['t']))
    if t_delta > EPSILON:
        raise ValueError(f"Timeline mismatch: {before['file']} / {after['file']}")
    config_equal = before['config'] == after['config']
    if not config_equal:
        raise ValueError(f"Configuration mismatch: {before['file']} / {after['file']}")
    opacity_delta = abs(float(before['bodyOpacity']) - float(after['bodyOpacity']))
    if opacity_delta > EPSILON:
        raise ValueError(f"Body opacity mismatch: {before['file']} / {after['file']}")
    camera_delta = max(number_delta(before['camera'][key], after['camera'][key]) for key in ['position', 'target'])
    if not mobile and camera_delta > EPSILON:
        raise ValueError(f"Camera mismatch ({camera_delta}): {before['file']} / {after['file']}")
    if not mobile and before['viewport'] != after['viewport']:
        raise ValueError('Desktop comparison viewports differ')
    if mobile and before['viewport']['width'] != after['viewport']['width']:
        raise ValueError('Mobile comparison widths differ')
    result = {
        'before': portable(source_path(before)), 'after': portable(source_path(after)),
        't': before['t'], 'timelineDelta': t_delta, 'configEqual': config_equal,
        'bodyOpacityDelta': opacity_delta, 'cameraMaximumDelta': camera_delta,
        'cameraEqualWithinTolerance': camera_delta <= EPSILON, 'tolerance': EPSILON,
        'cameraPolicy': 'Intentionally different mobile framing; same pose/configuration' if mobile else 'Identical position and target within tolerance',
    }
    COMPARISONS.append(result)
    return result


def capture_pixels(item, style='specimen'):
    path = source_path(item)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if item.get('sha256') and digest != item['sha256']:
        raise ValueError(f'Historical source hash changed: {portable(path)}')
    original = Image.open(path).convert('RGB')
    rect = item['stageRect']
    is_stage = item.get('captureArea') == 'stage' or (
        abs(original.width - rect['width']) <= 1 and abs(original.height - rect['height']) <= 1
    )
    if style == 'viewport':
        box = (0, 0, original.width, original.height)
    else:
        x, y = (0, 0) if is_stage else (rect['x'], rect['y'])
        width, height = rect['width'], rect['height']
        # One fixed region per panel for all times and both revisions.
        roi = (.18, .20, .88, .83) if style == 'specimen' else (0, 0, 1, 1)
        box = (round(x + width * roi[0]), round(y + height * roi[1]),
               round(x + width * roi[2]), round(y + height * roi[3]))
        if min(box[:2]) < 0 or box[2] > original.width or box[3] > original.height:
            raise ValueError(f'Crop exceeds the actual screenshot: {portable(path)}')
    crop = original.crop(box)
    provenance = {
        'file': portable(path), 'sourceSha256': digest, 'sourceDimensions': list(original.size),
        'cropBox': list(box), 'captureAreaResolved': 'stage' if is_stage else 'viewport',
        't': item['t'], 'phase': item.get('phase'), 'revision': item.get('revision', 'after'),
        'config': item['config'], 'camera': item['camera'], 'bodyOpacity': item['bodyOpacity'],
    }
    return crop, provenance


def sheet(name, title, subtitle, entries, columns, tile_width=290, style='specimen'):
    """Entries are (capture, caption, secondary caption), arranged in row order."""
    gap, top, bottom, caption_height = 14, 92, 45, 57
    images = [capture_pixels(item, style) for item, _, _ in entries]
    max_height = max(round(im.height * tile_width / im.width) for im, _ in images)
    rows = math.ceil(len(entries) / columns)
    cell_height = max_height + caption_height
    canvas = Image.new('RGB', (columns * tile_width + (columns + 1) * gap,
                              top + rows * (cell_height + gap) + bottom), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((gap, 12), title, font=font(27, True), fill='#e0dbd6')
    draw.text((gap, 53), subtitle, font=font(16), fill='#9eb8b6')
    provenance = []
    for index, ((item, caption, secondary), (pixels, source)) in enumerate(zip(entries, images)):
        x = gap + (index % columns) * (tile_width + gap)
        y = top + (index // columns) * (cell_height + gap)
        size = (tile_width, round(pixels.height * tile_width / pixels.width))
        # Resize preserves the screenshot aspect ratio; no scene compositing or repainting.
        canvas.paste(pixels.resize(size, Image.Resampling.LANCZOS), (x, y))
        draw.text((x, y + max_height + 5), caption, font=font(17, True), fill='#e5c4ca')
        draw.text((x, y + max_height + 31), secondary, font=font(14), fill='#abc0c1')
        source.update({'destinationBox': [x, y, x + size[0], y + size[1]],
                       'caption': caption, 'secondaryCaption': secondary})
        provenance.append(source)
    draw.text((gap, canvas.height - 31),
              'PROXY / CONCEPTUAL MODEL · pixels reais: recorte, redução, organização e legendas · aprovação artística pendente',
              font=font(14), fill='#bbad92')
    target = ROOT / name
    canvas.save(target, optimize=True)
    COMPOSITIONS.append({
        'file': name, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'dimensions': list(canvas.size), 'sources': provenance,
        'operations': 'Fixed crop, aspect-preserving Lanczos resize, layout and captions only. No retouch, external render or generated scene pixels.',
    })


def paired_entries(pairs):
    result = []
    for revision, offset in [('before', 0), ('after', 1)]:
        for before, after in pairs:
            item = (before, after)[offset]
            result.append((item, f"{'ANTES · G3A' if revision == 'before' else 'DEPOIS · G3A.1'} · {LABELS[item['phase']]}",
                           f"t = {item['t']:.3f} · 4 apêndices · seed 17"))
    return result


def find_time(items, t):
    matches = [item for item in items if abs(float(item['t']) - t) <= EPSILON]
    if len(matches) != 1:
        raise ValueError(f'Expected exactly one capture at {t}; found {len(matches)}')
    return matches[0]


old_data = read_json(OLD / 'captures.json')
old_captures = [{**item, 'revision': 'before'} for item in old_data['captures']]
phase_data = read_json(WORKSPACE / 'artifacts/g3a1/phases-and-counts.json')
implantation_data = read_json(WORKSPACE / 'artifacts/g3a1/implantation-views.json')
sequence_data = read_json(WORKSPACE / 'artifacts/g3a1/sequences-and-boundaries.json')
new_phases = [{**item, 'revision': 'after'} for item in phase_data['captures']]
new_implantation = [{**item, 'revision': 'after'} for item in implantation_data['captures']]
new_sequences = [{**item, 'revision': 'after'} for item in sequence_data['captures']]


def compare_group(old_group, new_items, times):
    old_items = [item for item in old_captures if item['group'] == old_group]
    pairs = [(find_time(old_items, t), find_time(new_items, t)) for t in times]
    for before, after in pairs:
        check_pair(before, after)
    return paired_entries(pairs)


sheet('01-seven-phases-before-after.png', 'GHOUL ATLAS · sete fases / antes e depois',
      'Mesma câmera posterior, t, configuração e corpo opaco; cada coluna compara uma fase',
      compare_group('phases', new_phases, [.04, .14, .275, .53, .76, .9, .98]), 7, 282)

roots = [item for item in new_implantation if '/roots/' in item['file']]
sheet('02-implantation-before-after.png', 'G3A → G3A.1 · implantação lombar',
      'Foco lombar idêntico; crescimento, ativo e retração. As malhas corporais permanecem proxies.',
      compare_group('root', roots, [.53, .9, .98]), 3, 550, 'stage')

growth = [item for item in new_sequences if '/growth/' in item['file']]
sheet('03-growth-before-after.png', 'G3A → G3A.1 · oito frames de crescimento',
      'Mesma câmera e configuração. Passos de .050; .700 já pertence à fixação visual.',
      compare_group('growth', growth, [.35, .4, .45, .5, .55, .6, .65, .7]), 8, 260)

retraction = [item for item in new_sequences if '/retraction/' in item['file']]
sheet('04-retraction-before-after.png', 'G3A → G3A.1 · retração quadro a quadro',
      'Mesmo t geométrico; reprodução artística: G3A 0,9 s / G3A.1 3,4 s. Stills não medem cadência.',
      compare_group('retraction', retraction, [.95, .96, .97, .98, .99, .995, 1]), 7, 282)

for output, phase, t in [
    ('05-counts-and-views.png', 'active', .9),
    ('07-counts-growth-views.png', 'growth', .53),
    ('08-counts-retraction-views.png', 'retract', .98),
]:
    count_entries = []
    for count in [1, 2, 3, 4]:
        for view, label in [('posterior', 'Posterior'), ('lateral', 'Lateral'), ('oblique', 'Oblíqua')]:
            matches = [item for item in new_implantation if item['file'].endswith(f'/counts/{count}/{view}-{phase}.png')]
            if len(matches) != 1:
                raise ValueError(f'Missing {phase} count/view {count}/{view}')
            item = matches[0]
            if abs(item['t'] - t) > EPSILON or item['config']['appendageCount'] != count:
                raise ValueError('Count/view metadata does not match the intended panel')
            count_entries.append((item, f'{count} apêndice{("s" if count > 1 else "")} · {label}',
                                  f'G3A.1 · t = {t:.3f} · corpo opaco'))
    sheet(output, f'G3A.1 · {LABELS[phase].lower()} com 1–4 apêndices',
          f't = {t:.3f}; posterior / lateral / oblíqua. Câmeras são próprias de cada vista.',
          count_entries, 3, 450)

# This optional data is captured separately from the historical review. The mobile
# camera is intentionally refined, so a camera identity assertion would be false.
mobile_file = ROOT / 'comparison-captures.json'
if mobile_file.is_file():
    mobile_data = read_json(mobile_file)
    if 'captures' in mobile_data:
        mobiles = mobile_data['captures']
    else:
        mobiles = ([{**item, 'revision': 'before'} for item in mobile_data.get('before', [])]
                   + [{**item, 'revision': 'after'} for item in mobile_data.get('after', [])])
    mobile_entries = []
    for width in [390, 430]:
        for t in [.53, .9]:
            pair = []
            for revision in ['before', 'after']:
                candidates = [item for item in mobiles if item.get('revision') == revision
                              and item['viewport']['width'] == width and abs(item['t'] - t) <= EPSILON]
                if len(candidates) != 1:
                    raise ValueError(f'Missing matched mobile {revision}/{width}/{t}')
                pair.append(candidates[0])
            check_pair(*pair, mobile=True)
            for item in pair:
                revision_label = 'ANTES · G3A' if item['revision'] == 'before' else 'DEPOIS · G3A.1'
                mobile_entries.append((item, f'{revision_label} · {width}px', f"t = {t:.3f} · {LABELS[item['phase']]}"))
    sheet('06-mobile-before-after.png', 'G3A → G3A.1 · enquadramento mobile',
          'Mesma pose e configuração; câmera/layout alterados intencionalmente. Emulação, sem FPS de celular físico.',
          mobile_entries, 4, 300, 'viewport')
else:
    SKIPPED.append({'file': '06-mobile-before-after.png', 'reason': 'Matched mobile capture metadata not available yet; rerun after production capture.'})

manifest = {
    'sourcePolicy': 'All scene pixels originate in real application screenshots. Source files are not changed.',
    'font': 'Segoe UI / Segoe UI Semibold; DejaVu Sans fallback',
    'comparisonTolerance': EPSILON, 'compositions': COMPOSITIONS,
    'matchedComparisons': COMPARISONS, 'pending': SKIPPED,
    'approval': 'Artistic approval remains pending human review.',
}
(ROOT / 'compositions.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sheets': len(COMPOSITIONS), 'matchedPairs': len(COMPARISONS), 'pending': SKIPPED}, ensure_ascii=False, indent=2))
