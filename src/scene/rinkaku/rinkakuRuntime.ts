import { Box3, Matrix4 } from 'three';
import { rinkakuClock, useRinkaku } from '../../state/rinkaku';
import type { RinkakuAdapter } from './adapters';
import { RINKAKU_PLAYBACK_DURATION_SECONDS, playbackTimeAt } from '../../simulation/rinkakuPlayback';

/** Transient scene bridge. It neither owns a G2A lease nor duplicates editorial content. */
export const rinkakuRuntime: {
  adapter: RinkakuAdapter | null;
  connection: Matrix4;
  connectionSource: 'proxy' | 'asset-socket';
  bounds: Box3;
  mounted: number;
  disposed: number;
} = { adapter: null, connection: new Matrix4(), connectionSource: 'proxy', bounds: new Box3(), mounted: 0, disposed: 0 };

export function inspectRinkaku() {
  const state = useRinkaku.getState();
  return {
    enabled: state.enabled, playing: state.playing, direction: state.direction,
    t: rinkakuClock.t, config: { ...state.config }, snapshot: { ...rinkakuClock.snapshot },
    playback: { elapsedSeconds: rinkakuClock.elapsedSeconds, durationSeconds: RINKAKU_PLAYBACK_DURATION_SECONDS,
      retractDurationSeconds: RINKAKU_PLAYBACK_DURATION_SECONDS - playbackTimeAt(.95) },
    representation: rinkakuRuntime.adapter ? 'procedural' : 'unmounted',
    connection: { source: rinkakuRuntime.connectionSource, matrix: rinkakuRuntime.connection.toArray() },
    adapter: rinkakuRuntime.adapter?.inspect() ?? null,
    lifecycle: { mounted: rinkakuRuntime.mounted, disposed: rinkakuRuntime.disposed },
  };
}
