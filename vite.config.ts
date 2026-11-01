import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API calls through this same dev server origin (e.g.
      // contoh.localhost:3000/api/... -> localhost:4000/api/...) so the
      // browser sees a same-site request instead of a cross-site one
      // between the tenant subdomain and the API host. Cross-site fetches
      // can never carry a SameSite=Lax session cookie back, which made
      // every authenticated call silently 401 after login.
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: false,
        },
      },
    },
  };
});
