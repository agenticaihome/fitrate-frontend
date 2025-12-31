import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // AUTO-UPDATE: Automatically activate new SW and reload when update available
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      workbox: {
        // Import push notification handler into generated service worker
        importScripts: ['push-handler.js'],
        // AGGRESSIVE UPDATE: Skip waiting and claim all clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches from previous versions
        cleanupOutdatedCaches: true,
        // SPA Navigation: Fallback to index.html for navigation requests
        // This is critical for PWA to handle client-side routing correctly
        navigateFallback: 'index.html',
        // Exclude these routes from navigateFallback since they have edge functions
        // that need to run for OG meta tag injection
        navigateFallbackDenylist: [
          /^\/b\//, // Battle rooms
          /^\/c\//, // Challenge rooms  
          /^\/f\//, // Fashion shows
          /^\/about\.html$/,
          /^\/privacy\.html$/,
          /^\/terms\.html$/
        ],
        // Exclude HTML files with redirects from precaching
        // These are fallback files that contain window.location.replace() 
        // which Safari's SW doesn't like when served from cache
        globPatterns: ['**/*.{js,css,png,svg,ico,woff,woff2}'],
        // Runtime caching for API requests
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fitrate-production\.up\.railway\.app\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              // Only cache successful responses (200), not redirects (3xx)
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'FitRate - Your AI Style Coach',
        short_name: 'FitRate',
        description: 'Your personal AI style coach - instant outfit feedback',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // Production optimizations
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        // Optimized chunking for faster initial load
        manualChunks: (id) => {
          // Core React - cached long term
          if (id.includes('node_modules/react')) {
            return 'react-vendor'
          }
          // Heavy screens - load on demand
          if (id.includes('/screens/Results') ||
            id.includes('/screens/Battle') ||
            id.includes('/screens/Arena') ||
            id.includes('/screens/FashionShow')) {
            return 'screens-heavy'
          }
          // Modals - load on demand
          if (id.includes('/modals/')) {
            return 'modals'
          }
          // Utils - small, cache long term
          if (id.includes('/utils/')) {
            return 'utils'
          }
        }
      }
    },
    cssCodeSplit: false,
    sourcemap: false,
    chunkSizeWarningLimit: 600
  },
  // Dev server optimizations
  server: {
    hmr: true
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
