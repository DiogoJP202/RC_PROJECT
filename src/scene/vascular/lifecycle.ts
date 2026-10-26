/** Observable lifecycle counts, not GPU memory measurements. Renderer resources
 * are owned by adapters; this module retains only counters after unmount. */
export const vascularLifecycle = { created: 0, disposed: 0, active: 0 };
declare global { interface Window { __ATLAS_VASCULAR_RESOURCES__?: () => { created: number; disposed: number; active: number } } }
if (typeof window !== 'undefined') window.__ATLAS_VASCULAR_RESOURCES__ = () => ({ ...vascularLifecycle });
