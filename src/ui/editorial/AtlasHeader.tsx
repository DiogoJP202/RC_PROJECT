import { useEffect, useRef, type ReactNode } from 'react';
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
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && menu.current?.open && !menu.current.contains(event.target)) menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.current?.open || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      menu.current.open = false;
      menu.current.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', outside, { passive: true });
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
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
          <img src="/assets/ui-r5/mark.svg" width="36" height="36" alt="" />
          <span>Ghoul Atlas</span>
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
