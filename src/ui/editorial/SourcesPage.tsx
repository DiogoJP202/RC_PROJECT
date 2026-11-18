import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { evidenceLabel, loadCatalog, type Citation } from '../../content/catalog';
import { inspectVascularEvidence } from '../../content/vascularEvidence';
import { Icon } from '../Icon';
import { EditorialFooter } from './EditorialPage';

const sourceLabels: Record<Citation['sourceType'], string> = {
  publisher: 'Editora',
  manga: 'Mangá',
  official_anime: 'Anime oficial',
  textbook: 'Anatomia humana',
  secondary: 'Referência secundária',
  production_vfx: 'Produção visual',
};

type Library =
  | { status: 'loading' }
  | { status: 'ready'; sources: Citation[][] }
  | { status: 'failed' };

function groupSources(citations: Citation[]): Citation[][] {
  const groups = new Map<string, Citation[]>();
  const seen = new Set<string>();
  for (const source of citations) {
    if (seen.has(source.id)) continue;
    seen.add(source.id);
    const related = groups.get(source.url) ?? [];
    related.push(source);
    groups.set(source.url, related);
  }
  return Array.from(groups.values());
}

function useSourceLibrary() {
  const [attempt, setAttempt] = useState(0);
  const [library, setLibrary] = useState<Library>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void loadCatalog(controller.signal).then((catalog) => {
      if (!controller.signal.aborted) {
        setLibrary({ status: 'ready', sources: groupSources([...catalog.citations, ...inspectVascularEvidence().citations]) });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLibrary({ status: 'failed' });
    });
    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setLibrary({ status: 'loading' });
    setAttempt((previous) => previous + 1);
  };
  return { library, retry };
}

function SourceLibrary({ library, retry }: { library: Library; retry: () => void }) {
  if (library.status === 'loading') return <p role="status">Carregando fontes…</p>;
  if (library.status === 'failed') return <div className="ga-library-state">
    <p role="alert">Não foi possível carregar o catálogo de fontes.</p>
    <button className="ga-action" type="button" onClick={retry}>Tentar novamente</button>
  </div>;

  return (
    <ol className="ga-source-library">
      {library.sources.map(([primary, ...related]) => (
        <li key={primary.url}>
          <h3><a href={primary.url} target="_blank" rel="noreferrer">{primary.title} <Icon name="source" size={16} /></a></h3>
          {[primary, ...related].map((item) => <div key={item.id} className="ga-source-record">
            {item.id !== primary.id ? <strong>{item.title}</strong> : null}
            <p className="ga-source-meta">{sourceLabels[item.sourceType]} <span aria-hidden="true">·</span> {item.verifiedAt ? 'Conferida em ' + item.verifiedAt.split('-').reverse().join('/') : 'Verificação pendente'}</p>
            {item.locator ? <p>{item.locator}</p> : null}
            {item.note ? <p>{item.note}</p> : null}
          </div>)}
        </li>
      ))}
    </ol>
  );
}

export default function SourcesPage({ creditsRequest }: { creditsRequest?: number }) {
  const { library, retry } = useSourceLibrary();
  const credits = useRef<HTMLElement>(null);
  const previousRequest = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    const newRequest = previousRequest.current !== creditsRequest;
    previousRequest.current = creditsRequest;
    const target = credits.current;
    if (creditsRequest === undefined || !target) return;
    if (newRequest) target.focus({ preventScroll: true });
    // The bibliography above can shift the target after loading. Keep it in
    // view only while the reader is still focused there.
    if (document.activeElement === target) target.scrollIntoView({ block: 'start' });
  }, [creditsRequest, library.status]);

  return (
    <div className="ga-editorial">
      <main className="ga-editorial-wrap ga-inner-page" id="editorial-content" tabIndex={-1}>
        <div className="ga-page-intro">
          <p className="ga-kicker">Procedência</p>
          <h1>Fontes e metodologia</h1>
          <p>As referências documentam afirmações específicas. Elas não validam a forma, a escala ou o movimento dos modelos conceituais do observatório.</p>
        </div>
        <section className="ga-source-section" aria-labelledby="ga-classes-title">
          <div className="ga-section-head"><h2 id="ga-classes-title">Como ler as evidências</h2></div>
          <dl className="ga-evidence-legend">
            <div><dt>{evidenceLabel.official}</dt><dd>Afirmação sustentada por uma fonte oficial identificada. O contexto de mangá e anime permanece indicado.</dd></div>
            <div><dt>{evidenceLabel.real_anatomy}</dt><dd>Referência humana usada como base de leitura, sem atribuição automática à anatomia ghoul.</dd></div>
            <div><dt>{evidenceLabel.hypothetical_model}</dt><dd>Escolha visual ou de animação adotada para demonstrar uma ideia.</dd></div>
            <div><dt>{evidenceLabel.inference}</dt><dd>Interpretação derivada do material consultado, identificada como tal.</dd></div>
            <div><dt>{evidenceLabel.manga_needs_verification}</dt><dd>Trecho ou localização no mangá ainda a confirmar.</dd></div>
            <div><dt>{evidenceLabel.unknown}</dt><dd>Detalhe não estabelecido pelas referências consultadas.</dd></div>
          </dl>
        </section>
        <section className="ga-source-section" aria-labelledby="ga-bibliography-title">
          <div className="ga-section-head"><h2 id="ga-bibliography-title">Referências do observatório</h2></div>
          <SourceLibrary library={library} retry={retry} />
        </section>
        <section className="ga-source-section ga-credits" id="creditos" ref={credits} tabIndex={-1} aria-labelledby="ga-credits-title">
          <div className="ga-section-head"><h2 id="ga-credits-title">Créditos e licenças</h2></div>
          <p>O Ghoul Atlas é um projeto independente inspirado em <em>Tokyo Ghoul</em>, obra de Sui Ishida. Os modelos procedurais, a captura da vitrine e a identidade visual são criações do projeto. A CCG é uma organização da ficção, sem afiliação com este arquivo.</p>
          <p>Tipografia IBM Plex™, distribuída sob a SIL Open Font License 1.1.</p>
          <a className="ga-inline-link" href="/ASSET_LICENSES.md">Ler registro de proveniência <Icon name="arrow" size={16} /></a>
        </section>
      </main>
      <EditorialFooter />
    </div>
  );
}
