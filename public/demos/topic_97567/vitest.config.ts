import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // 修复: 多个测试文件共享 data/local-db.json，并行运行会导致数据竞争
    fileParallelism: false,
    // 修复: 测试使用独立的测试数据文件，防止 resetData() 删除生产数据
    env: {
      LOCAL_DB_FILE: path.resolve(__dirname, 'data/.test-local-db.json'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
