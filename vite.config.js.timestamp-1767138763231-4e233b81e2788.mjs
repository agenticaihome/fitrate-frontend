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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuYXRoYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXEZpdFJhdGUuQXBwXFxcXGZpdHJhdGUtZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG5hdGhhXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcRml0UmF0ZS5BcHBcXFxcZml0cmF0ZS1mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbmF0aGEvT25lRHJpdmUvRGVza3RvcC9GaXRSYXRlLkFwcC9maXRyYXRlLWZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIC8vIEFVVE8tVVBEQVRFOiBBdXRvbWF0aWNhbGx5IGFjdGl2YXRlIG5ldyBTVyBhbmQgcmVsb2FkIHdoZW4gdXBkYXRlIGF2YWlsYWJsZVxyXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdpY29uLTE5Mi5wbmcnLCAnaWNvbi01MTIucG5nJ10sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICAvLyBJbXBvcnQgcHVzaCBub3RpZmljYXRpb24gaGFuZGxlciBpbnRvIGdlbmVyYXRlZCBzZXJ2aWNlIHdvcmtlclxyXG4gICAgICAgIGltcG9ydFNjcmlwdHM6IFsncHVzaC1oYW5kbGVyLmpzJ10sXHJcbiAgICAgICAgLy8gQUdHUkVTU0lWRSBVUERBVEU6IFNraXAgd2FpdGluZyBhbmQgY2xhaW0gYWxsIGNsaWVudHMgaW1tZWRpYXRlbHlcclxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcclxuICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXHJcbiAgICAgICAgLy8gQ2xlYW4gdXAgb2xkIGNhY2hlcyBmcm9tIHByZXZpb3VzIHZlcnNpb25zXHJcbiAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxyXG4gICAgICAgIC8vIFJ1bnRpbWUgY2FjaGluZyBmb3IgQVBJIHJlcXVlc3RzXHJcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9maXRyYXRlLXByb2R1Y3Rpb25cXC51cFxcLnJhaWx3YXlcXC5hcHBcXC9hcGlcXC8vLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya0ZpcnN0JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2FwaS1jYWNoZScsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDUgLy8gNSBtaW51dGVzXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAvLyBPbmx5IGNhY2hlIHN1Y2Nlc3NmdWwgcmVzcG9uc2VzICgyMDApLCBub3QgcmVkaXJlY3RzICgzeHgpXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnRml0UmF0ZSAtIFlvdXIgQUkgU3R5bGUgQ29hY2gnLFxyXG4gICAgICAgIHNob3J0X25hbWU6ICdGaXRSYXRlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgcGVyc29uYWwgQUkgc3R5bGUgY29hY2ggLSBpbnN0YW50IG91dGZpdCBmZWVkYmFjaycsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMGEwYTBmJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzBhMGEwZicsXHJcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQnLFxyXG4gICAgICAgIHNjb3BlOiAnLycsXHJcbiAgICAgICAgc3RhcnRfdXJsOiAnLycsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnaWNvbi0xOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ2ljb24tNTEyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdpY29uLTUxMi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgXSxcclxuICAvLyBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcclxuICBidWlsZDoge1xyXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcclxuICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXHJcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIC8vIE9wdGltaXplZCBjaHVua2luZyBmb3IgZmFzdGVyIGluaXRpYWwgbG9hZFxyXG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XHJcbiAgICAgICAgICAvLyBDb3JlIFJlYWN0IC0gY2FjaGVkIGxvbmcgdGVybVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcmVhY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcidcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEhlYXZ5IHNjcmVlbnMgLSBsb2FkIG9uIGRlbWFuZFxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvc2NyZWVucy9SZXN1bHRzJykgfHxcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9zY3JlZW5zL0JhdHRsZScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvc2NyZWVucy9BcmVuYScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvc2NyZWVucy9GYXNoaW9uU2hvdycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnc2NyZWVucy1oZWF2eSdcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIE1vZGFscyAtIGxvYWQgb24gZGVtYW5kXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9tb2RhbHMvJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdtb2RhbHMnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBVdGlscyAtIHNtYWxsLCBjYWNoZSBsb25nIHRlcm1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3V0aWxzLycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndXRpbHMnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMFxyXG4gIH0sXHJcbiAgLy8gRGV2IHNlcnZlciBvcHRpbWl6YXRpb25zXHJcbiAgc2VydmVyOiB7XHJcbiAgICBobXI6IHRydWVcclxuICB9LFxyXG4gIC8vIE9wdGltaXplIGRlcHNcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJ11cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1gsU0FBUyxvQkFBb0I7QUFDalosT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUV4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUE7QUFBQSxNQUVOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxlQUFlLHdCQUF3QixnQkFBZ0IsY0FBYztBQUFBLE1BQ3JG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
