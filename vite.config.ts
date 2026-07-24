import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.svg'],
      manifest: {
        name: 'VitalTrack — Health Monitor',
        short_name: 'VitalTrack',
        description: 'Track blood pressure, sleep, exercise, meals, and symptoms. Share professional reports with your doctor.',
        theme_color: '#0A0E1A',
        background_color: '#0A0E1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // maskable icon fills the entire icon space (Android adaptive icons)
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell + assets for offline use. Supabase API calls are
        // NOT cached (network-first) so health data stays fresh when online.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api' },
          },
          {
            urlPattern: /\.(?:js|css|png|jpg|svg|woff2?)$/i,
            handler: 'CacheFirst',
            options: { cacheName: 'static-assets' },
          },
        ],
      },
      devOptions: {
        enabled: false, // don't register SW during `npm run dev`
      },
    }),
  ],
})
