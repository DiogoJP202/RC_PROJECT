import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

function keepAssetFailuresOutOfHtml(): Plugin {
  const pass = (request: IncomingMessage, _response: ServerResponse, next: () => void) => {
    const path = request.url?.split(/[?#]/, 1)[0];
    // Static files are still served normally; Vite's SPA fallback only runs for
    // requests accepting HTML or */*. A missing catalog or GLB should stay a 404.
    if (path && /\.(?:glb|json)$/i.test(path)) request.headers.accept = 'application/octet-stream';
    next();
  };
  return {
    name: 'atlas-asset-not-found',
    configureServer(server) { server.middlewares.use(pass); },
    configurePreviewServer(server) { server.middlewares.use(pass); },
  };
}

export default defineConfig({
  plugins: [react(), keepAssetFailuresOutOfHtml()],
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'], clearMocks: true },
});
