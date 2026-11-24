import type { KeyboardEvent } from 'react';

export function containDialogTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab' || !event.currentTarget.matches(':modal')) return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]'))
    .filter((control) => control.tabIndex >= 0 && !control.matches(':disabled')
      && control.getClientRects().length > 0 && getComputedStyle(control).visibility !== 'hidden');
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
