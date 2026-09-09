import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // NEXUS's backend (server/index.ts) runs as its own small Express
    // process — the frontend only ever talks to it via /api/nexus/*.
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.NEXUS_SERVER_PORT || 8787}`,
        changeOrigin: true,
      },
    },
    watch: {
      // Imagenes/ is a personal scratch folder for staging assets before
      // they're copied into public/ — it's not part of the served app, and
      // a file mid-write there (cloud sync, a fresh screenshot, etc.) can
      // hit an EBUSY lock that crashes Vite's watcher entirely. Ignore it.
      ignored: ['**/Imagenes/**'],
    },
  },
})
