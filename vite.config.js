import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        app: './src/main.js'
      },
      output: {
        manualChunks: {
          'vendor-xlsx': ['xlsx'],
          'vendor-jspdf': ['jspdf'],
          'vendor-dompurify': ['dompurify']
        }
      }
    },
    // Optimize for performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 8000,
    strictPort: true,
    open: true,
    cors: true
  },
  preview: {
    port: 8000,
    strictPort: true,
    open: true,
    cors: true
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'NaaS Pricing Calculator',
        short_name: 'NaaS Calculator',
        description: 'Network-as-a-Service Pricing Calculator',
        theme_color: '#00a651',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@components': new URL('./src/components', import.meta.url).pathname,
      '@services': new URL('./src/services', import.meta.url).pathname,
      '@utils': new URL('./src/utils', import.meta.url).pathname
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});