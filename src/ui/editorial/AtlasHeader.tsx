import { useRef, type ReactNode } from 'react';
import { Icon } from '../Icon';
import './editorial.css';

type Area = 'home' | 'atlas' | 'studies' | 'sources' | null;

interface AtlasHeaderProps {
  current: Area;
  atlasHref?: string;
  onHelp: () => void;
  atlasControls?: ReactNode;
}

export function AtlasHeader({ current, atlasHref = '/atlas', onHelp, atlasControls }: AtlasHeaderProps) {
  const menu = useRef<HTMLDetailsElement>(null);
  const items = [
    { href: atlasHref, label: 'Atlas', area: 'atlas' },
    { href: '/estudos', label: 'Estudos', area: 'studies' },
    { href: '/fontes', label: 'Fontes', area: 'sources' },
  ];
  const links = () => items.map(({ href, label, area }) => (
    <a key={area} href={href} aria-current={current === area ? 'page' : undefined}
      onClick={(event) => {
        if (event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
          && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector('summary')?.focus();
        }
      }}>{label}</a>
  ));

  return (
    <header className={'ga-header' + (atlasControls ? ' ga-header--with-controls' : '')}>
      <div className="ga-header-bar">
        <a className="ga-logo" href="/" aria-label="Ghoul Atlas início"
          aria-current={current === 'home' ? 'page' : undefined}>
          <img src="/atlas-mark.svg" width="30" height="30" alt="" />
          <span>Ghoul Atlas<small>Arquivo Anatômico</small></span>
        </a>
        <nav className="ga-primary-nav" aria-label="Navegação principal">{links()}</nav>
        {atlasControls ? <div className="ga-header-atlas-tools">{atlasControls}</div> : null}
        <div className="ga-header-actions">
          <details ref={menu} className="ga-header-menu" onKeyDown={(event) => {
            if (event.key === 'Escape' && menu.current?.open) {
              event.preventDefault();
              event.stopPropagation();
              menu.current.open = false;
              menu.current.querySelector('summary')?.focus();
            }
          }}>
            <summary>Menu <Icon name="chevron" size={15} /></summary>
            <nav aria-label="Navegação principal">{links()}</nav>
          </details>
          <button className="ga-help-trigger" type="button" aria-label="Ajuda" aria-haspopup="dialog" onClick={onHelp}>
            <Icon name="help" size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}
