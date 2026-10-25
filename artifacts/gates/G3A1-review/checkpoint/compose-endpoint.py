"""Only arrange real endpoint screenshots; no generated scene pixels."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path.cwd()
FOLDER = ROOT / 'artifacts/gates/G3A1-review/checkpoint'
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
times = ['0.995', '0.998', '0.999', '1.000']
before_metadata = json.loads((FOLDER / 'before/captures.json').read_text(encoding='utf-8'))
after_metadata = json.loads((FOLDER / 'terminal-retraction.json').read_text(encoding='utf-8'))
before_camera = next(item['camera'] for item in before_metadata['captures'] if item['view'] == 'focus')
after_camera = next(item['sequence'][0]['state']['camera'] for item in after_metadata['samples'] if item['count'] == 4 and item['view'] == 'focus')
assert before_camera == after_camera, 'Endpoint comparison requires an identical camera'
canvas = Image.new('RGB', (1520, 730), '#08131c')
draw = ImageDraw.Draw(canvas)
draw.text((18, 12), 'G3A.1 P1 — correção funcional da última retração', font=font, fill='#d5e1df')
draw.text((18, 43), 'Mesma câmera/configuração: os montes se recolhem antes do cutoff; arte final permanece pendente.', font=small, fill='#90adaf')
sources = []
for row, revision in enumerate(['before', 'after']):
    for col, t in enumerate(times):
        file = FOLDER / ('before/focus-t' + t + '.png' if revision == 'before' else 'terminal/count-4-focus-t' + t + '.png')
        image = Image.open(file).convert('RGB')
        # Focus the lumbar area; same crop for all eight source images.
        crop = (250, 170, 650, 440)
        panel = image.crop(crop).resize((362, 244), Image.Resampling.LANCZOS)
        x, y = 18 + col * 375, 85 + row * 308
        canvas.paste(panel, (x, y))
        draw.text((x, y + 252), f'{"ANTES" if row == 0 else "DEPOIS"} · t={t}', font=small, fill='#d6aeb8')
        sources.append({'file': file.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                        'cropBox': crop, 't': float(t), 'revision': revision})
draw.text((18, 702), 'Pixels reais da aplicação; corpo opaco,4 apêndices,seed17. Transparência e1–4 quantidades verificadas separadamente.', font=small, fill='#90adaf')
target = FOLDER / 'endpoint-before-after.png'
canvas.save(target)
(FOLDER / 'endpoint-composition.json').write_text(json.dumps({'file': target.relative_to(ROOT).as_posix(),
    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'sources': sources, 'sameCamera': True,
    'policy': 'Only crop, resize, layout and labels. Source images unchanged.'}, indent=2) + '\n', encoding='utf-8')
print(target.relative_to(ROOT).as_posix())
