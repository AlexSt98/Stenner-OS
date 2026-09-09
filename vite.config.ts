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
  },
})
