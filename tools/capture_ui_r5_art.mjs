// Local Vite dev only. Reframe and relight the real scenes in a disposable
// browser session for editorial stills. No art controls are shipped to users.
/* global window, document */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.ATLAS_ART_URL ?? 'http://127.0.0.1:5175';
const destination = 'artifacts/local/ui-r5/art';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const shots = [
  { name: 'rinkaku-wide', width: 1440, height: 930, camera: [-3.15, 1.75, -4.13], target: [-.42, 1.12, -.32], fov: 31 },
  { name: 'rinkaku-portrait', width: 720, height: 830, camera: [-2.3, 1.46, -3.25], target: [.05, 1.23, -.56], fov: 34 },
  { name: 'rinkaku-study', width: 880, height: 570, camera: [2, 1.40, -2.70], target: [.05, 1.06, -.52], fov: 36 },
  { name: 'anatomia-study', width: 900, height: 680, camera: [2, 1.64, 2.83], target: [.02, 1.35, 0], fov: 26, body: true },
  { name: 'micro-study', width: 960, height: 490, micro: true },
];

try {
  await mkdir(destination, { recursive: true });
  for (const shot of shots) {
    const route = shot.micro ? '/atlas/vascular' : shot.body ? '/atlas?select=ghoul.kakuhou.rinkaku' : '/atlas/rinkaku';
    await page.goto(origin + route);
    await expect(page.getByTestId(shot.micro ? 'micro-status' : 'scene-status')).toHaveText(/Cena 3D pronta|3D conectado/);
    if (shot.micro) {
      await page.getByTestId('micro-controls-toggle').click();
      await page.getByTestId('micro-entity').selectOption('rc:17:0');
      await page.getByTestId('micro-panel-close').click();
      await page.getByTestId('micro-time').fill('11.25');
      await page.getByTestId('micro-follow').click();
    } else if (!shot.body) {
      await page.getByTestId('rinkaku-time').fill('0.88');
      await expect.poll(() => page.evaluate(() => window.__ATLAS_SCENE__?.snapshot().rinkaku.adapter?.t)).toBeCloseTo(.88, 6);
    }
    const data = await page.evaluate(async (shot) => {
      const resource = performance.getEntriesByType('resource').find(({ name }) => /\/@react-three_fiber\.js(?:\?|$)/.test(name));
      if (!resource) throw Error('Run with the local Vite development server.');
      const { _roots } = await import(resource.name);
      const canvas = document.querySelector(shot.micro ? '[data-testid="micro-stage"] canvas' : '[data-testid="stage"] canvas');
      const { gl, scene, camera, setFrameloop } = _roots.get(canvas).store.getState();
      setFrameloop('never');
      if (!shot.micro) {
        scene.background.set('#100d11');
        scene.fog.color.set('#100d11');
        scene.fog.near = 9;
        scene.fog.far = 15;
        const lights = scene.children.filter((object) => object.isDirectionalLight);
        lights[0].position.set(3.0, 4.2, -2.4);
        lights[0].color.set('#fff0e2');
        lights[0].intensity = 3.2;
        lights[1].position.set(-3.2, 2.1, 3.1);
        lights[1].color.set('#e78279');
        lights[1].intensity = 2;
        const ambient = scene.children.find((object) => object.isAmbientLight);
        ambient.color.set('#b6aca4');
        ambient.intensity = .3;
      }
      const view = camera.clone();
      if (shot.camera) {
        view.position.set(...shot.camera);
        view.lookAt(...shot.target);
        view.fov = shot.fov;
      }
      view.aspect = shot.width / shot.height;
      view.updateProjectionMatrix();
      gl.setPixelRatio(1);
      gl.setSize(shot.width, shot.height, false);
      gl.render(scene, view);
      return gl.domElement.toDataURL('image/png').split(',')[1];
    }, shot);
    await writeFile(`${destination}/${shot.name}.png`, Buffer.from(data, 'base64'));
    console.log(shot.name);
  }
} finally {
  await browser.close();
}
