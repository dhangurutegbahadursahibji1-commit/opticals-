import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Rewrites public/offline.html at build time, replacing __STORE_NAME__
// and __STORE_PHONE__ with VITE_STORE_NAME / VITE_STORE_PHONE env vars.
// This means the offline fallback page is white-label — no hardcoded store
// names or phone numbers in source.
function offlineHtmlPlugin() {
  return {
    name: 'offline-html-inject',
    closeBundle() {
      const outPath = path.resolve(__dirname, 'dist/offline.html');
      if (!fs.existsSync(outPath)) return;
      let html = fs.readFileSync(outPath, 'utf-8');
      html = html
        .replace(/__STORE_NAME__/g, process.env.VITE_STORE_NAME ?? 'Our Store')
        .replace(/__STORE_PHONE__/g, process.env.VITE_STORE_PHONE ?? '');
      fs.writeFileSync(outPath, html);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    offlineHtmlPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: process.env.VITE_PWA_NAME ?? 'Optical Store',
        short_name: process.env.VITE_PWA_SHORT_NAME ?? 'OpticalStore',
        description:
          process.env.VITE_PWA_DESCRIPTION ??
          'Premium eyewear — frames, sunglasses, eye tests & virtual try-on.',
        theme_color: '#0B1D3A',
        background_color: '#F8F5F0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Immediately activate the new SW instead of waiting for all tabs to close.
        // Without this, users on an old SW keep hitting stale caches after a deploy.
        skipWaiting: true,
        clientsClaim: true,
        // Purge caches from previous SW versions on activation.
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        // Never let the SW intercept /assets/* — those requests must always go
        // to the network so Vercel serves the real JS/CSS with correct MIME types.
        navigateFallbackDenylist: [/^\/assets\//],
        runtimeCaching: [
          // Images: safe to cache aggressively (content-hashed filenames).
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Scripts & styles: NetworkFirst so a fresh deploy is always picked up.
          // Falls back to cache only when offline — never serves stale HTML as JS.
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources',
              networkTimeoutSeconds: 5,
            },
          },
          // API calls: NetworkFirst with a short timeout.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
});