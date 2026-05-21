import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MedProd',
        short_name: 'MedProd',
        description: 'Controle de produção médica mensal',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache' }
          }
        ]
      }
    })
  ]
})
