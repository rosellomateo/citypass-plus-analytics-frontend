/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'embed' ? [viteSingleFile()] : []),
    (mode === 'mock' || mode === 'presentation') && {
      name: 'local-scenario-fixtures',
      configureServer(server) {
        server.middlewares.use('/__presentation/sessions.json', async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405).end();
            return;
          }
          try {
            const body = await readFile(resolve(server.config.root, 'testingDatos', 'sesiones-presentacion.json'));
            response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(body);
          } catch (error) {
            response.writeHead((error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500).end();
          }
        });
        server.middlewares.use('/__escenarios', async (request, response) => {
          const scenario = /^\/([1-6])\.json$/.exec(request.url ?? '');
          if (request.method !== 'GET' || !scenario) {
            response.writeHead(404).end();
            return;
          }
          try {
            const body = await readFile(resolve(server.config.root, 'testingDatos', `escenario-${scenario[1]}.json`));
            response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(body);
          } catch (error) {
            response.writeHead((error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500).end();
          }
        });
      },
    },
  ],
  ...(mode === 'embed' ? {
    publicDir: false,
    define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify('embedded') },
    build: {
      outDir: 'dist-embed',
      emptyOutDir: true,
      rollupOptions: { input: 'embed.html' },
    },
  } : {}),
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'dist-embed/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}));
