import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const pwaManifest = {
  name: 'NeuroFlow',
  short_name: 'NeuroFlow',
  theme_color: '#09090b',
  background_color: '#09090b',
  display: 'standalone',
  orientation: 'portrait',
  start_url: '/',
  scope: '/',
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ]
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/backup-standalone/**'],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      // Keep plugin registered so virtual:pwa-register resolves in dev; dev SW stays disabled.
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: false },
        includeAssets: ['favicon.png'],
        manifest: pwaManifest,
      })
    ],
    optimizeDeps: {
      include: ['react-window', 'react-virtualized-auto-sizer'],
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-recharts': ['recharts'],
            'vendor-lucide': ['lucide-react'],
          }
        }
      }
    }
  };
});
