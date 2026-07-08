import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // ECharts 按需加载后主 chunk 仍约 670 kB，属于合理范围
    chunkSizeWarningLimit: 800,
  },
})
