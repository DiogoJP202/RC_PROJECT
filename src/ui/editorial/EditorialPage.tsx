import { Icon } from '../Icon';

const experiences = [
  { number: '01', label: 'Corpo', title: 'Anatomia do ghoul', path: '/atlas',
    detail: 'Inspecione estruturas, revele camadas e localize o kakuhou no espécime.' },
  { number: '02', label: 'Manifestação', title: 'Manifestação Rinkaku', path: '/atlas/rinkaku',
    detail: 'Observe as sete fases da animação. Pause, avance por etapas ou reproduza em reverso.' },
  { number: '03', label: 'Microescala', title: 'Transporte de células RC', path: '/atlas/vascular',
    detail: 'Entre no circuito vascular ilustrativo e acompanhe uma célula ao longo do fluxo.' },
] as const;

function StudyIndex({ layout }: { layout: 'home' | 'listing' }) {
  return (
    <ol className={'ga-study-index ga-study-index--' + layout}>
      {experiences.map((experience) => <li key={experience.path}>
        <span className="ga-study-meta"><span>{experience.number}</span>{experience.label}</span>
        <h3><a className="ga-study-link" href={experience.path}>{experience.title}<Icon name="arrow" size={18} /></a></h3>
        <p>{experience.detail}</p>
      </li>)}
    </ol>
  );
}

export function EditorialFooter() {
  return (
    <footer className="ga-editorial-footer">
      <div className="ga-editorial-wrap ga-editorial-footer-inner">
        <a className="ga-footer-brand" href="/">Ghoul Atlas</a>
        <p>Projeto independente inspirado em <em>Tokyo Ghoul</em>.</p>
        <a className="ga-inline-link" href="/fontes#creditos">Fontes e créditos <Icon name="arrow" size={15} /></a>
      </div>
    </footer>
  );
}

export function HomePage() {
  return (
    <div className="ga-editorial">
      <main className="ga-editorial-wrap" id="editorial-content" tabIndex={-1}>
        <section className="ga-hero" aria-labelledby="ga-home-title">
          <div className="ga-hero-copy">
            <p className="ga-kicker ga-hero-kicker">Projeto independente <span>·</span> Tokyo Ghoul</p>
            <h1 id="ga-home-title">Atlas anatômico <span>ghoul</span></h1>
            <p className="ga-hero-intro">Explore o kakuhou, a manifestação Rinkaku e o transporte de células RC em modelos 3D interativos. As reconstruções são identificadas e acompanhadas de fontes.</p>
            <div className="ga-hero-actions">
              <a href="/atlas" className="ga-action">Abrir observatório <Icon name="arrow" size={18} /></a>
              <a href="/estudos" className="ga-inline-link">Ver estudos <Icon name="arrow" size={16} /></a>
            </div>
          </div>
          <figure className="ga-specimen">
            <div className="ga-specimen-top">
              <span><span className="ga-specimen-index">01</span> Espécime 001</span>
              <span>Rinkaku · Vista oblíqua</span>
            </div>
            <div className="ga-specimen-frame">
              <picture>
                <img src="/assets/ui-r1/rinkaku-hero-768.webp"
                  srcSet="/assets/ui-r1/rinkaku-hero-768.webp 768w, /assets/ui-r1/rinkaku-hero-1440.webp 1440w"
                  sizes="(max-width: 860px) 94vw, (max-width: 1500px) 58vw, 860px"
                  width="1440" height="1048" fetchPriority="high" alt="Espécime do observatório em vista oblíqua, com quatro apêndices do Rinkaku." />
              </picture>
            </div>
            <figcaption className="ga-specimen-caption">
              <span className="ga-model-tag"><span aria-hidden="true">△</span> <span>Modelo conceitual</span></span>
              <span>Captura do observatório</span>
            </figcaption>
          </figure>
        </section>
        <section className="ga-index-section" aria-labelledby="ga-study-title">
          <div className="ga-section-head">
            <h2 id="ga-study-title">Estudos disponíveis</h2>
            <span className="ga-kicker">01–03</span>
          </div>
          <StudyIndex layout="home" />
        </section>
        <section className="ga-method" aria-labelledby="ga-method-title">
          <div>
            <p className="ga-kicker">Método de leitura</p>
            <h2 id="ga-method-title">Base factual e reconstruções</h2>
          </div>
          <p>O atlas separa o que está documentado na obra, o que usa referências de anatomia humana e o que foi reconstruído para demonstrar uma ideia. As fichas do observatório registram a fonte e o limite de cada afirmação.</p>
          <a className="ga-inline-link" href="/fontes">Consultar metodologia e fontes <Icon name="arrow" size={16} /></a>
        </section>
      </main>
      <EditorialFooter />
    </div>
  );
}

export function StudiesPage() {
  return (
    <div className="ga-editorial">
      <main className="ga-editorial-wrap ga-inner-page" id="editorial-content" tabIndex={-1}>
        <div className="ga-page-intro">
          <p className="ga-kicker">Arquivo Anatômico</p>
          <h1>Estudos</h1>
          <p>Escolha uma vista, uma manifestação ou um processo para explorar no observatório.</p>
        </div>
        <section aria-labelledby="ga-studies-index-heading">
          <div className="ga-section-head">
            <h2 id="ga-studies-index-heading">Estudos disponíveis</h2>
            <span className="ga-kicker">01–03</span>
          </div>
          <StudyIndex layout="listing" />
        </section>
      </main>
      <EditorialFooter />
    </div>
  );
}
