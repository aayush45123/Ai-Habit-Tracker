import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generates stats.html after `npm run build` so you can see what's large
    visualizer({
      open: false,          // set to true to auto-open after each build
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  build: {
    target: 'es2015',
    // Recharts + D3 vendor chunk is intentionally large (~424 kB, 122 kB gzip).
    // All other product chunks are under 100 kB. Raise threshold to 450 to allow
    // this single justified large vendor while still catching regressions.
    chunkSizeWarningLimit: 450,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — cached indefinitely once loaded
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // Recharts & D3 charting engine — cached together
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')) {
            return 'recharts';
          }

          // Icon libraries — shared across pages but split from core
          if (id.includes('node_modules/react-icons') ||
              id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Firebase SDK — cached separately from application logic
          if (id.includes('node_modules/firebase') ||
              id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }

          // Animation engine (GSAP)
          if (id.includes('node_modules/gsap')) {
            return 'animation-vendor';
          }

          // Socket.io — only needed when authenticated
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client')) {
            return 'socket';
          }
        },
      },
    },
  },
})
