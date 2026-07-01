import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api/qontak': {
        target: 'https://service-chat.qontak.com/api/open/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qontak/, ''),
      },
      '/api/qontak-auth': {
        target: 'https://service-chat.qontak.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qontak-auth/, ''),
      },
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        compact: true,
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor'
          }
          // FontAwesome icons
          if (id.includes('node_modules/@fortawesome/')) {
            return 'fontawesome'
          }
          // Real-time (Ably WebSocket - medium dep, used on several pages)
          if (id.includes('node_modules/ably/')) {
            return 'ably'
          }
          // PDF generation
          if (id.includes('node_modules/jspdf/')) {
            return 'jspdf'
          }
          // Screenshot/canvas
          if (id.includes('node_modules/html2canvas/')) {
            return 'html2canvas'
          }
          // UI utilities (small)
          if (id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/class-variance-authority/')) {
            return 'ui-vendor'
          }
          // Other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
          // Extract shared asesi components used across multiple pages
          if (id.includes('/src/hooks/useDataDokumenPraAsesmen') ||
              id.includes('/src/hooks/useSigningState') ||
              id.includes('/src/hooks/useAbsenCheck') ||
              id.includes('/src/components/ui/WebcamModal') ||
              id.includes('/src/components/ui/Radio') ||
              id.includes('/src/components/ui/Checkbox') ||
              id.includes('/src/components/ui/ActionButton') ||
              id.includes('/src/components/ui/ConfirmDialog')) {
            return 'asesi-shared'
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
  }
})
