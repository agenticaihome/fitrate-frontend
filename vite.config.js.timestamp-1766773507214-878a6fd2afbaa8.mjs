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
        manualChunks: {
          vendor: ["react", "react-dom"]
        }
      }
    },
    cssCodeSplit: false,
    sourcemap: false,
    chunkSizeWarningLimit: 500
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuYXRoYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXEZpdFJhdGUuQXBwXFxcXGZpdHJhdGUtZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG5hdGhhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcRml0UmF0ZS5BcHBcXFxcZml0cmF0ZS1mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbmF0aGEvT25lRHJpdmUvRGVza3RvcC9GaXRSYXRlLkFwcC9maXRyYXRlLWZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgLy8gQVVUTy1VUERBVEU6IEF1dG9tYXRpY2FsbHkgYWN0aXZhdGUgbmV3IFNXIGFuZCByZWxvYWQgd2hlbiB1cGRhdGUgYXZhaWxhYmxlXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnaWNvbi0xOTIucG5nJywgJ2ljb24tNTEyLnBuZyddLFxuICAgICAgd29ya2JveDoge1xuICAgICAgICAvLyBJbXBvcnQgcHVzaCBub3RpZmljYXRpb24gaGFuZGxlciBpbnRvIGdlbmVyYXRlZCBzZXJ2aWNlIHdvcmtlclxuICAgICAgICBpbXBvcnRTY3JpcHRzOiBbJ3B1c2gtaGFuZGxlci5qcyddLFxuICAgICAgICAvLyBBR0dSRVNTSVZFIFVQREFURTogU2tpcCB3YWl0aW5nIGFuZCBjbGFpbSBhbGwgY2xpZW50cyBpbW1lZGlhdGVseVxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxuICAgICAgICAvLyBDbGVhbiB1cCBvbGQgY2FjaGVzIGZyb20gcHJldmlvdXMgdmVyc2lvbnNcbiAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxuICAgICAgICAvLyBSdW50aW1lIGNhY2hpbmcgZm9yIEFQSSByZXF1ZXN0c1xuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZml0cmF0ZS1wcm9kdWN0aW9uXFwudXBcXC5yYWlsd2F5XFwuYXBwXFwvYXBpXFwvLyxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdhcGktY2FjaGUnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA1IC8vIDUgbWludXRlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogJ0ZpdFJhdGUgLSBZb3VyIEFJIFN0eWxlIENvYWNoJyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ0ZpdFJhdGUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgcGVyc29uYWwgQUkgc3R5bGUgY29hY2ggLSBpbnN0YW50IG91dGZpdCBmZWVkYmFjaycsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzBhMGEwZicsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMGEwYTBmJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcbiAgICAgICAgc2NvcGU6ICcvJyxcbiAgICAgICAgc3RhcnRfdXJsOiAnLycsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaWNvbi0xOTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaWNvbi01MTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaWNvbi01MTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgLy8gUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddXG4gICAgICB9XG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNzc0NvZGVTcGxpdDogZmFsc2UsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMFxuICB9LFxuICAvLyBEZXYgc2VydmVyIG9wdGltaXphdGlvbnNcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB0cnVlXG4gIH0sXG4gIC8vIE9wdGltaXplIGRlcHNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nXVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvWCxTQUFTLG9CQUFvQjtBQUNqWixPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBRXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQTtBQUFBLE1BRU4sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGdCQUFnQixjQUFjO0FBQUEsTUFDckYsU0FBUztBQUFBO0FBQUEsUUFFUCxlQUFlLENBQUMsaUJBQWlCO0FBQUE7QUFBQSxRQUVqQyxhQUFhO0FBQUEsUUFDYixjQUFjO0FBQUE7QUFBQSxRQUVkLHVCQUF1QjtBQUFBO0FBQUEsUUFFdkIsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBLFlBQ0UsWUFBWTtBQUFBLFlBQ1osU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUs7QUFBQTtBQUFBLGNBQ3RCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsUUFDZixZQUFZLENBQUMsZUFBZSxnQkFBZ0IsZUFBZTtBQUFBLE1BQzdEO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFFBQy9CO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxJQUNkLFdBQVc7QUFBQSxJQUNYLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLEtBQUs7QUFBQSxFQUNQO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLFdBQVc7QUFBQSxFQUNoQztBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
