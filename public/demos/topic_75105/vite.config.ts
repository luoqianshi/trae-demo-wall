﻿﻿﻿import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：前端开发服务器，/api 请求代理到本地后端
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
