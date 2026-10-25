"""Contact sheets from real screenshots only; crop/resize/labels, no synthetic scene content."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageStat
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'captures.json').read_text(encoding='utf-8-sig'))
FONT = Path('C:/Windows/Fonts/segoeui.ttf')
BOLD = Path('C:/Windows/Fonts/seguisb.ttf')
def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)

compositions = []
def tile_source(item, whole_stage=False):
    image = Image.open(ROOT / item['file']).convert('RGB')
    if item['captureArea'] == 'stage':
        sx, sy, sw, sh = 0, 0, image.width, image.height
    else:
        r = item['stageRect']
        sx, sy, sw, sh = r['x'], r['y'], r['width'], r['height']
    if whole_stage:
        box = (int(sx), int(sy), int(sx + sw), int(sy + sh))
    else:
        # One fixed body/appendage ROI for all phases; no per-pose reframing.
        box = (int(sx + sw * .18), int(sy + sh * .20), int(sx + sw * .88), int(sy + sh * .83))
    return image.crop(box), box

def sheet(name, title, subtitle, items, columns=4, width=470, whole_stage=False, note=None):
    gap, top, bottom = 16, 92, 48
    crops = [tile_source(item, whole_stage) for item in items]
    height = max(round(im.height * width / im.width) for im, _ in crops)
    cell_height = height + 56
    count = len(items) + (1 if note else 0)
    rows = math.ceil(count / columns)
    canvas = Image.new('RGB', (columns * width + (columns + 1) * gap, top + rows * (cell_height + gap) + bottom), '#08131c')
    draw = ImageDraw.Draw(canvas)
    draw.text((gap, 12), title, font=font(28, True), fill='#e0dbd6')
    draw.text((gap, 54), subtitle, font=font(17), fill='#9eb8b6')
    sources = []
    for i, (item, (im, box)) in enumerate(zip(items, crops)):
        x, y = gap + (i % columns) * (width + gap), top + (i // columns) * (cell_height + gap)
        resized = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
        canvas.paste(resized, (x, y))
        label = 'Fixação (após crescimento)' if item['group']=='growth' and item['phase']=='fixation' else item['label']
        draw.text((x, y + height + 5), label, font=font(19, True), fill='#e5c4ca')
        draw.text((x, y + height + 31), f"t = {item['t']:.3f}  ·  {item['phase']}", font=font(16), fill='#abc0c1')
        sources.append({'file':item['file'], 'sourceSha256':item['sha256'], 'cropBox':box, 't':item['t']})
    if note:
        i = len(items)
        x, y = gap + (i % columns) * (width + gap), top + (i // columns) * (cell_height + gap)
        draw.rounded_rectangle((x, y, x + width, y + height + 48), radius=5, outline='#53636b', width=1)
        for j, line in enumerate(note):
            draw.text((x + 22, y + 28 + 35 * j), line, font=font(19, j == 0), fill='#bbccca')
    draw.text((gap, canvas.height - 34), 'PROXY / CONCEPTUAL MODEL · captura real, recorte fixo e redução de tamanho · sem retoque da geometria', font=font(16), fill='#bbad92')
    target = ROOT / name
    canvas.save(target, optimize=True)
    compositions.append({'file':name,'sources':sources,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'dimensions':canvas.size,'operations':'Fixed crop, Lanczos downscale, layout and captions only; scene pixels originate in listed screenshots.'})

groups = {key:[c for c in DATA['captures'] if c['group']==key] for key in ['phases','growth','views','root','boundaries','retraction','revisit']}
sheet('01-seven-phases.png','GHOUL ATLAS / G3A · sete fases','Mesma câmera posterior · corpo opaco · 4 apêndices · seed 17 · efeitos padrão',groups['phases'],note=['Leitura da sequência','Sete poses absolutas','t=1 termina recolhido','Forma e tempos artísticos','Aprovação visual pendente'])
sheet('02-growth-sequence.png','G3A · oito frames de crescimento','Passos de .050; mesma câmera/configuração; t=.700 já pertence à fixação',groups['growth'])
sheet('03-active-views.png','G3A · Rinkaku ativo / posterior e lateral','t=.900 · corpo opaco; a lateral expõe profundidade e sobreposição das raízes',groups['views'],columns=2,width=680)
sheet('04-retraction.png','G3A · retração até t=1','A retração ocupa .950–1.000: duração artística de 0,9 s no playback de 18 s',groups['retraction'],note=['Retração','Passos não uniformes','Últimos frames ampliados','de tempo na comparação','Ver também playback.webm'])
sheet('05-phase-transitions.png','G3A · limites de fase / antes e depois','Cada par adjacente mostra limite −.001 / +.001; não são tempos canônicos',groups['boundaries'])
sheet('06-root-details.png','G3A · detalhe da conexão lombar','Foco real da aplicação · corpo opaco · meshes sobrepostas; sem união topológica à pele',groups['root'],columns=3,width=560,whole_stage=True)
sheet('07-scrub-revisit.png','G3A · consistência ao revisitar t=.700','Sequência .700 → .200 → .700 → .300 → .700; pose e câmera mantidas',groups['revisit'],columns=2,width=680)

before, after = [Image.open(ROOT / c['file']).convert('RGB') for c in groups['revisit']]
diff = ImageChops.difference(before, after)
stats = ImageStat.Stat(diff)
pixel_check = {'sameDimensions':before.size == after.size,'identicalPixels':diff.getbbox() is None,'meanAbsoluteRgbDifference':stats.mean,'rmsRgbDifference':stats.rms}
result = {'compositions':compositions,'scrubPixelComparison':pixel_check}
(ROOT / 'compositions.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Retain raw check output separately; reviewed logs use portable workspace markers.
raw_dir = ROOT.parents[1] / 'local' / 'g3a-review-raw'
raw_dir.mkdir(parents=True, exist_ok=True)
workspace = str(ROOT.parents[2])
for target in ROOT.glob('*.txt'):
    text = target.read_text(encoding='utf-8-sig')
    (raw_dir / target.name).write_text(text,encoding='utf-8')
    text = text.replace(workspace,'<workspace>').replace(workspace.replace('\\','/'),'<workspace>')
    target.write_text(text,encoding='utf-8')
print(json.dumps({'sheets':len(compositions),'scrubPixelComparison':pixel_check},ensure_ascii=False,indent=2))
