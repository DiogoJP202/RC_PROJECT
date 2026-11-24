import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { AtlasHeader } from '../ui/editorial/AtlasHeader';
import { HomePage, StudiesPage } from '../ui/editorial/EditorialPage';
import { Icon } from '../ui/Icon';
import { containDialogTab } from '../ui/dialogKeys';
import { atlasHref, atlasPaths, isBodyView, readRoute, type AppRoute, type AtlasRoute, type NavigationKind } from './routes';

const Workspace = lazy(() => import('./AtlasWorkspace'));
const SourcesPage = lazy(() => import('../ui/editorial/SourcesPage'));

interface RouteState {
  route: AppRoute;
  workspace: AtlasRoute | null;
  bodyVisited: boolean;
  kind: NavigationKind;
  revision: number;
}
interface AtlasHistory { session: string; returnHref?: string }
const historyKey = 'ghoulAtlas';
const appSession = Math.random().toString(36).slice(2);
const currentRoute = () => readRoute(new URL(window.location.href));
const currentHref = () => window.location.pathname + window.location.search + window.location.hash;
const isCreditsRoute = (route: AppRoute) => route.section === 'sources' && route.href.endsWith('#creditos');

function currentBookmark(): AtlasHistory | undefined {
  const value: unknown = window.history.state?.[historyKey];
  if (!value || typeof value !== 'object' || !('session' in value) || value.session !== appSession) return;
  if ('returnHref' in value && typeof value.returnHref === 'string') {
    return { session: appSession, returnHref: value.returnHref };
  }
  return { session: appSession };
}

function RouteStatus({ cell }: { cell: boolean }) {
  return <main id="editorial-content" className="ga-route-status">
    <h1>{cell ? 'Inspeção celular indisponível' : 'Página não encontrada'}</h1>
    <p>{cell ? 'O acompanhamento de células RC está disponível no estudo de transporte vascular.' : 'O endereço solicitado não corresponde a uma página do atlas.'}</p>
    <a href={cell ? atlasPaths.vascular : '/'}>{cell ? 'Voltar ao fluxo' : 'Voltar à vitrine'}</a>
  </main>;
}

export default function App() {
  const [state, setState] = useState<RouteState>(() => {
    const route = currentRoute();
    return { route, workspace: route.section === 'atlas' ? route : null, bodyVisited: route.section === 'atlas' && isBodyView(route.view), kind: 'initial', revision: 0 };
  });
  const help = useRef<HTMLDialogElement>(null);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const backPending = useRef(false);
  const atlasScroll = useRef(0);
  const previousSection = useRef<AppRoute['section']>(state.route.section);

  const publish = useCallback((route: AppRoute, kind: NavigationKind) => {
    setState((old) => ({
      route, kind, revision: old.revision + 1, workspace: route.section === 'atlas' ? route : old.workspace,
      bodyVisited: old.bodyVisited || (route.section === 'atlas' && isBodyView(route.view)),
    }));
  }, []);

  useLayoutEffect(() => {
    const route = currentRoute();
    if (route.href !== currentHref()) window.history.replaceState(window.history.state, '', route.href);
  }, []);

  const navigate = useCallback((href: string, replace = false) => {
    const next = readRoute(new URL(href, window.location.href));
    const previous = currentRoute();
    if (previous.href === next.href) {
      // Reselect the fragment without creating a duplicate history entry.
      if (isCreditsRoute(next)) publish(next, 'link');
      return;
    }
    backPending.current = false;
    if (previous.section === 'atlas' && next.section !== 'atlas') atlasScroll.current = window.scrollY;
    const returnHref = next.section === 'atlas' && next.view === 'vascular'
      && previous.section === 'atlas' && isBodyView(previous.view) ? previous.href : undefined;
    const entry = { [historyKey]: { session: appSession, returnHref } satisfies AtlasHistory };
    if (replace) window.history.replaceState(entry, '', next.href);
    else window.history.pushState(entry, '', next.href);
    publish(next, 'link');
  }, [publish]);

  const returnFromVascular = useCallback(() => {
    const route = currentRoute();
    if (route.section !== 'atlas' || route.view !== 'vascular' || backPending.current) return;
    if (currentBookmark()?.returnHref) {
      backPending.current = true;
      window.history.back();
    } else navigate(atlasHref('body', route.search), true);
  }, [navigate]);

  useEffect(() => {
    const pop = () => {
      backPending.current = false;
      const route = currentRoute();
      if (route.href !== currentHref()) window.history.replaceState(window.history.state, '', route.href);
      if (previousSection.current === 'atlas' && route.section !== 'atlas') atlasScroll.current = window.scrollY;
      publish(route, 'history');
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [publish]);

  useLayoutEffect(() => {
    const section = state.route.section;
    if (state.kind !== 'initial' && section !== 'atlas' && !isCreditsRoute(state.route)) {
      window.scrollTo(0, 0);
      // Sources can still be loading, so the stable page container owns focus.
      document.getElementById('editorial-route')?.focus({ preventScroll: true });
    } else if (section === 'atlas' && previousSection.current !== 'atlas') {
      window.scrollTo(0, atlasScroll.current);
      document.getElementById('atlas-session')?.focus({ preventScroll: true });
    }
    previousSection.current = section;
  }, [state.route, state.kind]);

  useEffect(() => {
    const route = state.route;
    const title = route.section === 'atlas'
      ? { body: 'Observatório', rinkaku: 'Manifestação Rinkaku', vascular: 'Transporte de células RC', compare: 'Comparação' }[route.view]
      : { home: 'Arquivo Anatômico', studies: 'Estudos', sources: 'Fontes', cell: 'Inspeção celular', 'not-found': 'Página não encontrada' }[route.section];
    document.title = 'Ghoul Atlas — ' + title;
  }, [state.route]);

  const followLink = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== '_self')
      || anchor.hasAttribute('download') || anchor.getAttribute('href')?.startsWith('#')) return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || readRoute(url).section === 'not-found') return;
    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };

  const active = state.route.section === 'atlas';
  const atlasLink = state.workspace && state.workspace.view !== 'compare' ? state.workspace.href : atlasPaths.body;
  const openHelp = useCallback(() => help.current?.showModal(), []);
  const returnHref = active && state.route.section === 'atlas' && state.route.view === 'vascular' ? currentBookmark()?.returnHref : undefined;
  const returnsToRinkaku = !!returnHref && new URL(returnHref, window.location.origin).pathname === atlasPaths.rinkaku;
  return <div className="atlas-app" onClick={followLink}>
    {!active ? <div id="editorial-route" tabIndex={-1} style={{ outline: 'none' }}>
      <AtlasHeader current={state.route.section === 'home' || state.route.section === 'studies' || state.route.section === 'sources' ? state.route.section : null}
        atlasHref={atlasLink} onHelp={openHelp} />
      {state.route.section === 'home' ? <HomePage />
        : state.route.section === 'studies' ? <StudiesPage />
        : state.route.section === 'sources' ? <Suspense fallback={<main role="status">Carregando fontes…</main>}><SourcesPage creditsRequest={isCreditsRoute(state.route) ? state.revision : undefined} /></Suspense>
        : <RouteStatus cell={state.route.section === 'cell'} />}
    </div> : null}
    {state.workspace ? <div id="atlas-session" tabIndex={-1} inert={!active} aria-hidden={!active || undefined}
      style={active ? undefined : { visibility: 'hidden', pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'clip' }}>
      <Suspense fallback={<main role="status">Carregando observatório…</main>}>
        <Workspace route={state.workspace} active={active} bodyVisited={state.bodyVisited} navigationKind={state.kind} navigationRevision={state.revision}
          navigate={navigate} returnFromVascular={returnFromVascular} returnsToRinkaku={returnsToRinkaku} onHelp={openHelp} shortcutsEnabled={shortcutsEnabled} />
      </Suspense>
    </div> : null}
    <dialog ref={help} className="help-dialog" aria-labelledby="help-title" onKeyDown={containDialogTab}>
      <button className="icon-button dialog-close" aria-label="Fechar ajuda" onClick={() => help.current?.close()}><Icon name="close" /></button>
      <h2 id="help-title">Controles e navegação</h2>
      <p>Arraste para girar. Role ou use dois dedos para aproximar. Selecione na cena ou na lista.</p>
      <dl>
        <div><dt>R</dt><dd>Reenquadrar a cena atual.</dd></div>
        <div><dt>Esc</dt><dd>Fechar um diálogo, soltar o acompanhamento ou retornar ao contexto anterior.</dd></div>
        <div><dt>1 / 2</dt><dd>Corpo / Micro.</dd></div>
        <div><dt>Espaço</dt><dd>Reproduzir ou pausar uma simulação. No Corpo, abra Varredura para acessar os controles.</dd></div>
        <div><dt>Tab / Enter</dt><dd>Navegar e selecionar na interface.</dd></div>
        <div><dt>Setas</dt><dd>Alternar Estrutura e Evidências nas fichas. Home e End acessam a primeira e a última aba.</dd></div>
      </dl>
      <label className="shortcut-preference"><input data-testid="keyboard-shortcuts" type="checkbox" checked={shortcutsEnabled} onChange={(event) => setShortcutsEnabled(event.target.checked)} />Ativar atalhos de cena</label>
      <p className="shortcut-hint">Controle os atalhos R, teclas numéricas e Espaço no observatório.</p>
      <p className="claim-disclaimer">Use as fichas para consultar fontes e limites. Uma afirmação verificável não torna a geometria canônica.</p>
      <button className="primary-button" onClick={() => help.current?.close()}>Fechar guia</button>
    </dialog>
  </div>;
}
