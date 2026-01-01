// vite.config.js
import { defineConfig } from "file:///C:/Users/natha/OneDrive/Desktop/FitRate.App/fitrate-frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/natha/OneDrive/Desktop/FitRate.App/fitrate-frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/natha/OneDrive/Desktop/FitRate.App/fitrate-frontend/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      // AUTO-UPDATE: Automatically activate new SW and reload when update available
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      workbox: {
        // Import push notification handler into generated service worker
        importScripts: ["push-handler.js"],
        // AGGRESSIVE UPDATE: Skip waiting and claim all clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches from previous versions
        cleanupOutdatedCaches: true,
        // SPA Navigation: Fallback to index.html for navigation requests
        // This is critical for PWA to handle client-side routing correctly
        navigateFallback: "index.html",
        // Exclude these routes from navigateFallback since they have edge functions
        // that need to run for OG meta tag injection
        navigateFallbackDenylist: [
          /^\/b\//,
          // Battle rooms
          /^\/c\//,
          // Challenge rooms  
          /^\/f\//,
          // Fashion shows
          /^\/about\.html$/,
          /^\/privacy\.html$/,
          /^\/terms\.html$/
        ],
        // Exclude HTML files with redirects from precaching
        // These are fallback files that contain window.location.replace() 
        // which Safari's SW doesn't like when served from cache
        globPatterns: ["**/*.{js,css,png,svg,ico,woff,woff2}"],
        // Runtime caching for API requests
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fitrate-production\.up\.railway\.app\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
                // 5 minutes
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
        name: "FitRate - Your AI Style Coach",
        short_name: "FitRate",
        description: "Your personal AI style coach - instant outfit feedback",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  // Production optimizations
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"]
      }
    },
    rollupOptions: {
      output: {
        // Optimized chunking for faster initial load
        manualChunks: (id) => {
          if (id.includes("node_modules/react")) {
            return "react-vendor";
          }
          if (id.includes("/screens/Results") || id.includes("/screens/Battle") || id.includes("/screens/Arena") || id.includes("/screens/FashionShow")) {
            return "screens-heavy";
          }
          if (id.includes("/modals/")) {
            return "modals";
          }
          if (id.includes("/utils/")) {
            return "utils";
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
    include: ["react", "react-dom"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuYXRoYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXEZpdFJhdGUuQXBwXFxcXGZpdHJhdGUtZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG5hdGhhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcRml0UmF0ZS5BcHBcXFxcZml0cmF0ZS1mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbmF0aGEvT25lRHJpdmUvRGVza3RvcC9GaXRSYXRlLkFwcC9maXRyYXRlLWZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIC8vIEFVVE8tVVBEQVRFOiBBdXRvbWF0aWNhbGx5IGFjdGl2YXRlIG5ldyBTVyBhbmQgcmVsb2FkIHdoZW4gdXBkYXRlIGF2YWlsYWJsZVxyXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdpY29uLTE5Mi5wbmcnLCAnaWNvbi01MTIucG5nJ10sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICAvLyBJbXBvcnQgcHVzaCBub3RpZmljYXRpb24gaGFuZGxlciBpbnRvIGdlbmVyYXRlZCBzZXJ2aWNlIHdvcmtlclxyXG4gICAgICAgIGltcG9ydFNjcmlwdHM6IFsncHVzaC1oYW5kbGVyLmpzJ10sXHJcbiAgICAgICAgLy8gQUdHUkVTU0lWRSBVUERBVEU6IFNraXAgd2FpdGluZyBhbmQgY2xhaW0gYWxsIGNsaWVudHMgaW1tZWRpYXRlbHlcclxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcclxuICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXHJcbiAgICAgICAgLy8gQ2xlYW4gdXAgb2xkIGNhY2hlcyBmcm9tIHByZXZpb3VzIHZlcnNpb25zXHJcbiAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxyXG4gICAgICAgIC8vIFNQQSBOYXZpZ2F0aW9uOiBGYWxsYmFjayB0byBpbmRleC5odG1sIGZvciBuYXZpZ2F0aW9uIHJlcXVlc3RzXHJcbiAgICAgICAgLy8gVGhpcyBpcyBjcml0aWNhbCBmb3IgUFdBIHRvIGhhbmRsZSBjbGllbnQtc2lkZSByb3V0aW5nIGNvcnJlY3RseVxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICdpbmRleC5odG1sJyxcclxuICAgICAgICAvLyBFeGNsdWRlIHRoZXNlIHJvdXRlcyBmcm9tIG5hdmlnYXRlRmFsbGJhY2sgc2luY2UgdGhleSBoYXZlIGVkZ2UgZnVuY3Rpb25zXHJcbiAgICAgICAgLy8gdGhhdCBuZWVkIHRvIHJ1biBmb3IgT0cgbWV0YSB0YWcgaW5qZWN0aW9uXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbXHJcbiAgICAgICAgICAvXlxcL2JcXC8vLCAvLyBCYXR0bGUgcm9vbXNcclxuICAgICAgICAgIC9eXFwvY1xcLy8sIC8vIENoYWxsZW5nZSByb29tcyAgXHJcbiAgICAgICAgICAvXlxcL2ZcXC8vLCAvLyBGYXNoaW9uIHNob3dzXHJcbiAgICAgICAgICAvXlxcL2Fib3V0XFwuaHRtbCQvLFxyXG4gICAgICAgICAgL15cXC9wcml2YWN5XFwuaHRtbCQvLFxyXG4gICAgICAgICAgL15cXC90ZXJtc1xcLmh0bWwkL1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgLy8gRXhjbHVkZSBIVE1MIGZpbGVzIHdpdGggcmVkaXJlY3RzIGZyb20gcHJlY2FjaGluZ1xyXG4gICAgICAgIC8vIFRoZXNlIGFyZSBmYWxsYmFjayBmaWxlcyB0aGF0IGNvbnRhaW4gd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoKSBcclxuICAgICAgICAvLyB3aGljaCBTYWZhcmkncyBTVyBkb2Vzbid0IGxpa2Ugd2hlbiBzZXJ2ZWQgZnJvbSBjYWNoZVxyXG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MscG5nLHN2ZyxpY28sd29mZix3b2ZmMn0nXSxcclxuICAgICAgICAvLyBSdW50aW1lIGNhY2hpbmcgZm9yIEFQSSByZXF1ZXN0c1xyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZml0cmF0ZS1wcm9kdWN0aW9uXFwudXBcXC5yYWlsd2F5XFwuYXBwXFwvYXBpXFwvLyxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdhcGktY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA1IC8vIDUgbWludXRlc1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgLy8gT25seSBjYWNoZSBzdWNjZXNzZnVsIHJlc3BvbnNlcyAoMjAwKSwgbm90IHJlZGlyZWN0cyAoM3h4KVxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ0ZpdFJhdGUgLSBZb3VyIEFJIFN0eWxlIENvYWNoJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnRml0UmF0ZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdZb3VyIHBlcnNvbmFsIEFJIHN0eWxlIGNvYWNoIC0gaW5zdGFudCBvdXRmaXQgZmVlZGJhY2snLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzBhMGEwZicsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwYTBhMGYnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcclxuICAgICAgICBzY29wZTogJy8nLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ2ljb24tMTkyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29uLTUxMi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnaWNvbi01MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgLy8gUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogJ2VzMjAyMCcsXHJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxyXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBPcHRpbWl6ZWQgY2h1bmtpbmcgZm9yIGZhc3RlciBpbml0aWFsIGxvYWRcclxuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG4gICAgICAgICAgLy8gQ29yZSBSZWFjdCAtIGNhY2hlZCBsb25nIHRlcm1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL3JlYWN0JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBIZWF2eSBzY3JlZW5zIC0gbG9hZCBvbiBkZW1hbmRcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3NjcmVlbnMvUmVzdWx0cycpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvc2NyZWVucy9CYXR0bGUnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnL3NjcmVlbnMvQXJlbmEnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnL3NjcmVlbnMvRmFzaGlvblNob3cnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3NjcmVlbnMtaGVhdnknXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBNb2RhbHMgLSBsb2FkIG9uIGRlbWFuZFxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvbW9kYWxzLycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnbW9kYWxzJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gVXRpbHMgLSBzbWFsbCwgY2FjaGUgbG9uZyB0ZXJtXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy91dGlscy8nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3V0aWxzJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNzc0NvZGVTcGxpdDogZmFsc2UsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDBcclxuICB9LFxyXG4gIC8vIERldiBzZXJ2ZXIgb3B0aW1pemF0aW9uc1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG1yOiB0cnVlXHJcbiAgfSxcclxuICAvLyBPcHRpbWl6ZSBkZXBzXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddXHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9YLFNBQVMsb0JBQW9CO0FBQ2paLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBO0FBQUEsTUFFTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsZUFBZSx3QkFBd0IsZ0JBQWdCLGNBQWM7QUFB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
