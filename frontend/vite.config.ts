import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: no `define` block here. Gemini calls go through the backend's
// /api/gemini/* routes (proxied same-site by server.ts), so no API key —
// or anything else server-side — is ever inlined into the client bundle.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
