import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, Vite (5173) proxies API calls to the Express server (8787).
    proxy: { '/api': 'http://localhost:8787' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Server tests run under Node (not jsdom) since they exercise Node-only code.
    environmentMatchGlobs: [['server/**', 'node']],
    setupFiles: './src/setupTests.js',
    // node:sqlite is experimental in Node 22 (see README) and needs this flag
    // active in the worker process/thread that runs it.
    poolOptions: {
      threads: { execArgv: ['--experimental-sqlite'] },
      forks: { execArgv: ['--experimental-sqlite'] },
    },
  },
});
