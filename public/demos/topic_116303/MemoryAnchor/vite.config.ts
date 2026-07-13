import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  root: 'src/renderer', // Entry point: index.html is in src/renderer/

  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'src/main/index.ts',
        onstart(options) {
          // vite-plugin-electron v1 spawns `electron .` with cwd = Vite `root`
          // (here 'src/renderer'), which has no package.json — Electron would
          // load its default app ("Unable to find Electron app at .../src/renderer").
          // Override cwd back to the project root so `electron .` resolves the
          // real app via package.json "main" (dist/main/index.js).
          options.startup(['.', '--no-sandbox'], { cwd: __dirname });
        },
        vite: {
          root: __dirname, // override global root - main process resolves from project root
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: [
                'electron',
                'better-sqlite3',
                'puppeteer-core',
                '@mendable/firecrawl-js',
                '@zvec/zvec'
              ]
            }
          }
        }
      },
      {
        // Preload scripts
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          root: __dirname, // override global root - preload resolves from project root
          build: {
            outDir: 'dist/main'
          }
        }
      }
    ]),
    renderer()
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@pages': path.resolve(__dirname, './src/renderer/pages'),
      '@store': path.resolve(__dirname, './src/renderer/store'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@utils': path.resolve(__dirname, './src/renderer/utils'),
      '@types': path.resolve(__dirname, './src/renderer/types')
    }
  },

  build: {
    outDir: '../../dist/renderer', // relative to root (src/renderer/)
    emptyOutDir: true,
    sourcemap: true,
    // No explicit rollup `input`: Vite resolves the entry as `<root>/index.html`
    // (src/renderer/index.html). Specifying `input: 'index.html'` here would be
    // resolved relative to CWD and break `vite build`.
  },

  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      'lucide-react'
    ]
  }
});