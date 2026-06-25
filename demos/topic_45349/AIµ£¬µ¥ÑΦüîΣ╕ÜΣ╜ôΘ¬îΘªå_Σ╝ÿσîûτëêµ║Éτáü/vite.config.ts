import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// 单文件构建适合比赛提交；源码模式仍保持标准 Vite 项目结构。
export default defineConfig({
  build: {
    sourcemap: false,
  },
  plugins: [
    react(),
    viteSingleFile(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root',
    }),
    tsconfigPaths(),
  ],
});
