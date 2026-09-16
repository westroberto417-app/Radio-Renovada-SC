import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        manifest: {
          name: 'Radio Corrientes Viva',
          short_name: 'Corrientes Viva',
          description: 'Radio Corrientes Viva - San Miguel, Corrientes. Música, noticias y reflexiones en vivo.',
          theme_color: '#ff007f',
          background_color: '#050505',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          id: '/',
          categories: ['music', 'entertainment', 'news'],
          lang: 'es',
          dir: 'ltr',
          prefer_related_applications: false,
          related_applications: [],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/logo.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-mobile.png',
              sizes: '759x1600',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Radio Corrientes Viva en Vivo'
            },
            {
              src: '/screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Reproductor Web de Radio Corrientes Viva'
            }
          ],
          shortcuts: [
            {
              name: 'Escuchar en Vivo',
              short_name: 'En Vivo',
              description: 'Sintonizar Radio Corrientes Viva',
              url: '/',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            }
          ]
        }
      })
    ],
    define: {
      // API Key removed from client bundle for security
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
