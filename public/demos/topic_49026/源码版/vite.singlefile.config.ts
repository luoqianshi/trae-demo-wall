import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 单文件构建配置：所有JS/CSS内联到index.html，支持 file:// 协议直接打开
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-single',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
  },
})
