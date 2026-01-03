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
        description: 'La plateforme logistique digitale pour l\'Afrique.',
        theme_color: '#0f172a', // Slate-900
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        categories: ['logistics', 'business', 'productivity'],
        screenshots: [
          {
            src: '/nextmove-mobile.png',
            sizes: '1080x1920',
            type: 'image/png',
            label: 'Tableau de bord NextMove'
          }
        ],
        shortcuts: [
          {
            name: 'Suivre un colis',
            short_name: 'Suivi',
            url: '/tracking',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Calculateur de prix',
            short_name: 'Prix',
            url: '/calculator',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
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
            if (id.includes('xlsx')) return 'excel';
            if (id.includes('jspdf')) return 'pdf';
            if (id.includes('html5-qrcode')) return 'qrcode';
            if (id.includes('canvas-confetti')) return 'confetti';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('i18next')) return 'i18n';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
