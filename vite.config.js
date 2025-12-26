import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'og-image.jpg'],
      manifest: {
        name: 'NextMove Cargo',
        short_name: 'NextMove',
        description: 'Votre partenaire logistique de confiance',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('xlsx')) return 'excel';
            if (id.includes('jspdf')) return 'pdf';
            if (id.includes('html5-qrcode')) return 'qrcode';
            if (id.includes('canvas-confetti')) return 'confetti';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('react/') || id.includes('react-dom') || id.includes('react-is') || id.includes('scheduler') || id.includes('prop-types')) return 'vendor-react';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
