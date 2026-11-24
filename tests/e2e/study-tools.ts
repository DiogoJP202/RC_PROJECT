import type { Page } from '@playwright/test';
import { openBodyTool } from './body-tools';

export async function closeStudyTool(page: Page) {
  for (const id of ['body-panel-close', 'micro-panel-close']) {
    const close = page.getByTestId(id);
    if (await close.isVisible()) await close.click();
  }
}

export async function openMicroTool(page: Page, kind: 'controls' | 'inspect') {
  const button = page.getByTestId(kind === 'controls' ? 'micro-controls-toggle' : 'micro-inspector-toggle');
  if (await button.getAttribute('aria-expanded') === 'true') return;
  await closeStudyTool(page);
  await button.click();
}

export async function changeMicroSelect(page: Page, id: 'micro-profile' | 'micro-entity', value: string) {
  await openMicroTool(page, 'controls');
  await page.getByTestId(id).selectOption(value);
  await closeStudyTool(page);
}

export async function setMicroHighlight(page: Page, checked: boolean) {
  await openMicroTool(page, 'controls');
  await page.getByTestId('micro-highlight').setChecked(checked);
  await closeStudyTool(page);
}

export async function changeRinkakuSelect(page: Page, id: 'rinkaku-count' | 'rinkaku-quality', value: string) {
  await openBodyTool(page, 'simulation');
  await page.getByTestId(id).selectOption(value);
  await closeStudyTool(page);
}

export async function setRinkakuParticles(page: Page, checked: boolean) {
  await openBodyTool(page, 'simulation');
  await page.getByTestId('rinkaku-particles').setChecked(checked);
  await closeStudyTool(page);
}

export async function changeRinkakuView(page: Page, id: string) {
  await openBodyTool(page, 'simulation');
  await page.getByTestId(id).click();
  await closeStudyTool(page);
}
