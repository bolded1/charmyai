import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache API calls to Supabase for offline document viewing
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/documents/,
            handler: "NetworkFirst",
            options: {
              cacheName: "documents-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache storage objects (document thumbnails, etc.)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//,
            handler: "CacheFirst",
            options: {
              cacheName: "storage-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: "Charmy - AI Financial Document Processing",
        short_name: "Charmy",
        description: "Turn invoices and receipts into accounting data automatically.",
        theme_color: "#2563EB",
        background_color: "#f5f6fa",
        display: "standalone",
        scope: "/",
        start_url: "/app",
        orientation: "any",
        categories: ["business", "finance", "productivity"],
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Upload Document",
            short_name: "Upload",
            description: "Upload a new document for processing",
            url: "/app/upload",
            icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Scan Receipt",
            short_name: "Scan",
            description: "Scan a receipt with your camera",
            url: "/app?scan=true",
            icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Review Documents",
            short_name: "Review",
            description: "Open the document review queue",
            url: "/app/documents",
            icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
