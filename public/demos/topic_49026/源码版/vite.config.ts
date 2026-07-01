import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Demo 模式：base 设为相对路径，评委可直接打开 index.html
  base: process.env.DEMO_BUILD ? './' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将第三方依赖拆分为独立 chunk，提升缓存命中率与首屏加载速度
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('ai') || id.includes('@ai-sdk')) {
              return 'vendor-ai'
            }
            if (id.includes('dexie')) {
              return 'vendor-db'
            }
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['server/__tests__/**', '**/node_modules/**'],
  },
})
