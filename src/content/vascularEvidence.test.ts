import { describe, expect, it } from 'vitest';
import catalog from '../../public/catalog.json';
import { validateCatalog } from './catalog';
import { evidenceFor, inspectVascularEvidence, validateVascularEvidence, type VascularEvidenceTarget } from './vascularEvidence';

const content = validateCatalog(catalog);
const fresh = () => inspectVascularEvidence();

describe('vascular evidence supplement', () => {
  it('uses the existing claim/source contract with dated direct human anatomy and narrowly scoped official RC evidence', () => {
    const supplement = validateVascularEvidence(fresh());
    expect(supplement.claims).toHaveLength(6);
    expect(supplement.citations).toHaveLength(3);
    expect(supplement.citations.every((source) => source.verifiedAt === '2026-10-25' && source.locator && source.note)).toBe(true);
    expect(supplement.claims.filter((claim) => claim.kind === 'official').map((claim) => claim.id)).toEqual(['claim.g4a.rc.context']);
    expect(supplement.claims.find((claim) => claim.id === 'claim.g4a.rc.context')?.scope).toContain('Não autentica');
    expect(supplement.claims.find((claim) => claim.id === 'claim.g4a.rc.unknown')?.scope).toContain('consulta ao guia textual');
  });

  it('returns only referenced sources and separates real anatomy from simulated transport for every inspector target', () => {
    for (const target of ['vessel', 'rbc', 'rc'] as const) {
      const evidence = evidenceFor(target, content);
      const used = new Set(evidence.claims.flatMap((claim) => claim.citationIds));
      expect(evidence.citations.map((source) => source.id).sort()).toEqual([...used].sort());
      expect(evidence.claims.some((claim) => claim.kind === 'hypothetical_model')).toBe(true);
      expect(evidence.claims.every((claim) => claim.scope)).toBe(true);
      if (target === 'rc') {
        expect(evidence.claims.some((claim) => claim.kind === 'unknown')).toBe(true);
        expect(evidence.claims.some((claim) => claim.id === 'claim.g4a.rc.visual' && claim.kind === 'hypothetical_model')).toBe(true);
      } else expect(evidence.claims.some((claim) => claim.kind === 'real_anatomy')).toBe(true);
    }
  });

  it('keeps base content and module evidence independent from returned mutable inspector arrays', () => {
    const before = structuredClone(content);
    const returned = evidenceFor('rc', content);
    returned.claims[0].text = 'changed';
    returned.claims[0].citationIds.push('changed');
    returned.citations[0].url = 'https://example.invalid/';
    const copied = fresh(); copied.claims[0].citationIds.length = 0;
    expect(content).toEqual(before);
    expect(evidenceFor('rc', content).claims[0].text).not.toBe('changed');
    expect(evidenceFor('rc', content).citations[0].url).toBe('https://youngjump.jp/tokyoghoul/tg/data/');
    expect(fresh().claims[0].citationIds).toHaveLength(1);
  });

  it('refuses to shadow an editorial claim or source added to the base catalogue', () => {
    const withClaim = structuredClone(content);
    withClaim.claims.push(fresh().claims[0]);
    expect(() => evidenceFor('rbc', withClaim)).toThrow('conflita');
    const withSource = structuredClone(content);
    withSource.citations.push(fresh().citations[0]);
    expect(() => evidenceFor('vessel', withSource)).toThrow('conflita');
  });

  const negatives: [string, (value: ReturnType<typeof fresh>) => void, string][] = [
    ['duplicate claim', (value) => value.claims.push(structuredClone(value.claims[0])), 'claim duplicado'],
    ['duplicate source', (value) => value.citations.push({ ...value.citations[0] }), 'fonte duplicada'],
    ['unknown source reference', (value) => { value.claims[0].citationIds = ['src.g4a.absent']; }, 'fonte inexistente'],
    ['official claim from textbook only', (value) => { value.claims[0].kind = 'official'; }, 'fonte direta elegível'],
    ['human anatomy from publisher only', (value) => { value.claims[0].citationIds = ['src.g4a.youngjump.rc']; }, 'fonte direta elegível'],
    ['unverified official source', (value) => { value.citations[2].verifiedAt = null; }, 'fonte direta conferida'],
    ['invalid consultation date', (value) => { value.citations[0].verifiedAt = '2026-02-30'; }, 'verifiedAt inválido'],
    ['missing locator', (value) => { value.citations[0].locator = ''; }, 'locator e nota'],
    ['non-HTTPS source', (value) => { value.citations[0].url = 'javascript:alert(1)'; }, 'URL HTTPS'],
    ['hypothesis without disclosure', (value) => { delete value.claims[3].disclaimer; }, 'disclaimer obrigatório'],
    ['pending manga without verification task', (value) => { value.claims[2].kind = 'manga_needs_verification'; }, 'verificação do mangá'],
    ['invented anatomical binding', (value) => { value.claims[0].relatedAnatomyIds = ['invented.vascular.node']; }, 'anatomia inexistente'],
    ['namespace colliding with base', (value) => { value.claims[0].id = 'claim.kakuhou.stores.rc'; }, 'namespace claim.g4a'],
  ];
  it.each(negatives)('rejects %s at the evidence boundary', (_name, mutate, message) => {
    const value = fresh(); mutate(value);
    expect(() => validateVascularEvidence(value)).toThrow(message);
  });

  it('rejects malformed supplements and unknown UI targets rather than fabricating an eligible card', () => {
    expect(() => validateVascularEvidence(null)).toThrow('claims/citations');
    expect(() => validateVascularEvidence({ claims: [], citations: [] })).toThrow('não podem ser vazias');
    expect(() => validateVascularEvidence({ claims: [null], citations: [null] })).toThrow('id obrigatório');
    expect(() => evidenceFor('invented' as VascularEvidenceTarget, content)).toThrow('Alvo de evidência');
  });
});
