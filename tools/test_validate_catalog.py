"""Regression fixtures for all eleven false positives documented in G0 ADR-012."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from validate_catalog import ROOT, validate, validate_document


class CatalogGateTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / 'public/catalog.json').read_text(encoding='utf-8-sig'))
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        scene = self.root / 'src/scene'
        scene.mkdir(parents=True)
        names = self.catalog['assets'][0]['nodeNames']
        (scene / 'proxyGeometry.ts').write_text("import manifest from './proxy-manifest.json';", encoding='utf8')
        (scene / 'proxy-manifest.json').write_text(json.dumps({'sourcePath': 'src/scene/proxyGeometry.ts', 'nodeNames': names}), encoding='utf8')

    def rejected(self, document, fragment):
        issues = validate_document(document, self.root)
        self.assertTrue(issues, 'fixture inválida foi aceita')
        self.assertTrue(any(fragment in issue for issue in issues), issues)

    def test_valid_procedural_catalog(self):
        self.assertEqual(validate_document(self.catalog, self.root), [])

    def test_01_unsupported_schema_version_999(self):
        self.catalog['schemaVersion'] = 999
        self.rejected(self.catalog, 'schemaVersion')

    def test_02_duplicate_ids_do_not_disappear_in_dictionary(self):
        for section in ['anatomy', 'claims', 'citations', 'assets', 'cameraBookmarks']:
            with self.subTest(section=section):
                changed = copy.deepcopy(self.catalog)
                changed[section].append(copy.deepcopy(changed[section][0]))
                self.rejected(changed, 'duplicate id')

    def test_03_nonexistent_camera_reference(self):
        self.catalog['anatomy'][0]['cameraBookmarkId'] = 'camera.absent'
        self.rejected(self.catalog, 'cameraBookmarkId: câmera inexistente')

    def test_04_nonexistent_camera_focus(self):
        self.catalog['cameraBookmarks'][0]['focusAnatomyId'] = 'anatomy.absent'
        self.rejected(self.catalog, 'focusAnatomyId: foco inexistente')

    def test_05_negative_distance_and_transition(self):
        for field in ['distanceMultiplier', 'transitionMs']:
            with self.subTest(field=field):
                changed = copy.deepcopy(self.catalog)
                changed['cameraBookmarks'][0][field] = -1
                self.rejected(changed, field)

    def test_06_invalid_anatomical_system(self):
        self.catalog['anatomy'][0]['system'] = 'made_up'
        self.rejected(self.catalog, 'system: enum inválido')

    def test_07_nonexistent_scene_node(self):
        self.catalog['anatomy'][0]['nodeName'] = 'NO_SUCH_NODE'
        self.rejected(self.catalog, 'nodeName: node inexistente')

    def test_08_ready_glb_missing_on_disk(self):
        self.catalog['assets'][0].update(kind='glb', status='ready', path='public/assets/missing.glb')
        self.rejected(self.catalog, 'arquivo ausente')

    def test_09_ready_open_third_party_without_license(self):
        asset = self.catalog['assets'][0]
        asset.update(authorship='third_party_open', status='ready', sourceUrl='https://example.org/asset')
        del asset['license']
        self.rejected(self.catalog, 'license: texto não vazio obrigatório')

    def test_10_orphan_parent(self):
        self.catalog['anatomy'][1]['parentId'] = 'anatomy.absent'
        self.rejected(self.catalog, 'parent órfão')

    def test_11_official_claim_secondary_only(self):
        self.catalog['citations'][0]['sourceType'] = 'secondary'
        self.rejected(self.catalog, 'official exige fonte direta elegível')

    def test_official_source_metadata_is_not_verification(self):
        for field in ['verifiedAt', 'locator', 'note']:
            with self.subTest(field=field):
                changed = copy.deepcopy(self.catalog)
                changed['citations'][0][field] = None
                self.rejected(changed, 'fonte direta exige')

    def test_disclosure_and_pending_manga_requirements(self):
        for kind, field in [('inference', 'disclaimer'), ('hypothetical_model', 'disclaimer'), ('manga_needs_verification', 'verificationTodo')]:
            with self.subTest(kind=kind):
                changed = copy.deepcopy(self.catalog)
                changed['claims'][0].update(kind=kind)
                changed['claims'][0].pop(field, None)
                self.rejected(changed, field)

    def test_procedural_generator_is_an_actual_file(self):
        (self.root / 'src/scene/proxyGeometry.ts').unlink()
        self.rejected(self.catalog, 'sourcePath: arquivo ausente')

    def test_manifest_and_node_names_must_match(self):
        self.catalog['assets'][0]['nodeNames'].append('INVENTED_NODE')
        self.rejected(self.catalog, 'nodeNames divergem')

    def test_parent_cycles(self):
        self.catalog['anatomy'][0]['parentId'] = 'human.head'
        self.rejected(self.catalog, 'ciclo')

    def test_asset_path_may_not_escape_root(self):
        self.catalog['assets'][0]['sourcePath'] = '../outside.ts'
        self.rejected(self.catalog, 'fora do repositório')

    def test_legacy_seed_is_preserved_but_not_runtime_ready(self):
        issues = validate(ROOT / 'contracts/seed-catalog.json')
        self.assertTrue(any('schemaVersion' in issue for issue in issues))
        self.assertTrue(any('verifiedAt' in issue for issue in issues))
        self.assertTrue(any('path: caminho real obrigatório' in issue for issue in issues))

    def test_malformed_json_and_missing_file_return_context(self):
        path = self.root / 'broken.json'
        path.write_text('{broken', encoding='utf8')
        self.assertIn('não foi possível ler JSON', validate(path)[0])
        self.assertIn('não foi possível ler JSON', validate(self.root / 'missing.json')[0])

    def test_hostile_field_types_report_problems_instead_of_crashing(self):
        self.catalog['claims'][0]['kind'] = {}
        self.catalog['anatomy'][0]['cameraBookmarkId'] = []
        self.catalog['anatomy'][1]['parentId'] = {}
        self.catalog['assets'][0]['status'] = {}
        self.catalog['cameraBookmarks'][0]['focusAnatomyId'] = []
        self.rejected(self.catalog, 'enum inválido')

    def test_malformed_manifest_and_url_report_context(self):
        self.catalog['citations'][0]['url'] = 'https://['
        manifest = self.root / 'src/scene/proxy-manifest.json'
        manifest.write_text(json.dumps({'sourcePath': 'src/scene/proxyGeometry.ts', 'nodeNames': [{}]}), encoding='utf8')
        issues = validate_document(self.catalog, self.root)
        self.assertTrue(any('URL HTTP(S) inválida' in issue for issue in issues), issues)
        self.assertTrue(any('nodeNames divergem' in issue for issue in issues), issues)


if __name__ == '__main__':
    unittest.main()
