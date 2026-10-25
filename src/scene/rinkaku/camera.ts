import type { CameraPose, FocusVolume } from '../camera';
import { overviewDistance } from '../camera';

/** Fixed envelope rather than live growth bounds: scrubbing cannot pump the camera. */
export function rinkakuCameraPose(view: 'posterior' | 'lateral' | 'oblique', aspect: number, volume: FocusVolume): CameraPose {
  const mobile = aspect < .9;
  // The old axis-aligned box leaves large unused corners in rear projection.
  // A fixed mobile fit retains the complete authored silhouette without following live growth bounds.
  const distance = overviewDistance(Math.max(1.9, volume.size[1]), 36, aspect, mobile ? .85 : .68, Math.max(2.2, volume.size[0])) * (mobile ? .8 : 1);
  const [x, y, z] = volume.center;
  const target: [number, number, number] = [x, y + (mobile ? -.08 : .02), z];
  return { target, position: view === 'posterior'
    ? [x - distance * .32, target[1] + distance * .035, z - distance * .95]
    : view === 'lateral' ? [x + distance * .95, target[1] + distance * .05, z - distance * .32]
    : [x + distance * .64, target[1] + distance * .04, z - distance * .77] };
}
