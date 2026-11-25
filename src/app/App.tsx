import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { AtlasHeader } from '../ui/editorial/AtlasHeader';
import { EditorialStatus, HomePage, StudiesPage } from '../ui/editorial/EditorialPage';
import { Icon } from '../ui/Icon';
import { containDialogTab } from '../ui/dialogKeys';
import { atlasHref, atlasPaths, cellHref, coldVascularHref, isBodyView, readRoute, type AppRoute, type AtlasRoute, type NavigationKind } from './routes';

import { captureInspection, vascularInspection, type VascularInspectionSnapshot } from './vascularInspection';

const CellWorkspace = lazy(() => import('../ui/CellWorkspace'));
const Workspace = lazy(() => import('./AtlasWorkspace'));
const SourcesPage = lazy(() => import('../ui/editorial/SourcesPage'));

interface RouteState {
  route: AppRoute;
  workspace: AtlasRoute | null;
  bodyVisited: boolean;
  kind: NavigationKind;
  revision: number;
  vascularReturn?: VascularInspectionSnapshot;
  hasCellOrigin?: boolean;
}
interface AtlasHistory { session: string; entry: number; returnHref?: string }
interface CellVisit { originEntry: number; originHref: string; snapshot: VascularInspectionSnapshot; owner: object }
const historyKey = 'ghoulAtlas';
const appSession = Math.random().toString(36).slice(2);
const currentRoute = () => readRoute(new URL(window.location.href));
const currentHref = () => window.location.pathname + window.location.search + window.location.hash;
const isCreditsRoute = (route: AppRoute) => route.section === 'sources' && route.href.endsWith('#creditos');

function currentBookmark(): AtlasHistory | undefined {
  const value: unknown = window.history.state?.[historyKey];
  if (!value || typeof value !== 'object' || !('session' in value) || value.session !== appSession || !('entry' in value) || typeof value.entry !== 'number') return;
  return { session: appSession, entry: value.entry, returnHref: 'returnHref' in value && typeof value.returnHref === 'string' ? value.returnHref : undefined };
}

function RouteStatus({ cell }: { cell: boolean }) {
  return (
    <main>
      <EditorialStatus id="editorial-content" title={cell ? 'Célula indisponível' : 'Página não encontrada'}
        action={<a className="ga-action" href={cell ? atlasPaths.vascular : '/'}>{cell ? 'Abrir circulação' : 'Voltar à vitrine'}</a>}>
        {cell ? 'Abra a circulação para selecionar uma célula RC presente no modelo.' : 'O endereço solicitado não corresponde a uma página do atlas.'}
      </EditorialStatus>
    </main>
  );
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
  const displayedRoute = useRef(state.route);
  const sequence = useRef(0);
  const entryId = useRef(0);
  const visits = useRef(new Map<number, CellVisit>());
  const entryRequest = useRef<AbortController | null>(null);

  const cancelEntry = useCallback(() => {
    entryRequest.current?.abort();
    entryRequest.current = null;
  }, []);

  const publish = useCallback((route: AppRoute, kind: NavigationKind, vascularReturn?: VascularInspectionSnapshot) => {
    displayedRoute.current = route;
    const visit = route.section === 'cell' ? visits.current.get(entryId.current) : undefined;
    const hasCellOrigin = !!visit && visit.owner === vascularInspection.controller?.owner;
    setState((old) => ({
      route, kind, vascularReturn, hasCellOrigin, revision: old.revision + 1, workspace: route.section === 'atlas' ? route : old.workspace,
      bodyVisited: old.bodyVisited || (route.section === 'atlas' && isBodyView(route.view)),
    }));
  }, []);

  useLayoutEffect(() => {
    const route = currentRoute();
    window.history.replaceState({ ...window.history.state, [historyKey]: { session: appSession, entry: entryId.current } }, '', route.href);
    return cancelEntry;
  }, [cancelEntry]);

  const navigate = useCallback((href: string, replace = false, visit?: CellVisit) => {
    const next = readRoute(new URL(href, window.location.href));
    const previous = currentRoute();
    if (previous.href === next.href) {
      if (isCreditsRoute(next)) publish(next, 'link');
      return;
    }
    cancelEntry();
    backPending.current = false;
    if (previous.section === 'atlas' && next.section !== 'atlas') atlasScroll.current = window.scrollY;
    const returnHref = next.section === 'atlas' && next.view === 'vascular'
      && previous.section === 'atlas' && isBodyView(previous.view) ? previous.href : undefined;
    if (replace) visits.current.delete(entryId.current);
    else {
      for (const key of visits.current.keys()) if (key > entryId.current) visits.current.delete(key);
      entryId.current = ++sequence.current;
    }
    const entry = { [historyKey]: { session: appSession, entry: entryId.current, returnHref } satisfies AtlasHistory };
    if (replace) window.history.replaceState(entry, '', next.href);
    else window.history.pushState(entry, '', next.href);
    if (visit) visits.current.set(entryId.current, visit);
    publish(next, 'link');
  }, [cancelEntry, publish]);

  const openCell = useCallback(async (id: string, webglOff: boolean) => {
    const origin = currentRoute();
    const owner = vascularInspection.controller?.owner;
    if (entryRequest.current || !owner || origin.section !== 'atlas' || origin.view !== 'vascular') return;
    const originEntry = entryId.current;
    const request = new AbortController();
    entryRequest.current = request;
    const snapshot = await captureInspection(request.signal);
    if (request.signal.aborted || originEntry !== entryId.current || currentRoute().href !== origin.href) return;
    entryRequest.current = null;
    if (!snapshot) return;
    navigate(cellHref(id, webglOff), false, { originEntry, originHref: origin.href, snapshot, owner });
  }, [navigate]);

  const returnFromCell = useCallback(() => {
    const route = currentRoute();
    if (route.section !== 'cell' || backPending.current) return;
    const visit = visits.current.get(entryId.current);
    if (visit && visit.owner === vascularInspection.controller?.owner) {
      backPending.current = true;
      window.history.back();
    } else navigate(coldVascularHref(route.entity, route.webglOff), true);
  }, [navigate]);

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
      cancelEntry();
      backPending.current = false;
      const previousEntry = entryId.current;
      const previous = displayedRoute.current;
      const route = currentRoute();
      const bookmark = currentBookmark();
      entryId.current = bookmark?.entry ?? ++sequence.current;
      if (!bookmark || route.href !== currentHref()) {
        window.history.replaceState({ ...window.history.state,
          [historyKey]: bookmark ?? { session: appSession, entry: entryId.current } }, '', route.href);
      }
      if (previousSection.current === 'atlas' && route.section !== 'atlas') atlasScroll.current = window.scrollY;
      const controller = vascularInspection.controller;
      const origin = previous.section === 'cell' ? visits.current.get(previousEntry) : undefined;
      if (route.section === 'atlas' && route.view === 'vascular' && origin
        && origin.originEntry === entryId.current && origin.originHref === route.href && origin.owner === controller?.owner) {
        controller.restore(origin.snapshot);
        publish(route, 'history', origin.snapshot);
        return;
      }
      const saved = route.section === 'cell' ? visits.current.get(entryId.current) : undefined;
      if (saved && previous.section === 'atlas' && previous.view === 'vascular' && saved.originEntry === previousEntry
        && saved.originHref === previous.href && saved.owner === controller?.owner) {
        const destination = entryId.current;
        const request = new AbortController();
        entryRequest.current = request;
        void captureInspection(request.signal).then((snapshot) => {
          if (request.signal.aborted || entryId.current !== destination) return;
          entryRequest.current = null;
          if (snapshot) visits.current.set(destination, { ...saved, snapshot });
          else visits.current.delete(destination);
          publish(route, 'history');
        });
        return;
      }
      publish(route, 'history');
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [cancelEntry, publish]);

  useLayoutEffect(() => {
    const section = state.route.section;
    if (state.kind !== 'initial' && section !== 'atlas' && !isCreditsRoute(state.route)) {
      window.scrollTo(0, 0);
      // Sources can still be loading, so the stable page container owns focus.
      document.getElementById('editorial-route')?.focus({ preventScroll: true });
    } else if (section === 'atlas' && previousSection.current !== 'atlas') {
      window.scrollTo(0, state.vascularReturn?.scroll ?? atlasScroll.current);
      const target = state.vascularReturn
        ? (document.querySelector<HTMLElement>('[data-testid="micro-inspect-cell"]:not(:disabled)') ?? document.querySelector<HTMLElement>('[data-testid="micro-selection"]'))
        : document.getElementById('atlas-session');
      target?.focus({ preventScroll: true });
    }
    previousSection.current = section;
  }, [state.route, state.kind, state.vascularReturn]);

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
  const cell = state.route.section === 'cell' && state.route.entity ? state.route : null;
  const atlasLink = state.workspace && state.workspace.view !== 'compare' ? state.workspace.href : atlasPaths.body;
  const openHelp = useCallback(() => help.current?.showModal(), []);
  const returnHref = active && state.route.section === 'atlas' && state.route.view === 'vascular' ? currentBookmark()?.returnHref : undefined;
  const returnsToRinkaku = !!returnHref && new URL(returnHref, window.location.origin).pathname === atlasPaths.rinkaku;
  return <div className="atlas-app" onClick={followLink}>
    {!active ? <div id="editorial-route" tabIndex={-1} style={{ outline: 'none' }}>
      <AtlasHeader current={cell ? 'atlas' : state.route.section === 'home' || state.route.section === 'studies' || state.route.section === 'sources' ? state.route.section : null}
        atlasHref={atlasLink} onHelp={openHelp} />
      {state.route.section === 'home' ? <HomePage />
        : state.route.section === 'studies' ? <StudiesPage />
        : state.route.section === 'sources' ? <Suspense fallback={<main role="status">Carregando fontes…</main>}><SourcesPage creditsRequest={isCreditsRoute(state.route) ? state.revision : undefined} /></Suspense>
        : cell && cell.entity ? (
          <Suspense fallback={<main className="ga-editorial ga-catalog-loading" id="editorial-content">
            <h1>Abrindo observatório celular…</h1>
            <button className="ga-action" onClick={returnFromCell}>Voltar à circulação</button>
          </main>}>
            <CellWorkspace key={cell.href} entity={cell.entity} hasOrigin={state.hasCellOrigin === true} webglOff={cell.webglOff}
              onReturn={returnFromCell} shortcutsEnabled={shortcutsEnabled} />
          </Suspense>
        ) : <RouteStatus cell={state.route.section === 'cell'} />}
    </div> : null}
    {state.workspace ? <div id="atlas-session" tabIndex={-1} inert={!active} aria-hidden={!active || undefined}
      style={active ? undefined : { visibility: 'hidden', pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'clip' }}>
      <Suspense fallback={<main role="status">Carregando observatório…</main>}>
        <Workspace route={state.workspace} active={active} bodyVisited={state.bodyVisited} navigationKind={state.kind} navigationRevision={state.revision}
          navigate={navigate} onInspectCell={openCell} vascularReturn={state.vascularReturn} returnFromVascular={returnFromVascular} returnsToRinkaku={returnsToRinkaku} onHelp={openHelp} shortcutsEnabled={shortcutsEnabled} />
      </Suspense>
    </div> : null}
    <dialog ref={help} className="help-dialog" aria-labelledby="help-title" onKeyDown={containDialogTab}>
      <button className="icon-button dialog-close" aria-label="Fechar ajuda" onClick={() => help.current?.close()}><Icon name="close" /></button>
      <h2 id="help-title">Controles e navegação</h2>
      <p>Arraste para girar. Role ou use dois dedos para aproximar. Selecione na cena ou na lista.</p>
      <dl>
        <div><dt>R</dt><dd>Reenquadrar a cena atual.</dd></div>
        <div><dt>Esc</dt><dd>Fechar um diálogo, soltar o acompanhamento ou retornar ao contexto anterior.</dd></div>
        <div><dt>1 / 2</dt><dd>Abrir Corpo ou Micro.</dd></div>
        <div><dt>Espaço</dt><dd>Reproduzir ou pausar uma simulação. No Corpo, abra Varredura para acessar os controles.</dd></div>
        <div><dt>Tab / Enter</dt><dd>Navegar e selecionar na interface.</dd></div>
        <div><dt>Setas</dt><dd>Alternar Estrutura e Evidências nas fichas. Home e End acessam a primeira e a última aba.</dd></div>
      </dl>
      <label className="shortcut-preference"><input data-testid="keyboard-shortcuts" type="checkbox" checked={shortcutsEnabled} onChange={(event) => setShortcutsEnabled(event.target.checked)} />Ativar atalhos de cena</label>
      <p className="shortcut-hint">Controle os atalhos R, teclas numéricas e Espaço no observatório.</p>
      <p className="claim-disclaimer">As fichas indicam quais afirmações têm fonte e quais partes foram reconstruídas para a visualização.</p>
      <button className="primary-button" onClick={() => help.current?.close()}>Fechar guia</button>
    </dialog>
  </div>;
}
