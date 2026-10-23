type IconName = 'orbit' | 'focus' | 'reset' | 'layers' | 'eye' | 'chevron' | 'arrow' | 'play' | 'pause' | 'source' | 'close' | 'help' | 'expand';
const paths: Record<IconName, string> = {
  orbit: 'M3 12c0-3 4-5 9-5s9 2 9 5-4 5-9 5-9-2-9-5Zm9-9c3 0 5 4 5 9s-2 9-5 9-5-4-5-9 2-9 5-9Z',
  focus: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  layers: 'm3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
  chevron: 'm9 5 7 7-7 7', arrow: 'M5 12h14m-5-5 5 5-5 5',
  play: 'm8 5 11 7-11 7V5Z', pause: 'M8 5v14M16 5v14',
  source: 'M9 15 15 9M7 17H5a4 4 0 0 1-3-7l4-4a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l4-4a4 4 0 0 0-3-7h-2',
  close: 'm6 6 12 12M6 18 18 6', help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3h.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z',
  expand: 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5',
};
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
