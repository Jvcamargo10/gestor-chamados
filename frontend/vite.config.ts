import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: { '@dominio': fileURLToPath(new URL('../backend/src/dominio', import.meta.url)) },
  },
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
