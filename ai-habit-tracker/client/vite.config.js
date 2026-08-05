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
    // Warn if any chunk exceeds 400 KB (gzipped) — helps catch regressions
    chunkSizeWarningLimit: 400,

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

          // Chart libraries — split by library so each page only loads what it needs
          if (id.includes('node_modules/chart.js') ||
              id.includes('node_modules/react-chartjs-2')) {
            return 'chartjs';
          }

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
