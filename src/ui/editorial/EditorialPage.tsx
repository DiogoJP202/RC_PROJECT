import type { ReactNode } from 'react';

const art = '/assets/ui-r5/';
const experiences = [
  {
    key: 'anatomy', title: 'Anatomia ghoul', path: '/atlas', action: 'Inspecionar o Corpo',
    image: 'anatomia-study.webp',
    detail: 'Revele as camadas do espécime, localize o kakuhou e consulte as evidências de cada estrutura.',
  },
  {
    key: 'rinkaku', title: 'Manifestação Rinkaku', path: '/atlas/rinkaku', action: 'Abrir simulação Rinkaku',
    image: 'rinkaku-study.webp',
    detail: 'Observe a raiz lombar e acompanhe as fases da animação. Pause para examinar uma pose.',
  },
  {
    key: 'vascular', title: 'Transporte de células RC', path: '/atlas/vascular', action: 'Explorar a circulação',
    image: 'micro-study.webp',
    detail: 'Selecione uma hemácia ou uma célula RC conceitual e acompanhe seu percurso no vaso ilustrativo.',
  },
] as const;

function StudyIndex({ layout }: { layout: 'home' | 'listing' }) {
  const Heading = layout === 'home' ? 'h3' : 'h2';
  return (
    <ul className={`ga-study-index ga-study-index--${layout}`}>
      {experiences.map((experience) => (
        <li key={experience.key} className={`ga-study ga-study--${experience.key}`}>
          <figure className="ga-study-art">
            <img src={art + experience.image} alt="" loading="lazy" decoding="async" />
            <figcaption>Modelo conceitual</figcaption>
          </figure>
          <div className="ga-study-copy">
            <Heading>{experience.title}</Heading>
            <p>{experience.detail}</p>
            <a href={experience.path} className="ga-inline-link">{experience.action}</a>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EditorialFooter() {
  return (
    <footer className="ga-editorial-footer">
      <div className="ga-editorial-wrap ga-editorial-footer-inner">
        <a className="ga-footer-brand" href="/">Ghoul Atlas</a>
        <p>Projeto independente inspirado em <em>Tokyo Ghoul</em>.</p>
        <a className="ga-inline-link" href="/fontes#creditos">Fontes e créditos</a>
      </div>
    </footer>
  );
}

export function EditorialStatus({ id, title, children, action }: {
  id: string; title: string; children: ReactNode; action: ReactNode;
}) {
  return (
    <section id={id} tabIndex={-1} className="ga-editorial ga-route-status" aria-labelledby={id + '-title'}>
      <div className="ga-status-inner">
        <h1 id={id + '-title'}>{title}</h1>
        <p>{children}</p>
        {action}
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="ga-editorial">
      <main id="editorial-content" tabIndex={-1}>
        <section className="ga-hero" aria-labelledby="ga-home-title">
          <div className="ga-hero-copy">
            <p className="ga-affiliation">Projeto independente inspirado em <em>Tokyo Ghoul</em></p>
            <h1 id="ga-home-title">Atlas anatômico <span>ghoul</span></h1>
            <p className="ga-hero-intro">Inspecione o kakuhou, reproduza a manifestação Rinkaku e acompanhe células RC em modelos 3D conceituais.</p>
            <div className="ga-hero-actions">
              <a href="/atlas" className="ga-action">Abrir observatório</a>
              <a href="/estudos" className="ga-inline-link">Ver estudos</a>
            </div>
          </div>
          <figure className="ga-hero-media">
            <picture>
              <source media="(max-width: 760px)" srcSet={art + 'rinkaku-portrait.webp'} width="720" height="830" />
              <img src={art + 'rinkaku-wide.webp'} width="1440" height="930" fetchPriority="high"
                alt="Espécime em vista posterior oblíqua, com apêndices carmim partindo da região lombar." />
            </picture>
            <figcaption><span className="ga-model-tag">Modelo conceitual</span><span>Rinkaku · Vista oblíqua</span></figcaption>
          </figure>
        </section>
        <div className="ga-editorial-wrap">
          <section className="ga-index-section" aria-labelledby="ga-study-title">
            <div className="ga-section-head"><h2 id="ga-study-title">Estudos</h2></div>
            <StudyIndex layout="home" />
          </section>
          <section className="ga-method" aria-labelledby="ga-method-title">
            <h2 id="ga-method-title">Evidências e referências</h2>
            <div>
              <p>Cada ficha separa o que a obra descreve, o que vem da anatomia humana e o que foi reconstruído para a visualização.</p>
              <a className="ga-inline-link" href="/fontes">Consultar metodologia e fontes</a>
            </div>
          </section>
        </div>
      </main>
      <EditorialFooter />
    </div>
  );
}

export function StudiesPage() {
  return (
    <div className="ga-editorial">
      <main className="ga-editorial-wrap ga-inner-page" id="editorial-content" tabIndex={-1}>
        <header className="ga-page-intro">
          <h1>Estudos</h1>
          <p>Inspecione o espécime ou entre diretamente nas simulações de manifestação e transporte.</p>
        </header>
        <StudyIndex layout="listing" />
      </main>
      <EditorialFooter />
    </div>
  );
}
