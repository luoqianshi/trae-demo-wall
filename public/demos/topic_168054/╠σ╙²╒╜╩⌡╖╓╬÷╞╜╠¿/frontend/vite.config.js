import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite配置文件
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 代理API请求到后端服务
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
