import type { Page } from '@playwright/test';

const controls = { structures: 'body-structures', layers: 'body-layers', inspect: 'inspector-toggle', scan: 'body-scan', simulation: 'rinkaku-settings' } as const;

// Body and Rinkaku share tools while retaining their own scene state.
export async function openBodyTool(page: Page, tool: keyof typeof controls) {
  if (!await page.getByTestId('body-structures').isVisible()) return;
  const button = page.getByTestId(controls[tool]);
  if (await button.getAttribute('aria-expanded') === 'true') return;
  const close = page.getByTestId('body-panel-close');
  if (await close.isVisible()) await close.click();
  await button.click();
}

export async function chooseStructure(page: Page, id: string) {
  await openBodyTool(page, 'structures');
  await page.getByTestId(`structure-${id}`).click();
}
