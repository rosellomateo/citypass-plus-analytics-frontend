/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'embed' ? [viteSingleFile()] : []),
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
