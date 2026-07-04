import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  root: path.resolve(__dirname, '.'),
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
