#!/usr/bin/env python3
"""Gate estrito v2: estrutura, proveniência editorial e recursos reais.

Sem dependências externas. Ex.: python tools/validate_catalog.py public/catalog.json
O seed v1 é um diagnóstico preservado; sua rejeição é intencional no runtime v2.
"""
import datetime
import json
import math
import struct
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = {'official', 'manga_needs_verification', 'real_anatomy', 'inference', 'hypothetical_model', 'unknown'}
SYSTEMS = {'surface', 'skeletal', 'muscular', 'vascular', 'digestive', 'nervous', 'rc', 'kakuhou', 'kagune', 'sensory', 'other'}
SOURCE_TYPES = {'publisher', 'manga', 'official_anime', 'textbook', 'secondary', 'production_vfx'}
DIRECT = {'publisher', 'manga', 'official_anime'}
SCALES = {'body', 'system', 'organ', 'tissue', 'cell', 'microstructure'}
SPECIMENS = {'human', 'ghoul', 'one_eyed', 'quinx', 'half_human'}


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def member(value, collection):
    return isinstance(value, str) and value in collection


def date_valid(value):
    try:
        return isinstance(value, str) and datetime.date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def url_valid(value):
    if not isinstance(value, str):
        return False
    try:
        parsed = urlparse(value)
        return parsed.scheme in ('http', 'https') and bool(parsed.netloc)
    except ValueError:
        return False


def validate_document(data, root=ROOT):
    """Retorna problemas sem executar código de asset ou ler fora de root."""
    errors = []

    def bad(condition, message):
        if condition:
            errors.append(message)

    if not isinstance(data, dict):
        return ['catalog: objeto JSON obrigatório']
    bad(data.get('schemaVersion') != 2, 'schemaVersion: esperado 2; seed v1 é legado, migre conforme docs/G1_CATALOG_MIGRATION.md')

    def index(name):
        values = data.get(name)
        if not isinstance(values, list) or not values:
            errors.append(f'{name}: lista não vazia obrigatória')
            return {}
        result = {}
        for i, item in enumerate(values):
            if not isinstance(item, dict) or not nonempty(item.get('id')):
                errors.append(f'{name}[{i}]: objeto com id não vazio obrigatório')
                continue
            identity = item['id']
            bad(identity in result, f'{name}: duplicate id {identity}')
            result[identity] = item
        return result

    citations, claims, anatomy, assets, cameras = [index(k) for k in ('citations', 'claims', 'anatomy', 'assets', 'cameraBookmarks')]

    def refs(item, field, target, context, required=False):
        values = item.get(field)
        if not isinstance(values, list) or (required and not values):
            errors.append(f'{context}.{field}: lista{" não vazia" if required else ""} obrigatória')
            return []
        for value in values:
            bad(not isinstance(value, str) or value not in target, f'{context}.{field}: referência inexistente {value}')
        return [v for v in values if isinstance(v, str) and v in target]

    def enum(item, field, allowed, context):
        value = item.get(field)
        bad(not isinstance(value, str) or value not in allowed, f'{context}.{field}: enum inválido {value}')

    def text_fields(item, names, context):
        for field in names:
            bad(not nonempty(item.get(field)), f'{context}.{field}: texto não vazio obrigatório')

    def local_file(value, context):
        if not nonempty(value):
            errors.append(f'{context}: caminho real obrigatório')
            return None
        base = Path(root).resolve()
        path = (base / value).resolve()
        if not path.is_relative_to(base):
            errors.append(f'{context}: caminho fora do repositório')
            return None
        if not path.is_file():
            errors.append(f'{context}: arquivo ausente {value}')
            return None
        return path

    for sid, source in citations.items():
        text_fields(source, ('title', 'url'), sid)
        bad(not url_valid(source.get('url')), f'{sid}.url: URL HTTP(S) inválida')
        enum(source, 'sourceType', SOURCE_TYPES, sid)
        if source.get('verifiedAt') is not None:
            bad(not date_valid(source['verifiedAt']), f'{sid}.verifiedAt: data ISO inválida')

    for cid, claim in claims.items():
        text_fields(claim, ('text', 'scope'), cid)
        enum(claim, 'kind', EVIDENCE, cid)
        enum(claim, 'confidence', {'high', 'medium', 'low'}, cid)
        bad(not isinstance(claim.get('isLoreClaim'), bool), f'{cid}.isLoreClaim: booleano obrigatório')
        kind = claim.get('kind')
        source_ids = refs(claim, 'citationIds', citations, cid, kind in ('official', 'real_anatomy'))
        refs(claim, 'relatedAnatomyIds', anatomy, cid)
        if kind in ('hypothetical_model', 'inference'):
            text_fields(claim, ('disclaimer',), cid)
        if kind == 'manga_needs_verification':
            text_fields(claim, ('verificationTodo',), cid)
        if kind in ('official', 'real_anatomy'):
            eligible = [citations[s] for s in source_ids if member(citations[s].get('sourceType'), DIRECT if kind == 'official' else {'textbook'})]
            bad(not eligible, f'{cid}: {kind} exige fonte direta elegível; secundária não autentica cânone/anatomia')
            bad(not any(date_valid(s.get('verifiedAt')) and all(nonempty(s.get(f)) for f in ('title', 'url', 'locator', 'note')) for s in eligible), f'{cid}: fonte direta exige verifiedAt, locator e note de conferência')

    asset_nodes = {}
    for aid, asset in assets.items():
        enum(asset, 'kind', {'glb', 'texture', 'svg', 'shader', 'procedural'}, aid)
        enum(asset, 'status', {'ready', 'proxy', 'missing', 'blocked_by_license'}, aid)
        enum(asset, 'authorship', {'original', 'third_party_open', 'unknown'}, aid)
        nodes = asset.get('nodeNames', [])
        bad(not isinstance(nodes, list) or any(not nonempty(n) for n in nodes), f'{aid}.nodeNames: nomes válidos obrigatórios')
        if not isinstance(nodes, list):
            nodes = []
        bad(len(nodes) != len(set(str(n) for n in nodes)), f'{aid}.nodeNames: nomes duplicados')
        asset_nodes[aid] = set(str(n) for n in nodes)
        available = asset.get('status') in ('ready', 'proxy')
        if available:
            text_fields(asset, ('license', 'attribution'), aid)
            bad(asset.get('authorship') == 'unknown', f'{aid}: origem desconhecida não pode estar disponível')
            if asset.get('authorship') == 'third_party_open':
                text_fields(asset, ('sourceUrl',), aid)
                bad(not url_valid(asset.get('sourceUrl')), f'{aid}.sourceUrl: fonte HTTP(S) obrigatória para terceiro')
            if asset.get('kind') == 'procedural':
                generator = local_file(asset.get('sourcePath'), f'{aid}.sourcePath')
                manifest_path = local_file(asset.get('manifestPath'), f'{aid}.manifestPath')
                if manifest_path:
                    try:
                        manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
                        bad(manifest.get('sourcePath') != asset.get('sourcePath'), f'{aid}: manifesto aponta para outro gerador')
                        actual = manifest.get('nodeNames', [])
                        valid_actual = isinstance(actual, list) and all(nonempty(n) for n in actual)
                        bad(not valid_actual or set(str(n) for n in nodes) != set(actual), f'{aid}: nodeNames divergem do manifesto do gerador')
                        if generator:
                            generator_text = generator.read_text(encoding='utf-8-sig')
                            bad(manifest_path.name not in generator_text and not all(str(n) in generator_text for n in nodes), f'{aid}: gerador não declara/importa os nodes do manifesto')
                    except (ValueError, TypeError, AttributeError, OSError, UnicodeError) as error:
                        errors.append(f'{aid}: manifesto inválido: {error}')
            else:
                path = local_file(asset.get('path'), f'{aid}.path')
                if path and asset.get('kind') == 'glb':
                    try:
                        raw = path.read_bytes()
                        magic, version, length = struct.unpack_from('<4sII', raw)
                        bad(magic != b'glTF' or version != 2 or length != len(raw), f'{aid}: cabeçalho GLB 2 inválido')
                        chunk_length, chunk_type = struct.unpack_from('<II', raw, 12)
                        bad(chunk_type != 0x4e4f534a, f'{aid}: primeiro chunk GLB deve ser JSON')
                        gltf = json.loads(raw[20:20 + chunk_length])
                        actual = {n.get('name') for n in gltf.get('nodes', [])}
                        bad(not set(nodes).issubset(actual), f'{aid}: nodeNames ausentes no GLB real')
                    except (ValueError, TypeError, struct.error, AttributeError, OSError) as error:
                        errors.append(f'{aid}: GLB inválido: {error}')

    for nid, node in anatomy.items():
        text_fields(node, ('label', 'function', 'description', 'locationNote', 'modelDisclosure', 'nodeName', 'assetId', 'cameraBookmarkId'), nid)
        for field, choices in [('system', SYSTEMS), ('scale', SCALES), ('layer', {'surface', 'muscular', 'skeletal', 'internal'}), ('evidenceKind', EVIDENCE), ('modelStatus', {'licensed_asset', 'original_asset', 'conceptual_proxy', 'not_available'}), ('locationPrecision', {'documented_region', 'approximate', 'unknown'}), ('visibilityDefault', {'hidden', 'solid', 'ghost', 'isolated'})]:
            enum(node, field, choices, nid)
        refs(node, 'claimIds', claims, nid, True)
        for field, allowed in [('specimenKinds', SPECIMENS), ('interactions', {'select', 'focus', 'isolate', 'explode', 'manifest', 'follow'})]:
            values = node.get(field)
            bad(not isinstance(values, list) or not values or any(not isinstance(v, str) or v not in allowed for v in values), f'{nid}.{field}: lista/enums inválidos')
        if node.get('parentId'):
            bad(not member(node['parentId'], anatomy) or node['parentId'] == nid, f'{nid}.parentId: parent órfão ou cíclico')
        if 'childIds' in node:
            refs(node, 'childIds', anatomy, nid)
        bad(not member(node.get('cameraBookmarkId'), cameras), f'{nid}.cameraBookmarkId: câmera inexistente')
        aid = node.get('assetId')
        bad(not member(aid, assets), f'{nid}.assetId: asset inexistente')
        bad(not member(node.get('nodeName'), asset_nodes.get(aid, set()) if isinstance(aid, str) else set()), f'{nid}.nodeName: node inexistente no asset/manifesto')
        if member(aid, assets):
            bad(assets[aid].get('status') not in ('ready', 'proxy'), f'{nid}.assetId: estrutura selecionável depende de asset indisponível')
        chain, parent = {nid}, node.get('parentId')
        while member(parent, anatomy):
            if parent in chain:
                errors.append(f'{nid}.parentId: ciclo de anatomia')
                break
            chain.add(parent)
            parent = anatomy[parent].get('parentId')

    for bid, bookmark in cameras.items():
        bad(not member(bookmark.get('focusAnatomyId'), anatomy), f'{bid}.focusAnatomyId: foco inexistente')
        for field, lower, upper in [('azimuthDeg', -360, 360), ('elevationDeg', -89, 89), ('distanceMultiplier', 0.01, 100), ('transitionMs', 0, 10000)]:
            value = bookmark.get(field)
            bad(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not lower <= value <= upper, f'{bid}.{field}: número finito no intervalo [{lower}, {upper}] obrigatório')
    return errors


def validate(path, root=ROOT):
    try:
        data = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    except (OSError, ValueError) as error:
        return [f'catalog {path}: não foi possível ler JSON: {error}']
    return validate_document(data, root)


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'public/catalog.json'
    issues = validate(target)
    if issues:
        print(f'FAILED {target} ({len(issues)} problema(s)):\n' + '\n'.join(f'- {i}' for i in issues))
        sys.exit(1)
    print(f'Catalog OK v2: {target}; estrutura, referências, fontes conferidas e assets reais.')
